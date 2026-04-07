"use client";

import { useState } from "react";

// ─── 비밀번호 설정 (변경하려면 아래 값을 수정하세요) ───────────────────────
const APP_PASSWORD = "woojoo2026";
// ────────────────────────────────────────────────────────────────────────────

// 날짜 관련 값은 항상 클라이언트에서 실시간으로 계산
const GANTT_DAYS = 60;

function getDateVars() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ganttStart = new Date(today);
  ganttStart.setDate(ganttStart.getDate() - 14);
  const todayLeft = ((today - ganttStart) / 86400000 / GANTT_DAYS) * 100;
  const ganttDates = Array.from({ length: GANTT_DAYS }, (_, i) => {
    const d = new Date(ganttStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  return { today, ganttStart, todayLeft, ganttDates };
}

const getLeft = (dateStr, ganttStart) => {
  const d = new Date(dateStr);
  const days = (d - ganttStart) / 86400000;
  return Math.max(0, Math.min(100, (days / GANTT_DAYS) * 100));
};
const getWidth = (startStr, endStr, ganttStart) => {
  const s = new Date(startStr);
  const e = new Date(endStr);
  const startDay = Math.max(0, (s - ganttStart) / 86400000);
  const endDay = Math.min(GANTT_DAYS, (e - ganttStart) / 86400000 + 1);
  return Math.max(0, ((endDay - startDay) / GANTT_DAYS) * 100);
};
const STATUS = {
  delayed:      { label:"지연",  bar:"#F06B6B", bg:"#FEF2F2", text:"#DC2626", count:"#EF4444" },
  "in-progress":{ label:"진행중", bar:"#34D399", bg:"#ECFDF5", text:"#059669", count:"#10B981" },
  done:         { label:"완료",  bar:"#60A5FA", bg:"#EFF6FF", text:"#2563EB", count:"#3B82F6" },
  todo:         { label:"할 일", bar:"#CBD5E1", bg:"#F8FAFC", text:"#64748B", count:"#94A3B8" },
};
const initialProjects = [
  {
    id:1, name:"DNT-4034 원단 개발", color:"#4A90D9", expanded:true,
    tasks:[
      { id:1, name:"포일 프린트 테스트",    assignee:"이지은", start:"2026-03-21", end:"2026-04-06", status:"delayed",      memo:"" },
      { id:2, name:"가먼트 워시 결과 분석", assignee:"박성민", start:"2026-03-29", end:"2026-04-12", status:"in-progress",   memo:"" },
    ],
  },
  {
    id:2, name:"Spring/Summer 소싱", color:"#10B981", expanded:true,
    tasks:[
      { id:3, name:"벤더 미팅 일정 확정",          assignee:"김은석", start:"2026-03-15", end:"2026-03-25", status:"delayed",    memo:"" },
      { id:4, name:"하이게이지 트리코트 샘플 수령", assignee:"이지은", start:"2026-03-26", end:"2026-04-16", status:"in-progress", memo:"" },
      { id:5, name:"FTA 활용 검토",               assignee:"최현아", start:"2026-04-07", end:"2026-04-16", status:"todo",       memo:"" },
      { id:6, name:"development",                 assignee:"박성민", start:"2026-03-27", end:"2026-04-07", status:"in-progress", memo:"" },
    ],
  },
  {
    id:3, name:"액티브웨어 신규 라인", color:"#EF4444", expanded:true,
    tasks:[
      { id:7, name:"GSM 스펙 정의", assignee:"박성민", start:"2026-03-21", end:"2026-04-01", status:"delayed", memo:"" },
      { id:8, name:"S&R 테스트",    assignee:"최현아", start:"2026-04-03", end:"2026-04-14", status:"done",    memo:"" },
    ],
  },
];
function getMonthSpans(ganttDates) {
  const spans = []; let cur = null;
  ganttDates.forEach((d, i) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!cur || cur.key !== key) { if (cur) spans.push(cur); cur = { key, label:`${d.getMonth()+1}월`, start:i, count:1 }; }
    else { cur.count++; }
  });
  if (cur) spans.push(cur);
  return spans;
}
const WEEKDAYS = ["일","월","화","수","목","금","토"];

// ─── Password Gate ────────────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (pw === APP_PASSWORD) {
      if (typeof window !== "undefined") sessionStorage.setItem("schedule_auth", "1");
      onUnlock();
    } else {
      setError(true); setShake(true); setPw("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F1F5F9", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Pretendard','Noto Sans KR',sans-serif" }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>
      <div style={{ background:"white", borderRadius:16, padding:"40px 36px", boxShadow:"0 8px 40px rgba(0,0,0,0.10)", width:340, animation: shake?"shake 0.4s ease":"none" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"#3B82F6", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px", boxShadow:"0 4px 14px rgba(59,130,246,0.35)" }}>
            <span style={{ fontSize:24 }}>📋</span>
          </div>
          <div style={{ fontSize:18, fontWeight:700, color:"#0F172A" }}>프로젝트 스케줄</div>
          <div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>우주글로벌 내부 전용</div>
        </div>
        <label style={{ fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:6 }}>비밀번호</label>
        <input
          type="password" value={pw} autoFocus
          onChange={e=>{ setPw(e.target.value); setError(false); }}
          onKeyDown={e=>e.key==="Enter" && attempt()}
          placeholder="비밀번호를 입력하세요"
          style={{ width:"100%", boxSizing:"border-box", padding:"11px 14px", border: error?"1.5px solid #EF4444":"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, outline:"none", fontFamily:"inherit", background: error?"#FFF8F8":"white" }}
        />
        {error && <div style={{ fontSize:12, color:"#EF4444", marginTop:5 }}>⚠ 비밀번호가 올바르지 않습니다</div>}
        <button onClick={attempt} style={{ width:"100%", padding:"12px", marginTop:16, background:"#3B82F6", color:"white", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" }}>
          입장하기
        </button>
        <div style={{ marginTop:16, padding:"10px 12px", background:"#F8FAFC", borderRadius:8, fontSize:11, color:"#94A3B8", textAlign:"center", lineHeight:1.6 }}>
          이 페이지는 우주글로벌 내부 인원만<br/>접근할 수 있습니다
        </div>
      </div>
    </div>
  );
}

// ─── Task Icon ────────────────────────────────────────────────────────────────
function TaskIcon({ status }) {
  if (status==="done") return <svg width={16} height={16} viewBox="0 0 16 16" style={{flexShrink:0}}><circle cx="8" cy="8" r="7" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5"/><path d="M5 8.5l2 2 4-4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (status==="in-progress") return <svg width={16} height={16} viewBox="0 0 16 16" style={{flexShrink:0}}><circle cx="8" cy="8" r="7" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="1.5"/><path d="M8 4.5v3.5l2.5 1.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (status==="delayed") return <svg width={16} height={16} viewBox="0 0 16 16" style={{flexShrink:0}}><circle cx="8" cy="8" r="7" fill="#FEE2E2" stroke="#FCA5A5" strokeWidth="1.5"/><path d="M8 4.5v4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.9" fill="#EF4444"/></svg>;
  return <svg width={16} height={16} viewBox="0 0 16 16" style={{flexShrink:0}}><circle cx="8" cy="8" r="7" fill="white" stroke="#CBD5E1" strokeWidth="1.5"/></svg>;
}

// ─── Calendar View (separate component — no hooks rule violation) ─────────────
function CalendarView({ allTasks, projects, statusFilter, setMemoTask }) {
  const { today: TODAY } = getDateVars();
  const [calYear, setCalYear] = useState(TODAY.getFullYear());
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const weeks = Math.ceil((firstDay + daysInMonth) / 7);
  const filteredTasks = statusFilter==="all" ? allTasks : allTasks.filter(t=>t.status===statusFilter);

  const getTasksForDay = (day) => {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return filteredTasks.filter(t => {
      const s=new Date(t.start), e=new Date(t.end), d=new Date(dateStr);
      return d>=s && d<=e;
    });
  };

  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else{setCalMonth(m=>m-1);} };
  const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else{setCalMonth(m=>m+1);} };

  return (
    <div style={{ background:"white", borderRadius:12, border:"1px solid #E2E8F0", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderBottom:"1px solid #E2E8F0" }}>
        <button onClick={prevMonth} style={{ background:"none", border:"1px solid #E2E8F0", borderRadius:8, cursor:"pointer", padding:"5px 14px", fontSize:16, color:"#64748B" }}>‹</button>
        <span style={{ fontSize:16, fontWeight:700, color:"#0F172A" }}>{calYear}년 {calMonth+1}월</span>
        <button onClick={nextMonth} style={{ background:"none", border:"1px solid #E2E8F0", borderRadius:8, cursor:"pointer", padding:"5px 14px", fontSize:16, color:"#64748B" }}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #F1F5F9" }}>
        {WEEKDAYS.map((d,i) => (
          <div key={d} style={{ padding:"8px 0", textAlign:"center", fontSize:12, fontWeight:700, color:i===0?"#EF4444":i===6?"#3B82F6":"#64748B" }}>{d}</div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
        {Array.from({ length: weeks*7 }, (_,i) => {
          const dayNum = i - firstDay + 1;
          const isValid = dayNum>=1 && dayNum<=daysInMonth;
          const dateStr = isValid ? `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}` : null;
          const isToday = isValid && new Date(dateStr).toDateString()===TODAY.toDateString();
          const isWknd = i%7===0 || i%7===6;
          const dayTasks = isValid ? getTasksForDay(dayNum) : [];

          return (
            <div key={i} style={{ borderRight:i%7!==6?"1px solid #F1F5F9":"none", borderBottom:"1px solid #F1F5F9", padding:"6px 6px 4px", minHeight:90, background:!isValid?"#FAFAFA":isToday?"#FFF8F8":isWknd?"#FDFCFF":"white" }}>
              {isValid && (
                <>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
                    <span style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:isToday?700:500, background:isToday?"#EF4444":"transparent", color:isToday?"white":i%7===0?"#EF4444":i%7===6?"#3B82F6":"#334155" }}>{dayNum}</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                    {dayTasks.slice(0,3).map(task => {
                      const proj = projects.find(p=>p.tasks.some(t=>t.id===task.id));
                      const sc = STATUS[task.status];
                      const isStart = task.start===dateStr;
                      return (
                        <button key={task.id} onClick={()=>setMemoTask({taskId:task.id,projectId:proj?.id})} title={`${task.name} (${task.assignee})`}
                          style={{ background:sc.bar, border:"none", borderRadius:3, cursor:"pointer", padding:"2px 5px", fontSize:10, color:"white", fontWeight:600, textAlign:"left", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", opacity:isStart?1:0.75 }}>
                          {isStart ? task.name : "· "+task.name}
                        </button>
                      );
                    })}
                    {dayTasks.length>3 && <div style={{ fontSize:10, color:"#94A3B8", paddingLeft:4 }}>+{dayTasks.length-3}개 더</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ padding:"10px 16px", borderTop:"1px solid #F1F5F9", display:"flex", gap:14, flexWrap:"wrap" }}>
        {Object.entries(STATUS).map(([k,v]) => (
          <div key={k} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:v.bar }}/>
            <span style={{ fontSize:11, color:"#64748B" }}>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ScheduleManager() {
  const [authed, setAuthed] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("schedule_auth")==="1");

  if (!authed) return <PasswordGate onUnlock={()=>setAuthed(true)} />;

  return <ScheduleApp />;
}

function ScheduleApp() {
  const { today: TODAY, ganttStart: GANTT_START, todayLeft, ganttDates } = getDateVars();
  const monthSpans = getMonthSpans(ganttDates);
  const [projects, setProjects] = useState(initialProjects);
  const [activeView, setActiveView] = useState("gantt");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memoTask, setMemoTask] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newProject, setNewProject] = useState({ name:"", color:"#4A90D9" });
  const [newTask, setNewTask] = useState({ name:"", assignee:"", start:"", end:"", projectId:1, status:"todo" });
  const [syncTime] = useState(() => {
    const n=new Date(); const h=n.getHours(); const ap=h>=12?"오후":"오전";
    return `${ap} ${h%12||12}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
  });

  const allTasks = projects.flatMap(p=>p.tasks);
  const stats = {
    all: allTasks.length,
    "in-progress": allTasks.filter(t=>t.status==="in-progress").length,
    done:    allTasks.filter(t=>t.status==="done").length,
    delayed: allTasks.filter(t=>t.status==="delayed").length,
    todo:    allTasks.filter(t=>t.status==="todo").length,
  };

  const displayProjects = statusFilter==="all"
    ? projects
    : projects.map(p=>({...p, tasks:p.tasks.filter(t=>t.status===statusFilter)})).filter(p=>p.tasks.length>0);

  const toggleProject = (id) => setProjects(ps=>ps.map(p=>p.id===id?{...p,expanded:!p.expanded}:p));

  const getMemoData = () => {
    if (!memoTask) return null;
    const proj=projects.find(p=>p.id===memoTask.projectId);
    if (!proj) return null;
    const task=proj.tasks.find(t=>t.id===memoTask.taskId);
    return task?{task,proj}:null;
  };

  const updateMemo = (memo) => {
    if (!memoTask) return;
    setProjects(ps=>ps.map(p=>p.id===memoTask.projectId?{...p,tasks:p.tasks.map(t=>t.id===memoTask.taskId?{...t,memo}:t)}:p));
  };

  const addProject = () => {
    if (!newProject.name.trim()) return;
    setProjects(ps=>[...ps,{id:Date.now(),name:newProject.name,color:newProject.color,expanded:true,tasks:[]}]);
    setNewProject({name:"",color:"#4A90D9"}); setShowAddProject(false);
  };

  const addTask = () => {
    if (!newTask.name.trim()||!newTask.start||!newTask.end) return;
    setProjects(ps=>ps.map(p=>p.id===Number(newTask.projectId)?{...p,tasks:[...p.tasks,{id:Date.now(),name:newTask.name,assignee:newTask.assignee,start:newTask.start,end:newTask.end,status:newTask.status,memo:""}]}:p));
    setNewTask({name:"",assignee:"",start:"",end:"",projectId:1,status:"todo"}); setShowAddTask(false);
  };

  const deleteProject = (id) => {
    setProjects(ps=>ps.filter(p=>p.id!==id));
    if (memoTask?.projectId===id) setMemoTask(null);
  };

  const upcomingDeadlines = allTasks
    .filter(t=>t.status!=="done")
    .map(t=>({...t,daysLeft:Math.ceil((new Date(t.end)-TODAY)/86400000)}))
    .filter(t=>t.daysLeft<=3)
    .sort((a,b)=>a.daysLeft-b.daysLeft);

  const memoData = getMemoData();
  const inp = {width:"100%",boxSizing:"border-box",padding:"8px 12px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:13,outline:"none",fontFamily:"inherit"};
  const sel = {...inp,background:"white"};

  return (
    <div style={{ minHeight:"100vh", background:"#F1F5F9", fontFamily:"'Pretendard','Noto Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      <div style={{ maxWidth:1440, margin:"0 auto", padding:"24px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#0F172A", margin:0 }}>프로젝트 스케줄</h1>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
              <span style={{ fontSize:12, color:"#94A3B8" }}>오늘: {TODAY.getFullYear()}년 {TODAY.getMonth()+1}월 {TODAY.getDate()}일 {["일","월","화","수","목","금","토"][TODAY.getDay()]}요일</span>
              <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:"#64748B" }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:"#22C55E",display:"inline-block" }}/>
                {syncTime} 동기화 <span style={{ cursor:"pointer",color:"#3B82F6",fontSize:14 }}>↻</span>
              </span>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", background:"#E2E8F0", borderRadius:8, padding:3, gap:2 }}>
              {["gantt","calendar","list"].map(v=>(
                <button key={v} onClick={()=>setActiveView(v)} style={{ padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, background:activeView===v?"white":"transparent", color:activeView===v?"#0F172A":"#64748B", boxShadow:activeView===v?"0 1px 3px rgba(0,0,0,.1)":"none", transition:"all .15s" }}>
                  {v==="gantt"?"간트":v==="calendar"?"캘린더":"리스트"}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowAddProject(true)} style={{ padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:"#6366F1",color:"white" }}>+ 프로젝트</button>
            <button onClick={()=>setShowAddTask(true)}    style={{ padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:"#3B82F6",color:"white" }}>+ 테스크</button>
          </div>
        </div>

        {/* Status filter cards */}
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {[
            {key:"all",         label:"전체",  countColor:"#0F172A",                    count:stats.all},
            {key:"in-progress", label:"진행중", countColor:STATUS["in-progress"].count,  count:stats["in-progress"]},
            {key:"done",        label:"완료",  countColor:STATUS.done.count,            count:stats.done},
            {key:"delayed",     label:"지연",  countColor:STATUS.delayed.count,         count:stats.delayed},
            {key:"todo",        label:"할 일", countColor:STATUS.todo.count,            count:stats.todo},
          ].map(({key,label,countColor,count})=>{
            const isActive = statusFilter===key;
            const borderColor = isActive?(key==="all"?"#3B82F6":STATUS[key]?.bar||"#3B82F6"):"#E2E8F0";
            const bg = isActive?(key==="all"?"#EFF6FF":STATUS[key]?.bg||"#EFF6FF"):"white";
            return (
              <button key={key} onClick={()=>setStatusFilter(isActive&&key!=="all"?"all":key)}
                style={{ flex:1,padding:"14px 8px",borderRadius:12,border:`2px solid ${borderColor}`,cursor:"pointer",background:bg,textAlign:"center",transition:"all .15s",boxShadow:isActive?`0 0 0 3px ${borderColor}22`:"none" }}>
                <div style={{ fontSize:26,fontWeight:700,color:countColor,lineHeight:1 }}>{count}</div>
                <div style={{ fontSize:11,color:"#64748B",marginTop:4,fontWeight:500 }}>{label}</div>
                {isActive&&key!=="all"&&<div style={{ marginTop:6,fontSize:10,color:STATUS[key]?.text,background:STATUS[key]?.bg,borderRadius:10,padding:"1px 8px",display:"inline-block",fontWeight:600 }}>필터 적용중</div>}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
          <div style={{ flex:1, minWidth:0 }}>

            {/* Gantt View */}
            {activeView==="gantt" && (
              <div>
                {statusFilter!=="all" && (
                  <div style={{ padding:"8px 14px",background:STATUS[statusFilter]?.bg,borderRadius:8,border:`1px solid ${STATUS[statusFilter]?.bar}44`,fontSize:12,color:STATUS[statusFilter]?.text,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",gap:6 }}>
                    <span>🔍</span>
                    <span>'{STATUS[statusFilter]?.label}' 상태 테스크만 표시 중 ({displayProjects.flatMap(p=>p.tasks).length}건)</span>
                    <button onClick={()=>setStatusFilter("all")} style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",fontSize:12,color:STATUS[statusFilter]?.text,fontWeight:700 }}>전체 보기 ✕</button>
                  </div>
                )}
                {displayProjects.length===0 && (
                  <div style={{ padding:48,textAlign:"center",color:"#94A3B8",background:"white",borderRadius:12,border:"1px solid #E2E8F0" }}>
                    <div style={{ fontSize:32,marginBottom:8 }}>📭</div>
                    <div style={{ fontWeight:600,marginBottom:4 }}>해당 상태의 테스크가 없습니다</div>
                    <div style={{ fontSize:12 }}>다른 필터를 선택해 보세요</div>
                  </div>
                )}
                {displayProjects.map(project=>(
                  <div key={project.id} style={{ background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:12,overflow:"hidden" }}>
                    <div style={{ display:"flex",alignItems:"center",padding:"12px 16px",borderBottom:project.expanded?"1px solid #F1F5F9":"none",background:"#FAFAFA" }}>
                      <button onClick={()=>toggleProject(project.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:0,marginRight:6,color:"#64748B",fontSize:11 }}>{project.expanded?"▼":"▶"}</button>
                      <div style={{ width:9,height:9,borderRadius:"50%",background:project.color,marginRight:8,flexShrink:0 }}/>
                      <span style={{ fontWeight:700,fontSize:14,color:"#0F172A" }}>{project.name}</span>
                      <span style={{ marginLeft:"auto",fontSize:11,color:"#94A3B8",marginRight:10 }}>{project.tasks.length}개</span>
                      <button onClick={()=>deleteProject(project.id)} style={{ background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:14,padding:"2px 4px",borderRadius:4,lineHeight:1 }}>🗑</button>
                    </div>
                    {project.expanded && (
                      <div style={{ overflowX:"auto" }}>
                        <div style={{ minWidth:700 }}>
                          <div style={{ display:"flex",borderBottom:"1px solid #F1F5F9" }}>
                            <div style={{ width:220,flexShrink:0 }}/>
                            <div style={{ flex:1,display:"flex" }}>
                              {monthSpans.map((ms,i)=>(
                                <div key={i} style={{ width:`${(ms.count/GANTT_DAYS)*100}%`,padding:"4px 0",textAlign:"center",fontSize:11,fontWeight:700,color:"#64748B",borderLeft:i>0?"1px solid #E2E8F0":undefined }}>{ms.label}</div>
                              ))}
                            </div>
                          </div>
                          <div style={{ display:"flex",borderBottom:"1px solid #F1F5F9" }}>
                            <div style={{ width:220,flexShrink:0,borderRight:"1px solid #F1F5F9" }}/>
                            <div style={{ flex:1,display:"flex" }}>
                              {ganttDates.map((d,i)=>{
                                const isToday=d.toDateString()===TODAY.toDateString();
                                const isWknd=d.getDay()===0||d.getDay()===6;
                                return <div key={i} style={{ flex:1,textAlign:"center",padding:"5px 0",fontSize:10,fontWeight:isToday?700:400,color:isToday?"#EF4444":isWknd?"#CBD5E1":"#94A3B8",background:isToday?"#FFF1F2":isWknd?"#FAFAFA":"transparent" }}>{d.getDate()}</div>;
                              })}
                            </div>
                          </div>
                          {project.tasks.map(task=>{
                            const sc=STATUS[task.status];
                            return (
                              <div key={task.id} style={{ display:"flex",alignItems:"center",borderBottom:"1px solid #F8FAFC",minHeight:42 }}>
                                <div style={{ width:220,flexShrink:0,padding:"0 12px",display:"flex",alignItems:"center",gap:7,borderRight:"1px solid #F1F5F9" }}>
                                  <TaskIcon status={task.status}/>
                                  <button onClick={()=>setMemoTask({taskId:task.id,projectId:project.id})}
                                    style={{ background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left",fontSize:12,color:"#334155",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160,display:"flex",alignItems:"center",gap:3 }}>
                                    <span style={{ overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.name}</span>
                                    {task.memo && <span style={{ fontSize:10,flexShrink:0 }}>📝</span>}
                                  </button>
                                </div>
                                <div style={{ flex:1,position:"relative",height:42 }}>
                                  {ganttDates.map((d,i)=>(d.getDay()===0||d.getDay()===6)?<div key={i} style={{ position:"absolute",top:0,bottom:0,left:`${(i/GANTT_DAYS)*100}%`,width:`${(1/GANTT_DAYS)*100}%`,background:"#F8FAFC" }}/>:null)}
                                  <div style={{ position:"absolute",top:0,bottom:0,left:`${todayLeft}%`,width:2,background:"#EF4444",opacity:.7,zIndex:3 }}/>
                                  <div style={{ position:"absolute",top:"50%",transform:"translateY(-50%)",left:`${getLeft(task.start, GANTT_START)}%`,width:`${getWidth(task.start,task.end, GANTT_START)}%`,height:26,background:sc.bar,borderRadius:5,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}
                                    onClick={()=>setMemoTask({taskId:task.id,projectId:project.id})} title={`${task.name} (${task.assignee})`}>
                                    <span style={{ fontSize:10,color:"white",fontWeight:700,padding:"0 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.assignee}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Calendar View — proper component, no hooks issue */}
            {activeView==="calendar" && (
              <CalendarView allTasks={allTasks} projects={projects} statusFilter={statusFilter} setMemoTask={setMemoTask} />
            )}

            {/* List View */}
            {activeView==="list" && (
              <div style={{ background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#F8FAFC",borderBottom:"1px solid #E2E8F0" }}>
                      {["테스크","프로젝트","담당자","시작일","종료일","상태","메모"].map(h=>(
                        <th key={h} style={{ padding:"10px 14px",textAlign:"left",color:"#64748B",fontWeight:600,whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(statusFilter==="all"?allTasks:allTasks.filter(t=>t.status===statusFilter)).map(task=>{
                      const proj=projects.find(p=>p.tasks.some(t=>t.id===task.id));
                      const sc=STATUS[task.status];
                      return (
                        <tr key={task.id} style={{ borderBottom:"1px solid #F1F5F9" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"11px 14px" }}>
                            <button onClick={()=>setMemoTask({taskId:task.id,projectId:proj?.id})} style={{ background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#334155",fontWeight:600,padding:0,textAlign:"left" }}>{task.name}</button>
                          </td>
                          <td style={{ padding:"11px 14px",color:"#64748B" }}><div style={{ display:"flex",alignItems:"center",gap:6 }}><div style={{ width:8,height:8,borderRadius:"50%",background:proj?.color }}/>{proj?.name}</div></td>
                          <td style={{ padding:"11px 14px",color:"#64748B" }}>{task.assignee}</td>
                          <td style={{ padding:"11px 14px",color:"#64748B",whiteSpace:"nowrap" }}>{task.start}</td>
                          <td style={{ padding:"11px 14px",color:"#64748B",whiteSpace:"nowrap" }}>{task.end}</td>
                          <td style={{ padding:"11px 14px" }}><span style={{ padding:"3px 10px",borderRadius:6,background:sc?.bg,color:sc?.text,fontSize:11,fontWeight:600,whiteSpace:"nowrap" }}>{sc?.label}</span></td>
                          <td style={{ padding:"11px 14px" }}>
                            <button onClick={()=>setMemoTask({taskId:task.id,projectId:proj?.id})} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#3B82F6",padding:0 }}>
                              {task.memo?"📝 보기":"메모 추가"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deadline sidebar */}
          {upcomingDeadlines.length>0 && !memoTask && (
            <div style={{ width:210,flexShrink:0 }}>
              <div style={{ background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:16 }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#EF4444",marginBottom:12,display:"flex",alignItems:"center",gap:5 }}>⚠️ 마감 임박</div>
                {upcomingDeadlines.map(t=>(
                  <div key={t.id} style={{ padding:"8px 0",borderBottom:"1px solid #F8FAFC" }}>
                    <div style={{ fontSize:12,fontWeight:500,color:"#334155",lineHeight:1.4 }}>{t.name}</div>
                    <div style={{ fontSize:11,marginTop:3,color:t.daysLeft<0?"#EF4444":t.daysLeft===0?"#F97316":"#F59E0B",fontWeight:600 }}>
                      {t.daysLeft<0?`${Math.abs(t.daysLeft)}일 초과`:t.daysLeft===0?"오늘 마감":`D-${t.daysLeft}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Memo Panel */}
      {memoTask && memoData && (
        <>
          <div onClick={()=>setMemoTask(null)} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,0.25)",zIndex:40 }}/>
          <div style={{ position:"fixed",top:0,right:0,bottom:0,width:420,background:"white",zIndex:50,display:"flex",flexDirection:"column",boxShadow:"-6px 0 32px rgba(0,0,0,0.12)" }}>
            <div style={{ padding:"20px 20px 16px",borderBottom:"1px solid #E2E8F0",flexShrink:0 }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:4 }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:memoData.proj.color,flexShrink:0 }}/>
                    <span style={{ fontSize:11,color:"#94A3B8" }}>{memoData.proj.name}</span>
                  </div>
                  <div style={{ fontSize:16,fontWeight:700,color:"#0F172A" }}>{memoData.task.name}</div>
                </div>
                <button onClick={()=>setMemoTask(null)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#94A3B8",padding:4,marginLeft:8,lineHeight:1 }}>✕</button>
              </div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                <span style={{ padding:"3px 10px",borderRadius:20,background:STATUS[memoData.task.status]?.bg,color:STATUS[memoData.task.status]?.text,fontSize:11,fontWeight:700 }}>{STATUS[memoData.task.status]?.label}</span>
                <span style={{ padding:"3px 10px",borderRadius:20,background:"#F1F5F9",color:"#64748B",fontSize:11 }}>👤 {memoData.task.assignee}</span>
                <span style={{ padding:"3px 10px",borderRadius:20,background:"#F1F5F9",color:"#64748B",fontSize:11,whiteSpace:"nowrap" }}>📅 {memoData.task.start} ~ {memoData.task.end}</span>
              </div>
            </div>
            <div style={{ flex:1,overflowY:"auto",padding:"18px 20px" }}>
              <div style={{ fontSize:13,fontWeight:700,color:"#334155",marginBottom:8 }}>📝 메모</div>
              <textarea value={memoData.task.memo} onChange={e=>updateMemo(e.target.value)}
                placeholder={"테스크에 대한 메모를 입력하세요.\n\n진행 상황, 참고 사항, 이슈 등을 자유롭게 기록하세요."}
                style={{ width:"100%",boxSizing:"border-box",minHeight:300,border:"1px solid #E2E8F0",borderRadius:8,padding:"12px",fontSize:13,color:"#334155",resize:"vertical",fontFamily:"inherit",lineHeight:1.7,outline:"none",background:"#FAFAFA" }}
                onFocus={e=>e.target.style.background="white"} onBlur={e=>e.target.style.background="#FAFAFA"}
              />
              <div style={{ fontSize:11,color:"#CBD5E1",marginTop:4,textAlign:"right" }}>{memoData.task.memo.length}자</div>
              <div style={{ marginTop:16,padding:"10px 14px",background:"#FFF7ED",border:"1px solid #FED7AA",borderRadius:8,fontSize:12,color:"#92400E" }}>
                💡 메모 내용은 Google Sheets 연동 시 해당 셀에 텍스트로 저장됩니다.
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {(showAddProject||showAddTask) && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"white",borderRadius:16,padding:24,width:380,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            {showAddProject && (
              <>
                <h3 style={{ margin:"0 0 18px",fontSize:15,fontWeight:700,color:"#0F172A" }}>새 프로젝트 추가</h3>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:5 }}>프로젝트명</label>
                  <input value={newProject.name} onChange={e=>setNewProject(p=>({...p,name:e.target.value}))} placeholder="프로젝트 이름 입력" style={inp}/>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:8 }}>색상</label>
                  <div style={{ display:"flex",gap:8 }}>
                    {["#4A90D9","#10B981","#EF4444","#8B5CF6","#F59E0B","#EC4899","#0EA5E9","#64748B"].map(c=>(
                      <button key={c} onClick={()=>setNewProject(p=>({...p,color:c}))} style={{ width:26,height:26,borderRadius:"50%",background:c,border:newProject.color===c?"3px solid #0F172A":"2px solid transparent",cursor:"pointer" }}/>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowAddProject(false)} style={{ padding:"8px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",fontSize:13,color:"#64748B" }}>취소</button>
                  <button onClick={addProject} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#6366F1",color:"white",cursor:"pointer",fontSize:13,fontWeight:700 }}>추가</button>
                </div>
              </>
            )}
            {showAddTask && (
              <>
                <h3 style={{ margin:"0 0 18px",fontSize:15,fontWeight:700,color:"#0F172A" }}>새 테스크 추가</h3>
                {[{label:"테스크명",key:"name",type:"text",placeholder:"테스크 이름 입력"},{label:"담당자",key:"assignee",type:"text",placeholder:"담당자 이름"},{label:"시작일",key:"start",type:"date"},{label:"종료일",key:"end",type:"date"}].map(({label,key,type,placeholder})=>(
                  <div key={key} style={{ marginBottom:11 }}>
                    <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>{label}</label>
                    <input type={type} value={newTask[key]} onChange={e=>setNewTask(t=>({...t,[key]:e.target.value}))} placeholder={placeholder} style={inp}/>
                  </div>
                ))}
                <div style={{ marginBottom:11 }}>
                  <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>프로젝트</label>
                  <select value={newTask.projectId} onChange={e=>setNewTask(t=>({...t,projectId:Number(e.target.value)}))} style={sel}>
                    {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:12,color:"#64748B",fontWeight:600,display:"block",marginBottom:4 }}>상태</label>
                  <select value={newTask.status} onChange={e=>setNewTask(t=>({...t,status:e.target.value}))} style={sel}>
                    <option value="todo">할 일</option>
                    <option value="in-progress">진행중</option>
                    <option value="done">완료</option>
                    <option value="delayed">지연</option>
                  </select>
                </div>
                <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
                  <button onClick={()=>setShowAddTask(false)} style={{ padding:"8px 16px",borderRadius:8,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",fontSize:13,color:"#64748B" }}>취소</button>
                  <button onClick={addTask} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#3B82F6",color:"white",cursor:"pointer",fontSize:13,fontWeight:700 }}>추가</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
