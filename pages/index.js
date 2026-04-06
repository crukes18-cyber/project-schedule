// pages/index.js
import { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";

const STATUS_COLORS = { Todo: "#888780", "In Progress": "#378ADD", Done: "#1D9E75" };
const STATUS_BG = { Todo: "#F1EFE8", "In Progress": "#E6F1FB", Done: "#EAF3DE" };

const fmt = (d) => d.toISOString().split("T")[0];
const parseDate = (s) => new Date(s + "T00:00:00");
const diffDays = (a, b) => Math.round((b - a) / 86400000);
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

// ============================================================
// 🔧 여기서 담당자를 수정하세요
// ============================================================
const TEAM = ["김은석", "이지은", "박성민", "최현아", "정다혜"];
const EMAILS = {
  "김은석": "eunseok@woojoo.com",
  "이지은": "jieun@woojoo.com",
  "박성민": "sungmin@woojoo.com",
  "최현아": "hyuna@woojoo.com",
  "정다혜": "dahye@woojoo.com",
};

const COLORS = ["#378ADD", "#1D9E75", "#D85A30", "#D4537E", "#BA7517", "#7F77DD"];

const DEFAULT_PROJECTS = [
  {
    id: 1, name: "DNT-4034 원단 개발", color: COLORS[0],
    tasks: [
      { id: 1, name: "바이어 샘플 요청 검토", assignee: "김은석", email: "eunseok@woojoo.com", start: "2026-03-20", end: "2026-03-28", status: "In Progress" },
      { id: 2, name: "포일 프린트 테스트", assignee: "이지은", email: "jieun@woojoo.com", start: "2026-03-25", end: "2026-04-05", status: "Todo" },
      { id: 3, name: "가먼트 워시 결과 분석", assignee: "박성민", email: "sungmin@woojoo.com", start: "2026-04-01", end: "2026-04-10", status: "Todo" },
    ],
  },
  {
    id: 2, name: "Spring/Summer 소싱", color: COLORS[1],
    tasks: [
      { id: 4, name: "벤더 미팅 일정 확정", assignee: "김은석", email: "eunseok@woojoo.com", start: "2026-03-15", end: "2026-03-27", status: "Done" },
      { id: 5, name: "하이게이지 트리코트 샘플 발주", assignee: "이지은", email: "jieun@woojoo.com", start: "2026-03-28", end: "2026-04-15", status: "Todo" },
      { id: 6, name: "FTA 활용 검토", assignee: "최현아", email: "hyuna@woojoo.com", start: "2026-04-10", end: "2026-04-20", status: "Todo" },
    ],
  },
  {
    id: 3, name: "액티브웨어 신규 라인", color: COLORS[2],
    tasks: [
      { id: 7, name: "GSM 스펙 정의", assignee: "박성민", email: "sungmin@woojoo.com", start: "2026-03-22", end: "2026-04-01", status: "In Progress" },
      { id: 8, name: "S&R 테스트", assignee: "최현아", email: "hyuna@woojoo.com", start: "2026-04-02", end: "2026-04-12", status: "Todo" },
    ],
  },
];

export default function Home() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState("gantt");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [newTask, setNewTask] = useState({ name: "", assignee: TEAM[0], start: fmt(today), end: fmt(addDays(today, 7)), status: "Todo" });
  const [projectForm, setProjectForm] = useState({ name: "", color: COLORS[0] });
  const [editingProject, setEditingProject] = useState(null);

  const fetchTasks = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("API Error");
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        setExpandedProjects(new Set(data.projects.map((p) => p.id)));
        setIsOnline(true);
      } else { throw new Error("Empty"); }
      setLastSync(new Date());
    } catch {
      if (projects.length === 0) {
        setProjects(DEFAULT_PROJECTS);
        setExpandedProjects(new Set(DEFAULT_PROJECTS.map((p) => p.id)));
      }
      setIsOnline(false);
    } finally { setLoading(false); setSyncing(false); }
  }, []);

  useEffect(() => { fetchTasks(); const i = setInterval(fetchTasks, 30000); return () => clearInterval(i); }, [fetchTasks]);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);
  const allTasks = useMemo(() => projects.flatMap((p) => p.tasks.map((t) => ({ ...t, projectName: p.name, projectColor: p.color, projectId: p.id }))), [projects]);

  const dateRange = useMemo(() => {
    if (!allTasks.length) return { start: addDays(today, -7), end: addDays(today, 30) };
    let min = parseDate(allTasks[0].start), max = parseDate(allTasks[0].end);
    allTasks.forEach((t) => { const s2 = parseDate(t.start), e = parseDate(t.end); if (s2 < min) min = s2; if (e > max) max = e; });
    return { start: addDays(min, -3), end: addDays(max, 3) };
  }, [allTasks, today]);

  const totalDays = diffDays(dateRange.start, dateRange.end);

  const dateHeaders = useMemo(() => {
    const h = []; let c = new Date(dateRange.start);
    while (c <= dateRange.end) { h.push({ day: c.getDate(), isWeekend: c.getDay() === 0 || c.getDay() === 6, isToday: fmt(c) === fmt(today), dateStr: fmt(c) }); c = addDays(c, 1); }
    return h;
  }, [dateRange, today]);

  const todayIdx = dateHeaders.findIndex((h) => h.isToday);
  const todayLeft = todayIdx >= 0 ? ((todayIdx + 0.5) / dateHeaders.length) * 100 : -1;

  let nextTaskId = useMemo(() => { let max = 0; projects.forEach((p) => p.tasks.forEach((t) => { if (t.id > max) max = t.id; })); return max + 1; }, [projects]);

  const toggleProject = (id) => { setExpandedProjects((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); };

  const updateTaskStatus = async (projectId, taskId, status) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status } : t) } : p));
    if (isOnline) { try { await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, status }) }); } catch {} }
    showToast("✓ 상태 변경됨");
  };

  const handleAddTask = async (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !newTask.name) return;
    const task = { id: nextTaskId++, name: newTask.name, assignee: newTask.assignee, email: EMAILS[newTask.assignee] || "", start: newTask.start, end: newTask.end, status: "Todo", progress: 0 };
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p));
    setModal(null);
    setNewTask({ name: "", assignee: TEAM[0], start: fmt(today), end: fmt(addDays(today, 7)), status: "Todo" });
    if (isOnline) { try { await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...task, project: project.name }) }); fetchTasks(); } catch {} }
    showToast("✓ 태스크 추가됨");
  };

  const handleDeleteTask = async (projectId, taskId) => {
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p));
    if (isOnline) { try { await fetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId }) }); } catch {} }
    showToast("✓ 삭제됨");
  };

  const handleAddProject = () => {
    if (!projectForm.name.trim()) return;
    const maxId = projects.reduce((max, p) => Math.max(max, p.id), 0);
    const np = { id: maxId + 1, name: projectForm.name.trim(), color: projectForm.color, tasks: [] };
    setProjects((prev) => [...prev, np]);
    setExpandedProjects((prev) => new Set([...prev, np.id]));
    setModal(null);
    setProjectForm({ name: "", color: COLORS[(maxId + 1) % COLORS.length] });
    showToast("✓ 프로젝트 추가됨");
  };

  const openEditProject = (project) => { setEditingProject(project); setProjectForm({ name: project.name, color: project.color }); setModal("editProject"); };

  const handleEditProject = () => {
    if (!projectForm.name.trim() || !editingProject) return;
    setProjects((prev) => prev.map((p) => p.id === editingProject.id ? { ...p, name: projectForm.name.trim(), color: projectForm.color } : p));
    setModal(null); setEditingProject(null); setProjectForm({ name: "", color: COLORS[0] });
    showToast("✓ 프로젝트 수정됨");
  };

  const handleDeleteProject = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    if (project.tasks.length > 0 && !confirm(`"${project.name}"에 ${project.tasks.length}개 태스크가 있습니다. 삭제하시겠습니까?`)) return;
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    showToast("✓ 프로젝트 삭제됨");
  };

  const s = {
    container: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1100, margin: "0 auto", padding: "16px 20px", color: "#1a1a1a", fontSize: 13, minHeight: "100vh", background: "#fafafa" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 },
    title: { fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.5 },
    tabs: { display: "flex", gap: 2, background: "#f0f0ec", borderRadius: 8, padding: 2 },
    tab: (a) => ({ padding: "6px 14px", borderRadius: 6, border: "none", background: a ? "#fff" : "transparent", fontWeight: a ? 600 : 400, fontSize: 12, cursor: "pointer", color: a ? "#1a1a1a" : "#666", boxShadow: a ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }),
    card: { background: "#fff", border: "1px solid #e8e8e4", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
    pHeader: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #f0f0ec", userSelect: "none" },
    dot: (c) => ({ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }),
    ganttRow: { display: "flex", alignItems: "center", borderBottom: "1px solid #f5f5f2", minHeight: 36 },
    ganttLabel: { width: 200, minWidth: 200, padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
    ganttTrack: { flex: 1, position: "relative", height: 36 },
    bar: (l, w, c) => ({ position: "absolute", top: 8, height: 20, left: `${l}%`, width: `${Math.max(w, 1)}%`, background: c, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px" }),
    todayLine: (l) => ({ position: "absolute", top: 0, bottom: 0, left: `${l}%`, width: 1.5, background: "#EF4444", zIndex: 5, pointerEvents: "none" }),
    badge: (st) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 500, background: STATUS_BG[st], color: STATUS_COLORS[st] }),
    btn: (t) => ({ padding: "6px 14px", borderRadius: 6, border: t === "primary" ? "none" : "1px solid #ddd", background: t === "primary" ? "#378ADD" : "#fff", color: t === "primary" ? "#fff" : "#333", fontSize: 12, fontWeight: 500, cursor: "pointer" }),
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    modalBox: { background: "#fff", borderRadius: 12, padding: 24, width: 420, maxWidth: "90vw", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" },
    input: { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, boxSizing: "border-box" },
    select: { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 12, background: "#fff" },
    label: { display: "block", fontSize: 11, fontWeight: 600, marginBottom: 4, color: "#666" },
    ib: { background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 13, opacity: 0.4, lineHeight: 1 },
  };

  const calendarData = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth(), fd = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
    const weeks = []; let week = Array(7).fill(null);
    for (let d = 1; d <= dim; d++) {
      const idx = (fd + d - 1) % 7;
      if (idx === 0 && d > 1) { weeks.push(week); week = Array(7).fill(null); }
      const ds = fmt(new Date(y, m, d));
      week[idx] = { day: d, date: ds, tasks: allTasks.filter((t) => t.start <= ds && t.end >= ds), isToday: d === today.getDate() };
    }
    weeks.push(week);
    return { weeks, monthLabel: today.toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) };
  }, [allTasks, today]);

  if (loading) return (<div style={{ ...s.container, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 28, marginBottom: 12 }}>📊</div><div style={{ fontSize: 14, color: "#666" }}>데이터를 불러오는 중...</div></div></div>);

  const renderProjectHeader = (project) => (
    <div style={s.pHeader}>
      <span style={{ fontSize: 10, transform: expandedProjects.has(project.id) ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s", cursor: "pointer" }} onClick={() => toggleProject(project.id)}>▶</span>
      <span style={s.dot(project.color)} onClick={() => toggleProject(project.id)} />
      <span style={{ fontWeight: 600, fontSize: 13, flex: 1, cursor: "pointer" }} onClick={() => toggleProject(project.id)}>{project.name}</span>
      <span style={{ fontSize: 11, color: "#999", marginRight: 8 }}>{project.tasks.length}개</span>
      <button style={s.ib} onClick={() => openEditProject(project)} title="수정">✏️</button>
      <button style={s.ib} onClick={() => handleDeleteProject(project.id)} title="삭제">🗑</button>
    </div>
  );

  return (
    <>
      <Head><title>프로젝트 스케줄 - 우주글로벌</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>
      <div style={s.container}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>프로젝트 스케줄</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#999" }}>오늘: {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#999" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? (syncing ? "#F59E0B" : "#1D9E75") : "#EF4444" }} />
                {isOnline ? (syncing ? "동기화 중..." : lastSync ? `${lastSync.toLocaleTimeString("ko-KR")} 동기화` : "") : "오프라인 모드"}
                <button onClick={fetchTasks} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0, color: "#378ADD" }}>↻</button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={s.tabs}>
              {[["gantt", "간트"], ["calendar", "캘린더"], ["list", "리스트"]].map(([k, v]) => (
                <button key={k} style={s.tab(view === k)} onClick={() => setView(k)}>{v}</button>
              ))}
            </div>
            <button style={s.btn("primary")} onClick={() => { setProjectForm({ name: "", color: COLORS[projects.length % COLORS.length] }); setModal("addProject"); }}>+ 프로젝트</button>
            <button style={s.btn("primary")} onClick={() => setModal("addTask")}>+ 태스크</button>
          </div>
        </div>

        {!isOnline && (
          <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️ Google Sheets 연결 안 됨 - 오프라인 모드 (데이터가 서버에 저장되지 않습니다)</span>
            <button onClick={fetchTasks} style={{ marginLeft: "auto", ...s.btn(), padding: "3px 10px", fontSize: 11 }}>재연결</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "전체", value: allTasks.length, color: "#666" },
            { label: "진행 중", value: allTasks.filter((t) => t.status === "In Progress").length, color: "#378ADD" },
            { label: "완료", value: allTasks.filter((t) => t.status === "Done").length, color: "#1D9E75" },
            { label: "지연", value: allTasks.filter((t) => t.status !== "Done" && parseDate(t.end) < today).length, color: "#EF4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "10px 8px", background: "#fff", border: "1px solid #e8e8e4", borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 간트 뷰 */}
        {view === "gantt" && (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", marginLeft: 200, borderBottom: "1px solid #e0e0e0" }}>
              <div style={{ flex: 1, display: "flex" }}>
                {dateHeaders.map((h, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 24, textAlign: "center", fontSize: 9, padding: "4px 0", background: h.isToday ? "#FEF2F2" : h.isWeekend ? "#fafaf5" : "transparent", color: h.isToday ? "#EF4444" : h.isWeekend ? "#bbb" : "#888", fontWeight: h.isToday ? 700 : 400, borderRight: "1px solid #f5f5f2" }}>{h.day}</div>
                ))}
              </div>
            </div>
            {projects.map((project) => (
              <div key={project.id} style={s.card}>
                {renderProjectHeader(project)}
                {expandedProjects.has(project.id) && project.tasks.map((task) => {
                  const startIdx = dateHeaders.findIndex((h) => h.dateStr === task.start);
                  const endIdx = dateHeaders.findIndex((h) => h.dateStr === task.end);
                  const si = startIdx >= 0 ? startIdx : diffDays(dateRange.start, parseDate(task.start));
                  const ei = endIdx >= 0 ? endIdx : diffDays(dateRange.start, parseDate(task.end));
                  const l = (si / dateHeaders.length) * 100;
                  const w = ((ei - si + 1) / dateHeaders.length) * 100;
                  const ov = task.status !== "Done" && parseDate(task.end) < today;
                  return (
                    <div key={task.id} style={s.ganttRow}>
                      <div style={s.ganttLabel}>
                        <span style={{ ...s.badge(task.status), fontSize: 9, padding: "1px 5px" }}>{task.status === "Done" ? "✓" : task.status === "In Progress" ? "◐" : "○"}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</span>
                      </div>
                      <div style={s.ganttTrack}>
                        {todayLeft >= 0 && <div style={s.todayLine(todayLeft)} />}
                        <div style={{ ...s.bar(l, w, ov ? "#EF4444" : task.status === "Done" ? "#1D9E75" : project.color), opacity: task.status === "Done" ? 0.6 : 1 }} title={`${task.name}\n${task.assignee} | ${task.start} → ${task.end}`}>
                          <span>{task.assignee}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* 캘린더 뷰 */}
        {view === "calendar" && (
          <div>
            <h3 style={{ textAlign: "center", fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{calendarData.monthLabel}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e0e0e0", borderRadius: 10, overflow: "hidden" }}>
              {["일","월","화","수","목","금","토"].map((d) => (<div key={d} style={{ background: "#f5f5f0", padding: "6px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#888" }}>{d}</div>))}
              {calendarData.weeks.flat().map((cell, i) => (
                <div key={i} style={{ background: "#fff", minHeight: 80, padding: 4 }}>
                  {cell && <>
                    <div style={{ fontSize: 11, fontWeight: cell.isToday ? 700 : 400, color: cell.isToday ? "#EF4444" : "#333", marginBottom: 2 }}>{cell.isToday ? `● ${cell.day}` : cell.day}</div>
                    {cell.tasks.slice(0, 3).map((t) => (<div key={t.id} style={{ fontSize: 9, padding: "1px 4px", marginBottom: 1, borderRadius: 3, background: t.projectColor + "18", color: t.projectColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{t.name}</div>))}
                    {cell.tasks.length > 3 && <div style={{ fontSize: 9, color: "#999" }}>+{cell.tasks.length - 3}개</div>}
                  </>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 리스트 뷰 */}
        {view === "list" && (
          <div>
            {projects.map((project) => (
              <div key={project.id} style={s.card}>
                {renderProjectHeader(project)}
                {expandedProjects.has(project.id) && project.tasks.map((task) => {
                  const ov = task.status !== "Done" && parseDate(task.end) < today;
                  const dl = diffDays(today, parseDate(task.end));
                  return (
                    <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: "1px solid #f5f5f2", flexWrap: "wrap" }}>
                      <span style={s.badge(task.status)}>{task.status}</span>
                      <span style={{ fontWeight: 500, fontSize: 13, flex: 1, minWidth: 120 }}>{task.name}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>{task.assignee}</span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{task.start} → {task.end}</span>
                      {ov && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 600 }}>⚠ {Math.abs(dl)}일 초과</span>}
                      {!ov && task.status !== "Done" && dl <= 3 && dl >= 0 && <span style={{ fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>⏰ D-{dl}</span>}
                      <div style={{ display: "flex", gap: 2 }}>
                        <select style={{ ...s.select, width: "auto", padding: "2px 6px", fontSize: 11 }} value={task.status} onChange={(e) => updateTaskStatus(project.id, task.id, e.target.value)}>
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                        </select>
                        <button style={s.ib} onClick={() => handleDeleteTask(project.id, task.id)}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* 태스크 추가 모달 */}
        {modal === "addTask" && (
          <div style={s.overlay} onClick={() => setModal(null)}>
            <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>태스크 추가</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><label style={s.label}>프로젝트</label><select style={s.select} onChange={(e) => setNewTask((t) => ({ ...t, _projectId: Number(e.target.value) }))}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label style={s.label}>태스크명</label><input style={s.input} value={newTask.name} onChange={(e) => setNewTask((t) => ({ ...t, name: e.target.value }))} placeholder="태스크 이름 입력" /></div>
                <div><label style={s.label}>담당자</label><select style={s.select} value={newTask.assignee} onChange={(e) => setNewTask((t) => ({ ...t, assignee: e.target.value }))}>{TEAM.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}><label style={s.label}>시작일</label><input style={s.input} type="date" value={newTask.start} onChange={(e) => setNewTask((t) => ({ ...t, start: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={s.label}>종료일</label><input style={s.input} type="date" value={newTask.end} onChange={(e) => setNewTask((t) => ({ ...t, end: e.target.value }))} /></div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                <button style={s.btn()} onClick={() => setModal(null)}>취소</button>
                <button style={s.btn("primary")} onClick={() => handleAddTask(newTask._projectId || projects[0]?.id)} disabled={!newTask.name}>추가</button>
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 추가 모달 */}
        {modal === "addProject" && (
          <div style={s.overlay} onClick={() => setModal(null)}>
            <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>프로젝트 추가</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={s.label}>프로젝트명</label><input style={s.input} value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} placeholder="프로젝트 이름 입력" autoFocus /></div>
                <div>
                  <label style={s.label}>색상</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {COLORS.map((c) => (<button key={c} onClick={() => setProjectForm((f) => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: projectForm.color === c ? "3px solid #333" : "2px solid transparent", cursor: "pointer" }} />))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button style={s.btn()} onClick={() => setModal(null)}>취소</button>
                <button style={s.btn("primary")} onClick={handleAddProject} disabled={!projectForm.name.trim()}>추가</button>
              </div>
            </div>
          </div>
        )}

        {/* 프로젝트 수정 모달 */}
        {modal === "editProject" && (
          <div style={s.overlay} onClick={() => setModal(null)}>
            <div style={s.modalBox} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>프로젝트 수정</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><label style={s.label}>프로젝트명</label><input style={s.input} value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} autoFocus /></div>
                <div>
                  <label style={s.label}>색상</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {COLORS.map((c) => (<button key={c} onClick={() => setProjectForm((f) => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: projectForm.color === c ? "3px solid #333" : "2px solid transparent", cursor: "pointer" }} />))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
                <button style={s.btn()} onClick={() => setModal(null)}>취소</button>
                <button style={s.btn("primary")} onClick={handleEditProject} disabled={!projectForm.name.trim()}>저장</button>
              </div>
            </div>
          </div>
        )}

        {toast && (<div style={{ position: "fixed", bottom: 24, right: 24, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 18px", fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 9999 }}>{toast}</div>)}
      </div>
    </>
  );
}
