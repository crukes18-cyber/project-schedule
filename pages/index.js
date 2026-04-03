// pages/index.js
import { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";

const STATUS_COLORS = { Todo: "#888780", "In Progress": "#378ADD", Done: "#1D9E75" };
const STATUS_BG = { Todo: "#F1EFE8", "In Progress": "#E6F1FB", Done: "#EAF3DE" };

const fmt = (d) => d.toISOString().split("T")[0];
const parseDate = (s) => new Date(s + "T00:00:00");
const diffDays = (a, b) => Math.round((b - a) / 86400000);
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const TEAM = ["김은석", "이지은", "박성민", "최현아"];
const EMAILS = { 김은석: "eunseok@woojoo.com", 이지은: "jieun@woojoo.com", 박성민: "sungmin@woojoo.com", 최현아: "hyuna@woojoo.com" };

export default function Home() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState("gantt");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [newTask, setNewTask] = useState({ name: "", assignee: TEAM[0], project: "", start: fmt(today), end: fmt(addDays(today, 7)), status: "Todo" });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // ============================================================
  // 데이터 로드 (Google Sheets에서)
  // ============================================================
  const fetchTasks = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("데이터를 불러올 수 없습니다");
      const data = await res.json();
      setProjects(data.projects);
      setExpandedProjects(new Set(data.projects.map((p) => p.id)));
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // 30초마다 자동 새로고침 (다른 팀원의 변경사항 반영)
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const allTasks = useMemo(() => projects.flatMap((p) => p.tasks.map((t) => ({ ...t, projectName: p.name, projectColor: p.color, projectId: p.id }))), [projects]);

  const dateRange = useMemo(() => {
    if (!allTasks.length) return { start: addDays(today, -7), end: addDays(today, 30) };
    let min = parseDate(allTasks[0].start), max = parseDate(allTasks[0].end);
    allTasks.forEach((t) => {
      const s = parseDate(t.start), e = parseDate(t.end);
      if (s < min) min = s;
      if (e > max) max = e;
    });
    return { start: addDays(min, -3), end: addDays(max, 3) };
  }, [allTasks, today]);

  const totalDays = diffDays(dateRange.start, dateRange.end);

  const toggleProject = (id) => {
    setExpandedProjects((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  // ============================================================
  // Google Sheets에 상태 업데이트
  // ============================================================
  const updateTaskStatus = async (projectId, taskId, status) => {
    // 즉시 UI 반영 (낙관적 업데이트)
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status } : t) } : p));
    showToast(`상태 → "${status}" 저장 중...`);

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });
      if (!res.ok) throw new Error();
      showToast(`✓ 상태가 "${status}"로 저장되었습니다`);
    } catch {
      showToast("⚠ 저장 실패 - 다시 시도해주세요");
      fetchTasks(); // 실패 시 서버 데이터로 롤백
    }
  };

  // ============================================================
  // 태스크 추가 → Google Sheets
  // ============================================================
  const handleAddTask = async (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !newTask.name) return;

    const task = {
      project: project.name,
      name: newTask.name,
      assignee: newTask.assignee,
      email: EMAILS[newTask.assignee] || "",
      start: newTask.start,
      end: newTask.end,
      status: "Todo",
      progress: 0,
    };

    setModal(null);
    showToast("태스크 추가 중...");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error();
      showToast("✓ 태스크가 추가되었습니다");
      fetchTasks(); // 새로고침
    } catch {
      showToast("⚠ 추가 실패 - 다시 시도해주세요");
    }

    setNewTask({ name: "", assignee: TEAM[0], project: "", start: fmt(today), end: fmt(addDays(today, 7)), status: "Todo" });
  };

  // ============================================================
  // 태스크 삭제 → Google Sheets
  // ============================================================
  const handleDeleteTask = async (projectId, taskId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p));
    showToast("삭제 중...");

    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) throw new Error();
      showToast("✓ 삭제되었습니다");
    } catch {
      showToast("⚠ 삭제 실패");
      fetchTasks();
    }
  };

  // ============================================================
  // 스타일
  // ============================================================
  const s = {
    container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1100, margin: "0 auto", padding: "16px 20px", color: "#1a1a1a", fontSize: 13, minHeight: "100vh", background: "#fafafa" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 },
    title: { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
    tabs: { display: "flex", gap: 2, background: "#f0f0ec", borderRadius: 8, padding: 2 },
    tab: (active) => ({ padding: "6px 14px", borderRadius: 6, border: "none", background: active ? "#fff" : "transparent", fontWeight: active ? 600 : 400, fontSize: 12, cursor: "pointer", color: active ? "#1a1a1a" : "#666", boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }),
    card: { background: "#fff", border: "1px solid #e8e8e4", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
    projectHeader: () => ({ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0ec", userSelect: "none" }),
    dot: (color) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
    ganttRow: { display: "flex", alignItems: "center", borderBottom: "1px solid #f5f5f2", minHeight: 36 },
    ganttLabel: { width: 200, minWidth: 200, padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
    ganttTrack: { flex: 1, position: "relative", height: 36 },
    bar: (left, width, color) => ({ position: "absolute", top: 8, height: 20, left: `${left}%`, width: `${Math.max(width, 1)}%`, background: color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 500, cursor: "default", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }),
    todayLine: (left) => ({ position: "absolute", top: 0, bottom: 0, left: `${left}%`, width: 1.5, background: "#EF4444", zIndex: 5, pointerEvents: "none" }),
    statusBadge: (status) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500, background: STATUS_BG[status], color: STATUS_COLORS[status] }),
    btn: (type) => ({ padding: "6px 14px", borderRadius: 6, border: type === "primary" ? "none" : "1px solid #ddd", background: type === "primary" ? "#378ADD" : "#fff", color: type === "primary" ? "#fff" : "#333", fontSize: 12, fontWeight: 500, cursor: "pointer" }),
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalBox: { background: "#fff", borderRadius: 12, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" },
    input: { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, boxSizing: "border-box" },
    select: { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, background: "#fff" },
    label: { display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4, color: "#666" },
    syncBar: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#999" },
  };

  const todayLeft = Math.max(0, Math.min(100, (diffDays(dateRange.start, today) / totalDays) * 100));

  // Date headers for gantt
  const dateHeaders = useMemo(() => {
    const headers = [];
    let current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      const dayOfWeek = current.getDay();
      headers.push({ date: new Date(current), day: current.getDate(), isWeekend: dayOfWeek === 0 || dayOfWeek === 6, isToday: fmt(current) === fmt(today) });
      current = addDays(current, 1);
    }
    return headers;
  }, [dateRange, today]);

  // Calendar
  const calendarData = useMemo(() => {
    const year = today.getFullYear(), month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = [];
    let week = Array(7).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const idx = (firstDay + d - 1) % 7;
      if (idx === 0 && d > 1) { weeks.push(week); week = Array(7).fill(null); }
      const dateStr = fmt(new Date(year, month, d));
      const tasks = allTasks.filter((t) => t.start <= dateStr && t.end >= dateStr);
      week[idx] = { day: d, date: dateStr, tasks, isToday: d === today.getDate() };
    }
    weeks.push(week);
    return { weeks, monthLabel: today.toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) };
  }, [allTasks, today]);

  // ============================================================
  // 로딩/에러 상태
  // ============================================================
  if (loading) {
    return (
      <div style={{ ...s.container, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, color: "#666" }}>Google Sheets에서 데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (error && !projects.length) {
    return (
      <div style={{ ...s.container, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, color: "#EF4444", marginBottom: 8 }}>{error}</div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>Google Sheets API 연결을 확인해주세요</div>
          <button style={s.btn("primary")} onClick={fetchTasks}>다시 시도</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 렌더링
  // ============================================================
  const renderGantt = () => (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", marginLeft: 200, borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ flex: 1, display: "flex" }}>
          {dateHeaders.map((h, i) => (
            <div key={i} style={{ flex: 1, minWidth: 24, textAlign: "center", fontSize: 9, padding: "4px 0", background: h.isToday ? "#FEF2F2" : h.isWeekend ? "#fafaf5" : "transparent", color: h.isToday ? "#EF4444" : h.isWeekend ? "#bbb" : "#888", fontWeight: h.isToday ? 700 : 400, borderRight: "1px solid #f5f5f2" }}>
              {h.day}
            </div>
          ))}
        </div>
      </div>
      {projects.map((project) => (
        <div key={project.id} style={s.card}>
          <div style={s.projectHeader()} onClick={() => toggleProject(project.id)}>
            <span style={{ fontSize: 10, transform: expandedProjects.has(project.id) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
            <span style={s.dot(project.color)} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>{project.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>{project.tasks.length}개 태스크</span>
          </div>
          {expandedProjects.has(project.id) && project.tasks.map((task) => {
            const taskStart = diffDays(dateRange.start, parseDate(task.start));
            const taskDur = diffDays(parseDate(task.start), parseDate(task.end));
            const left = (taskStart / totalDays) * 100;
            const width = (taskDur / totalDays) * 100;
            const isOverdue = task.status !== "Done" && parseDate(task.end) < today;
            return (
              <div key={task.id} style={s.ganttRow}>
                <div style={s.ganttLabel}>
                  <span style={{ ...s.statusBadge(task.status), fontSize: 9, padding: "1px 5px" }}>{task.status === "Done" ? "✓" : task.status === "In Progress" ? "◐" : "○"}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</span>
                </div>
                <div style={s.ganttTrack}>
                  <div style={s.todayLine(todayLeft)} />
                  <div style={{ ...s.bar(left, width, isOverdue ? "#EF4444" : task.status === "Done" ? STATUS_COLORS.Done : project.color), opacity: task.status === "Done" ? 0.6 : 1 }}
                    title={`${task.name}\n${task.assignee} | ${task.start} → ${task.end}\n상태: ${task.status}`}>
                    <span>{task.assignee}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderCalendar = () => (
    <div>
      <h3 style={{ textAlign: "center", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{calendarData.monthLabel}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e0e0e0", borderRadius: 10, overflow: "hidden" }}>
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} style={{ background: "#f5f5f0", padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#888" }}>{d}</div>
        ))}
        {calendarData.weeks.flat().map((cell, i) => (
          <div key={i} style={{ background: "#fff", minHeight: 80, padding: 4 }}>
            {cell && <>
              <div style={{ fontSize: 11, fontWeight: cell.isToday ? 700 : 400, color: cell.isToday ? "#EF4444" : "#333", marginBottom: 2 }}>{cell.isToday ? `● ${cell.day}` : cell.day}</div>
              {cell.tasks.slice(0, 3).map((t) => (
                <div key={t.id} style={{ fontSize: 9, padding: "1px 4px", marginBottom: 1, borderRadius: 3, background: t.projectColor + "18", color: t.projectColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{t.name}</div>
              ))}
              {cell.tasks.length > 3 && <div style={{ fontSize: 9, color: "#999" }}>+{cell.tasks.length - 3}개</div>}
            </>}
          </div>
        ))}
      </div>
    </div>
  );

  const renderList = () => (
    <div>
      {projects.map((project) => (
        <div key={project.id} style={s.card}>
          <div style={s.projectHeader()} onClick={() => toggleProject(project.id)}>
            <span style={{ fontSize: 10, transform: expandedProjects.has(project.id) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
            <span style={s.dot(project.color)} />
            <span style={{ fontWeight: 600, fontSize: 13 }}>{project.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#999" }}>{project.tasks.filter((t) => t.status === "Done").length}/{project.tasks.length} 완료</span>
          </div>
          {expandedProjects.has(project.id) && project.tasks.map((task) => {
            const isOverdue = task.status !== "Done" && parseDate(task.end) < today;
            const daysLeft = diffDays(today, parseDate(task.end));
            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid #f5f5f2", flexWrap: "wrap" }}>
                <span style={s.statusBadge(task.status)}>{task.status}</span>
                <span style={{ fontWeight: 500, fontSize: 13, flex: 1, minWidth: 120 }}>{task.name}</span>
                <span style={{ fontSize: 11, color: "#888" }}>{task.assignee}</span>
                <span style={{ fontSize: 11, color: "#aaa" }}>{task.start} → {task.end}</span>
                {isOverdue && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>⚠ {Math.abs(daysLeft)}일 초과</span>}
                {!isOverdue && task.status !== "Done" && daysLeft <= 3 && daysLeft >= 0 && <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>⏰ D-{daysLeft}</span>}
                <div style={{ display: "flex", gap: 2 }}>
                  <select style={{ ...s.select, width: "auto", padding: "2px 6px", fontSize: 11 }} value={task.status} onChange={(e) => updateTaskStatus(project.id, task.id, e.target.value)}>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                  <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 14, opacity: 0.5 }} onClick={() => handleDeleteTask(project.id, task.id)} title="삭제">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Head>
        <title>프로젝트 스케줄 관리</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>프로젝트 스케줄</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#999" }}>오늘: {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</span>
              <div style={s.syncBar}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: syncing ? "#F59E0B" : "#1D9E75" }} />
                {syncing ? "동기화 중..." : lastSync ? `${lastSync.toLocaleTimeString("ko-KR")} 동기화` : ""}
                <button onClick={fetchTasks} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0, color: "#378ADD" }} title="새로고침">↻</button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={s.tabs}>
              {[["gantt", "간트"], ["calendar", "캘린더"], ["list", "리스트"]].map(([k, v]) => (
                <button key={k} style={s.tab(view === k)} onClick={() => setView(k)}>{v}</button>
              ))}
            </div>
            <button style={s.btn("primary")} onClick={() => setModal("add")}>+ 태스크</button>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "전체", value: allTasks.length, color: "#666" },
            { label: "진행 중", value: allTasks.filter((t) => t.status === "In Progress").length, color: STATUS_COLORS["In Progress"] },
            { label: "완료", value: allTasks.filter((t) => t.status === "Done").length, color: STATUS_COLORS.Done },
            { label: "지연", value: allTasks.filter((t) => t.status !== "Done" && parseDate(t.end) < today).length, color: "#EF4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "10px 8px", background: "#fff", border: "1px solid #e8e8e4", borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>

        {view === "gantt" && renderGantt()}
        {view === "calendar" && renderCalendar()}
        {view === "list" && renderList()}

        {/* 태스크 추가 모달 */}
        {modal === "add" && (
          <div style={s.overlay} onClick={() => setModal(null)}>
            <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>태스크 추가</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={s.label}>프로젝트</label>
                  <select style={s.select} onChange={(e) => setNewTask((t) => ({ ...t, _projectId: Number(e.target.value) }))}>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>태스크명</label>
                  <input style={s.input} value={newTask.name} onChange={(e) => setNewTask((t) => ({ ...t, name: e.target.value }))} placeholder="태스크 이름 입력" />
                </div>
                <div>
                  <label style={s.label}>담당자</label>
                  <select style={s.select} value={newTask.assignee} onChange={(e) => setNewTask((t) => ({ ...t, assignee: e.target.value }))}>
                    {TEAM.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>시작일</label>
                    <input style={s.input} type="date" value={newTask.start} onChange={(e) => setNewTask((t) => ({ ...t, start: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>종료일</label>
                    <input style={s.input} type="date" value={newTask.end} onChange={(e) => setNewTask((t) => ({ ...t, end: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button style={s.btn()} onClick={() => setModal(null)}>취소</button>
                <button style={s.btn("primary")} onClick={() => handleAddTask(newTask._projectId || projects[0]?.id)} disabled={!newTask.name}>추가</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: "fixed", bottom: 24, right: 24, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 18px", fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 9999 }}>
            {toast}
          </div>
        )}
      </div>
    </>
  );
}
