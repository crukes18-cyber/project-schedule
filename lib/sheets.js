// lib/sheets.js
// Google Sheets를 데이터베이스로 사용하는 유틸리티
import { google } from "googleapis";

// 환경변수에서 인증 정보 로드
function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}");
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return auth;
}

function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// ============================================================
// 태스크 데이터 읽기
// ============================================================
export async function getTasks() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "태스크관리!A2:K100",
  });

  const rows = res.data.values || [];
  const tasks = rows
    .filter((row) => row[0] && row[2]) // No가 있고 태스크명이 있는 행만
    .map((row) => ({
      id: parseInt(row[0]) || 0,
      project: row[1] || "",
      name: row[2] || "",
      assignee: row[3] || "",
      email: row[4] || "",
      start: row[5] || "",
      end: row[6] || "",
      status: row[7] || "Todo",
      progress: parseInt(row[8]) || 0,
      note: row[10] || "",
    }));

  // 프로젝트별로 그룹핑
  const projectMap = {};
  const projectColors = ["#378ADD", "#1D9E75", "#D85A30", "#D4537E", "#BA7517", "#7F77DD"];
  let colorIdx = 0;

  tasks.forEach((task) => {
    if (!projectMap[task.project]) {
      projectMap[task.project] = {
        id: colorIdx + 1,
        name: task.project,
        color: projectColors[colorIdx % projectColors.length],
        tasks: [],
      };
      colorIdx++;
    }
    projectMap[task.project].tasks.push(task);
  });

  return Object.values(projectMap);
}

// ============================================================
// 태스크 상태 업데이트
// ============================================================
export async function updateTaskStatus(taskId, newStatus) {
  const sheets = getSheets();

  // 먼저 해당 태스크의 행 번호 찾기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "태스크관리!A2:A100",
  });

  const rows = res.data.values || [];
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === taskId) {
      rowIndex = i + 2; // 헤더가 1행이므로 +2
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: "Task not found" };

  // 상태 업데이트 (H열)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `태스크관리!H${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[newStatus]] },
  });

  // Done이면 진행률 100으로
  if (newStatus === "Done") {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `태스크관리!I${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[100]] },
    });
  }

  return { success: true };
}

// ============================================================
// 새 태스크 추가
// ============================================================
export async function addTask(task) {
  const sheets = getSheets();

  // 현재 마지막 No 찾기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "태스크관리!A2:A100",
  });

  const rows = res.data.values || [];
  const maxId = rows.reduce((max, row) => Math.max(max, parseInt(row[0]) || 0), 0);
  const newId = maxId + 1;

  // 새 행 추가
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "태스크관리!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          newId,
          task.project,
          task.name,
          task.assignee,
          task.email || "",
          task.start,
          task.end,
          task.status || "Todo",
          task.progress || 0,
          "", // D-Day는 수식으로 자동 계산
          task.note || "",
        ],
      ],
    },
  });

  return { success: true, id: newId };
}

// ============================================================
// 태스크 삭제
// ============================================================
export async function deleteTask(taskId) {
  const sheets = getSheets();

  // 행 번호 찾기
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "태스크관리!A2:A100",
  });

  const rows = res.data.values || [];
  let rowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (parseInt(rows[i][0]) === taskId) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, error: "Task not found" };

  // 해당 행의 데이터를 비움 (시트에서 행 삭제 대신 클리어)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `태스크관리!A${rowIndex}:K${rowIndex}`,
  });

  return { success: true };
}
