// 파일 위치: pages/api/projects.js
// Google Sheets API를 통해 프로젝트 데이터를 읽고 씁니다.

import { google } from "googleapis";

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const sheets = await getSheets();

    // ── GET: 데이터 불러오기 ──────────────────────────────────────────
    if (req.method === "GET") {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!A1",
      });

      const raw = response.data.values?.[0]?.[0];
      if (!raw) {
        return res.status(200).json({ projects: [] });
      }

      return res.status(200).json({ projects: JSON.parse(raw) });
    }

    // ── POST: 데이터 저장하기 ─────────────────────────────────────────
    if (req.method === "POST") {
      const { projects } = req.body;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!A1",
        valueInputOption: "RAW",
        requestBody: {
          values: [[JSON.stringify(projects)]],
        },
      });

      // B1에 마지막 저장 시간도 기록
      const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: "Data!B1",
        valueInputOption: "RAW",
        requestBody: { values: [[now]] },
      });

      return res.status(200).json({ ok: true, savedAt: now });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Sheets API error:", err);
    res.status(500).json({ error: err.message });
  }
}
