import { useState } from "react";

// ════════════════════════════════════════════
//  공통 상수 / 유틸
// ════════════════════════════════════════════
const GANTT_DAYS = 60;
const WD = ["일","월","화","수","목","금","토"];
const TS = {
  delayed:     { label:"지연",   bar:"#F06B6B", bg:"#FEF2F2", text:"#DC2626" },
  "in-progress":{ label:"진행중", bar:"#34D399", bg:"#ECFDF5", text:"#059669" },
  done:        { label:"완료",   bar:"#60A5FA", bg:"#EFF6FF", text:"#2563EB" },
  todo:        { label:"할 일",  bar:"#CBD5E1", bg:"#F8FAFC", text:"#64748B" },
};

function getDateVars() {
  const today = new Date(); today.setHours(0,0,0,0);
  const ganttStart = new Date(today); ganttStart.setDate(ganttStart.getDate()-14);
  const todayLeft = ((today - ganttStart) / 86400000 / GANTT_DAYS) * 100;
  const ganttDates = Array.from({length: GANTT_DAYS}, (_,i) => {
    const d = new Date(ganttStart); d.setDate(d.getDate()+i); return d;
  });
  return { today, ganttStart, todayLeft, ganttDates };
}
function getMonthSpans(gd) {
  const sp = []; let cur = null;
  gd.forEach((d,i) => {
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    if (!cur || cur.k !== k) { if (cur) sp.push(cur); cur = {k, label:`${d.getMonth()+1}월`, count:1}; }
    else cur.count++;
  });
  if (cur) sp.push(cur); return sp;
}
const gLeft  = (s,gs) => Math.max(0, Math.min(100, ((new Date(s)-gs)/86400000/GANTT_DAYS)*100));
const gWidth = (s,e,gs) => { const sd=Math.max(0,(new Date(s)-gs)/86400000), ed=Math.min(GANTT_DAYS,(new Date(e)-gs)/86400000+1); return Math.max(0,((ed-sd)/GANTT_DAYS)*100); };
const todayStr = () => new Date().toISOString().slice(0,10);

// ════════════════════════════════════════════
//  초기 데이터
// ════════════════════════════════════════════
const INIT_PROJECTS = [
  { id:1, name:"DNT-4034 원단 개발", color:"#4A90D9", expanded:true, tasks:[
    {id:1,name:"포일 프린트 테스트",    assignee:"이지은",start:"2026-03-21",end:"2026-04-06",status:"delayed",memo:""},
    {id:2,name:"가먼트 워시 결과 분석", assignee:"박성민",start:"2026-03-29",end:"2026-04-12",status:"in-progress",memo:""},
  ]},
  { id:2, name:"Spring/Summer 소싱", color:"#10B981", expanded:true, tasks:[
    {id:3,name:"벤더 미팅 일정 확정",          assignee:"김은석",start:"2026-03-15",end:"2026-03-25",status:"delayed",memo:""},
    {id:4,name:"하이게이지 트리코트 샘플 수령", assignee:"이지은",start:"2026-03-26",end:"2026-04-16",status:"in-progress",memo:""},
    {id:5,name:"FTA 활용 검토",               assignee:"최현아",start:"2026-04-07",end:"2026-04-16",status:"todo",memo:""},
  ]},
  { id:3, name:"액티브웨어 신규 라인", color:"#EF4444", expanded:true, tasks:[
    {id:7,name:"GSM 스펙 정의",assignee:"박성민",start:"2026-03-21",end:"2026-04-01",status:"delayed",memo:""},
    {id:8,name:"S&R 테스트",   assignee:"최현아",start:"2026-04-03",end:"2026-04-14",status:"done",memo:""},
  ]},
];

const INIT_CEO = [
  {id:1,date:"2026-03-05",cat:"소싱",content:"베트남 원단 공급업체 2곳 추가 발굴 및 샘플 수령",assignee:"김용식",due:"2026-04-15",status:"진행중",progress:60,note:""},
  {id:2,date:"2026-03-10",cat:"염색",content:"Eclat 랩딥 3차 수정본 승인 처리",assignee:"이선교",due:"2026-03-28",status:"완료",progress:100,note:"3/27 승인완료"},
  {id:3,date:"2026-03-12",cat:"조달",content:"LYCRA ANTISTATIC 소재 단가 재협상 진행",assignee:"박민준",due:"2026-04-10",status:"지연",progress:30,note:"공급사 응답 지연"},
  {id:4,date:"2026-03-18",cat:"영업",content:"Bandit Running 신규 바이어 미팅 제안서 준비",assignee:"김은석",due:"2026-04-20",status:"진행중",progress:75,note:""},
  {id:5,date:"2026-03-20",cat:"전시",content:"2026 프리뷰 인 서울 부스 배치 계획 수립",assignee:"최지현",due:"2026-04-05",status:"완료",progress:100,note:"확정 완료"},
  {id:6,date:"2026-03-25",cat:"개발",content:"DNT-4034 하이브리드 워프닛 개발 일정 공유",assignee:"김은석",due:"2026-05-01",status:"진행중",progress:45,note:""},
  {id:7,date:"2026-04-02",cat:"조달",content:"미네랄워시 PFD 원단 불량 원인 분석 보고",assignee:"이선교",due:"2026-04-18",status:"미착수",progress:0,note:""},
  {id:8,date:"2026-04-08",cat:"기타",content:"바이어 미팅 일지 요약본 주 1회 보고 체계화",assignee:"김용식",due:"2026-04-30",status:"미착수",progress:0,note:""},
];

// ════════════════════════════════════════════
//  TaskIcon
// ════════════════════════════════════════════
function TIcon({status}) {
  const c = {done:["#DBEAFE","#93C5FD","#3B82F6"],["in-progress"]:["#D1FAE5","#6EE7B7","#10B981"],delayed:["#FEE2E2","#FCA5A5","#EF4444"]}[status];
  if (!c) return <svg width={15} height={15} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="white" stroke="#CBD5E1" strokeWidth="1.5"/></svg>;
  if (status==="done") return <svg width={15} height={15} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill={c[0]} stroke={c[1]} strokeWidth="1.5"/><path d="M5 8.5l2 2 4-4" stroke={c[2]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (status==="in-progress") return <svg width={15} height={15} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill={c[0]} stroke={c[1]} strokeWidth="1.5"/><path d="M8 4.5v3.5l2.5 1.5" stroke={c[2]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg width={15} height={15} viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill={c[0]} stroke={c[1]} strokeWidth="1.5"/><path d="M8 4.5v4" stroke={c[2]} strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.9" fill={c[2]}/></svg>;
}

// ════════════════════════════════════════════
//  캘린더 뷰
// ════════════════════════════════════════════
function CalView({ allTasks, projects, sf, setMemo }) {
  const { today:T } = getDateVars();
  const [cy, setCy] = useState(T.getFullYear());
  const [cm, setCm] = useState(T.getMonth());
  const fd = new Date(cy,cm,1).getDay(), dim = new Date(cy,cm+1,0).getDate(), wks = Math.ceil((fd+dim)/7);
  const ft = sf==="all" ? allTasks : allTasks.filter(t=>t.status===sf);
  const gtfd = (day) => {
    const ds = `${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return ft.filter(t => { const s=new Date(t.start),e=new Date(t.end),d=new Date(ds); return d>=s&&d<=e; });
  };
  const pm = () => cm===0 ? (setCm(11),setCy(y=>y-1)) : setCm(m=>m-1);
  const nm = () => cm===11 ? (setCm(0),setCy(y=>y+1)) : setCm(m=>m+1);
  return (
    <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",borderBottom:"1px solid #E2E8F0"}}>
        <button onClick={pm} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:8,cursor:"pointer",padding:"4px 12px",fontSize:15,color:"#64748B"}}>‹</button>
        <span style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{cy}년 {cm+1}월</span>
        <button onClick={nm} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:8,cursor:"pointer",padding:"4px 12px",fontSize:15,color:"#64748B"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #F1F5F9"}}>
        {WD.map((d,i)=><div key={d} style={{padding:"7px 0",textAlign:"center",fontSize:11,fontWeight:700,color:i===0?"#EF4444":i===6?"#3B82F6":"#64748B"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {Array.from({length:wks*7},(_,i)=>{
          const dn=i-fd+1,iv=dn>=1&&dn<=dim;
          const ds=iv?`${cy}-${String(cm+1).padStart(2,"0")}-${String(dn).padStart(2,"0")}`:null;
          const it=iv&&new Date(ds).toDateString()===T.toDateString(), iw=i%7===0||i%7===6;
          const dt=iv?gtfd(dn):[];
          return (
            <div key={i} style={{borderRight:i%7!==6?"1px solid #F1F5F9":"none",borderBottom:"1px solid #F1F5F9",padding:"5px 5px 3px",minHeight:80,background:!iv?"#FAFAFA":it?"#FFF8F8":iw?"#FDFCFF":"white"}}>
              {iv&&<>
                <div style={{display:"flex",justifyContent:"flex-end",marginBottom:3}}>
                  <span style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:it?700:400,background:it?"#EF4444":"transparent",color:it?"white":i%7===0?"#EF4444":i%7===6?"#3B82F6":"#334155"}}>{dn}</span>
                </div>
                {dt.slice(0,2).map(task=>{
                  const proj=projects.find(p=>p.tasks.some(t=>t.id===task.id));
                  const sc=TS[task.status];
                  return <button key={task.id} onClick={()=>setMemo({taskId:task.id,projectId:proj?.id})}
                    style={{display:"block",width:"100%",background:sc.bar,border:"none",borderRadius:3,cursor:"pointer",padding:"2px 4px",fontSize:9,color:"white",fontWeight:600,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>
                    {task.name}
                  </button>;
                })}
                {dt.length>2&&<div style={{fontSize:9,color:"#94A3B8",paddingLeft:3}}>+{dt.length-2}개</div>}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
//  간트 차트 앱
// ════════════════════════════════════════════
function GanttApp() {
  const { today:T, ganttStart:GS, todayLeft, ganttDates } = getDateVars();
  const monthSpans = getMonthSpans(ganttDates);
  const [projects, setProjects] = useState(INIT_PROJECTS);
  const [activeView, setActiveView] = useState("gantt");
  const [sf, setSf] = useState("all");
  const [memoTask, setMemoTask] = useState(null);
  const [showAddProj, setShowAddProj] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newProj, setNewProj] = useState({name:"",color:"#4A90D9"});
  const [newTask, setNewTask] = useState({name:"",assignee:"",start:"",end:"",projectId:null,status:"todo"});
  const [confirmDel, setConfirmDel] = useState(null);

  const allTasks = projects.flatMap(p=>p.tasks);
  const stats = { all:allTasks.length, "in-progress":allTasks.filter(t=>t.status==="in-progress").length, done:allTasks.filter(t=>t.status==="done").length, delayed:allTasks.filter(t=>t.status==="delayed").length, todo:allTasks.filter(t=>t.status==="todo").length };
  const dispProj = sf==="all" ? projects : projects.map(p=>({...p,tasks:p.tasks.filter(t=>t.status===sf)})).filter(p=>p.tasks.length>0);

  const updStatus = (tid,pid,s) => setProjects(ps=>ps.map(p=>p.id===pid?{...p,tasks:p.tasks.map(t=>t.id===tid?{...t,status:s}:t)}:p));
  const updField  = (tid,pid,f,v) => setProjects(ps=>ps.map(p=>p.id===pid?{...p,tasks:p.tasks.map(t=>t.id===tid?{...t,[f]:v}:t)}:p));
  const toggleP   = id => setProjects(ps=>ps.map(p=>p.id===id?{...p,expanded:!p.expanded}:p));
  const getMemo   = () => { if(!memoTask) return null; const proj=projects.find(p=>p.id===memoTask.pid); const task=proj?.tasks.find(t=>t.id===memoTask.tid); return task?{task,proj}:null; };

  const addProj = () => {
    if(!newProj.name.trim()) return;
    setProjects(ps=>[...ps,{id:Date.now(),name:newProj.name,color:newProj.color,expanded:true,tasks:[]}]);
    setNewProj({name:"",color:"#4A90D9"}); setShowAddProj(false);
  };
  const addTask = () => {
    if(!newTask.name.trim()||!newTask.start||!newTask.end) return;
    const pid = newTask.projectId ?? projects[0]?.id;
    setProjects(ps=>ps.map(p=>p.id===pid?{...p,tasks:[...p.tasks,{id:Date.now(),name:newTask.name,assignee:newTask.assignee,start:newTask.start,end:newTask.end,status:newTask.status,memo:""}]}:p));
    setNewTask({name:"",assignee:"",start:"",end:"",projectId:null,status:"todo"}); setShowAddTask(false);
  };
  const doDel = () => {
    if(!confirmDel) return;
    if(confirmDel.type==="project") { setProjects(ps=>ps.filter(p=>p.id!==confirmDel.id)); if(memoTask?.pid===confirmDel.id) setMemoTask(null); }
    else { setProjects(ps=>ps.map(p=>p.id===confirmDel.pid?{...p,tasks:p.tasks.filter(t=>t.id!==confirmDel.id)}:p)); if(memoTask?.tid===confirmDel.id) setMemoTask(null); }
    setConfirmDel(null);
  };

  const upcoming = allTasks.filter(t=>t.status!=="done").map(t=>({...t,dl:Math.ceil((new Date(t.end)-T)/86400000)})).filter(t=>t.dl<=3).sort((a,b)=>a.dl-b.dl);
  const memoData = getMemo();
  const inp = {width:"100%",boxSizing:"border-box",padding:"8px 10px",border:"1px solid #E2E8F0",borderRadius:8,fontSize:12,outline:"none",fontFamily:"inherit"};

  return (
    <div style={{minHeight:"100%",background:"#F1F5F9",fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif"}}>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"18px"}}>
        {/* 헤더 */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <h2 style={{fontSize:18,fontWeight:700,color:"#0F172A",margin:0}}>프로젝트 스케줄</h2>
            <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>오늘: {T.getFullYear()}년 {T.getMonth()+1}월 {T.getDate()}일 {WD[T.getDay()]}요일</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{display:"flex",background:"#E2E8F0",borderRadius:8,padding:3,gap:2}}>
              {["gantt","calendar","list"].map(v=>(
                <button key={v} onClick={()=>setActiveView(v)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:500,background:activeView===v?"white":"transparent",color:activeView===v?"#0F172A":"#64748B",boxShadow:activeView===v?"0 1px 3px rgba(0,0,0,.1)":"none",transition:"all .15s"}}>
                  {v==="gantt"?"간트":v==="calendar"?"캘린더":"리스트"}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowAddProj(true)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"#6366F1",color:"white"}}>+ 프로젝트</button>
            <button onClick={()=>setShowAddTask(true)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,background:"#3B82F6",color:"white"}}>+ 테스크</button>
          </div>
        </div>

        {/* 상태 카드 */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[{k:"all",label:"전체",color:"#6366F1",cnt:stats.all},{k:"in-progress",label:"진행중",color:TS["in-progress"].text,cnt:stats["in-progress"]},{k:"done",label:"완료",color:TS.done.text,cnt:stats.done},{k:"delayed",label:"지연",color:TS.delayed.text,cnt:stats.delayed},{k:"todo",label:"할 일",color:TS.todo.text,cnt:stats.todo}].map(({k,label,color,cnt})=>(
            <button key={k} onClick={()=>setSf(sf===k&&k!=="all"?"all":k)}
              style={{flex:1,padding:"12px 6px",borderRadius:10,border:`2px solid ${sf===k?(k==="all"?"#6366F1":TS[k]?.bar||"#6366F1"):"#E2E8F0"}`,cursor:"pointer",background:sf===k?(k==="all"?"#EFF6FF":TS[k]?.bg||"#EFF6FF"):"white",textAlign:"center",transition:"all .15s"}}>
              <div style={{fontSize:22,fontWeight:800,color,lineHeight:1}}>{cnt}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:3,fontWeight:500}}>{label}</div>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            {/* 간트 뷰 */}
            {activeView==="gantt" && dispProj.map(project=>(
              <div key={project.id} style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",marginBottom:10,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",padding:"10px 14px",borderBottom:project.expanded?"1px solid #F1F5F9":"none",background:"#FAFAFA"}}>
                  <button onClick={()=>toggleP(project.id)} style={{background:"none",border:"none",cursor:"pointer",padding:0,marginRight:6,color:"#64748B",fontSize:10}}>{project.expanded?"▼":"▶"}</button>
                  <div style={{width:8,height:8,borderRadius:"50%",background:project.color,marginRight:7,flexShrink:0}}/>
                  <span style={{fontWeight:700,fontSize:13,color:"#0F172A"}}>{project.name}</span>
                  <span style={{marginLeft:"auto",fontSize:11,color:"#94A3B8",marginRight:8}}>{project.tasks.length}개</span>
                  <button onClick={()=>setConfirmDel({type:"project",id:project.id,name:project.name})} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:13,padding:"1px 3px"}}>🗑</button>
                </div>
                {project.expanded&&(
                  <div style={{overflowX:"auto"}}>
                    <div style={{minWidth:650}}>
                      {/* 월 헤더 */}
                      <div style={{display:"flex",borderBottom:"1px solid #F1F5F9"}}>
                        <div style={{width:200,flexShrink:0}}/>
                        <div style={{flex:1,display:"flex"}}>
                          {monthSpans.map((ms,i)=><div key={i} style={{width:`${(ms.count/GANTT_DAYS)*100}%`,padding:"3px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"#64748B",borderLeft:i>0?"1px solid #E2E8F0":"none"}}>{ms.label}</div>)}
                        </div>
                      </div>
                      {/* 날짜 헤더 */}
                      <div style={{display:"flex",borderBottom:"1px solid #F1F5F9"}}>
                        <div style={{width:200,flexShrink:0,borderRight:"1px solid #F1F5F9"}}/>
                        <div style={{flex:1,display:"flex"}}>
                          {ganttDates.map((d,i)=>{const it=d.toDateString()===T.toDateString(),iw=d.getDay()===0||d.getDay()===6;return <div key={i} style={{flex:1,textAlign:"center",padding:"4px 0",fontSize:9,fontWeight:it?700:400,color:it?"#EF4444":iw?"#CBD5E1":"#94A3B8",background:it?"#FFF1F2":iw?"#FAFAFA":"transparent"}}>{d.getDate()}</div>;})}
                        </div>
                      </div>
                      {/* 테스크 행 */}
                      {project.tasks.map(task=>{
                        const sc=TS[task.status];
                        return (
                          <div key={task.id} style={{display:"flex",alignItems:"center",borderBottom:"1px solid #F8FAFC",minHeight:38}}>
                            <div style={{width:200,flexShrink:0,padding:"0 10px",display:"flex",alignItems:"center",gap:6,borderRight:"1px solid #F1F5F9"}}>
                              <TIcon status={task.status}/>
                              <button onClick={()=>setMemoTask({tid:task.id,pid:project.id})} style={{background:"none",border:"none",cursor:"pointer",padding:0,textAlign:"left",fontSize:11,color:"#334155",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>
                                {task.name}{task.memo&&" 📝"}
                              </button>
                              <button onClick={()=>setConfirmDel({type:"task",id:task.id,pid:project.id,name:task.name})} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:11,padding:"1px 2px",marginLeft:"auto"}}>🗑</button>
                            </div>
                            <div style={{flex:1,position:"relative",height:38}}>
                              <div style={{position:"absolute",top:0,bottom:0,left:`${todayLeft}%`,width:2,background:"#EF4444",opacity:.6,zIndex:3}}/>
                              <div style={{position:"absolute",top:"50%",transform:"translateY(-50%)",left:`${gLeft(task.start,GS)}%`,width:`${gWidth(task.start,task.end,GS)}%`,height:22,background:sc.bar,borderRadius:5,zIndex:4,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}
                                onClick={()=>setMemoTask({tid:task.id,pid:project.id})}>
                                <span style={{fontSize:9,color:"white",fontWeight:700,padding:"0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.assignee}</span>
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

            {/* 캘린더 뷰 */}
            {activeView==="calendar"&&<CalView allTasks={allTasks} projects={projects} sf={sf} setMemo={({taskId,projectId})=>setMemoTask({tid:taskId,pid:projectId})}/>}

            {/* 리스트 뷰 */}
            {activeView==="list"&&(
              <div style={{background:"white",borderRadius:12,border:"1px solid #E2E8F0",overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#F8FAFC",borderBottom:"1px solid #E2E8F0"}}>
                    {["테스크","프로젝트","담당자","시작일","종료일","상태","메모"].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",color:"#64748B",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(sf==="all"?allTasks:allTasks.filter(t=>t.status===sf)).map(task=>{
                      const proj=projects.find(p=>p.tasks.some(t=>t.id===task.id));
                      const sc=TS[task.status];
                      return (
                        <tr key={task.id} style={{borderBottom:"1px solid #F1F5F9"}}>
                          <td style={{padding:"9px 12px"}}><button onClick={()=>setMemoTask({tid:task.id,pid:proj?.id})} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#334155",fontWeight:600,padding:0}}>{task.name}</button></td>
                          <td style={{padding:"9px 12px",color:"#64748B"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:7,height:7,borderRadius:"50%",background:proj?.color}}/>{proj?.name}</div></td>
                          <td style={{padding:"9px 12px",color:"#64748B"}}>{task.assignee}</td>
                          <td style={{padding:"9px 12px",color:"#64748B",whiteSpace:"nowrap"}}>{task.start}</td>
                          <td style={{padding:"9px 12px",color:"#64748B",whiteSpace:"nowrap"}}>{task.end}</td>
                          <td style={{padding:"6px 12px"}}>
                            <select value={task.status} onChange={e=>updStatus(task.id,proj?.id,e.target.value)} style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${sc?.bar}`,background:sc?.bg,color:sc?.text,fontSize:10,fontWeight:600,cursor:"pointer",outline:"none"}}>
                              <option value="todo">할 일</option><option value="in-progress">진행중</option><option value="done">완료</option><option value="delayed">지연</option>
                            </select>
                          </td>
                          <td style={{padding:"9px 12px"}}><button onClick={()=>setMemoTask({tid:task.id,pid:proj?.id})} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#3B82F6",padding:0}}>{task.memo?"📝 보기":"메모 추가"}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 마감 임박 사이드바 */}
          {upcoming.length>0&&!memoTask&&(
            <div style={{width:190,flexShrink:0,background:"white",borderRadius:12,border:"1px solid #E2E8F0",padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#EF4444",marginBottom:10}}>⚠️ 마감 임박</div>
              {upcoming.map(t=>(
                <div key={t.id} style={{padding:"7px 0",borderBottom:"1px solid #F8FAFC"}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#334155",lineHeight:1.4}}>{t.name}</div>
                  <div style={{fontSize:10,marginTop:2,color:t.dl<0?"#EF4444":t.dl===0?"#F97316":"#F59E0B",fontWeight:600}}>{t.dl<0?`${Math.abs(t.dl)}일 초과`:t.dl===0?"오늘 마감":`D-${t.dl}`}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메모 패널 */}
      {memoTask&&memoData&&(
        <>
          <div onClick={()=>setMemoTask(null)} style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.25)",zIndex:40}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:380,background:"white",zIndex:50,display:"flex",flexDirection:"column",boxShadow:"-6px 0 32px rgba(0,0,0,0.12)"}}>
            <div style={{padding:"16px 18px",borderBottom:"1px solid #E2E8F0",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#94A3B8",marginBottom:3}}>{memoData.proj.name}</div>
                  <div style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{memoData.task.name}</div>
                </div>
                <button onClick={()=>setMemoTask(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:"#94A3B8",padding:4,lineHeight:1}}>✕</button>
              </div>
              <select value={memoData.task.status} onChange={e=>updStatus(memoData.task.id,memoData.proj.id,e.target.value)}
                style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${TS[memoData.task.status]?.bar}`,background:TS[memoData.task.status]?.bg,color:TS[memoData.task.status]?.text,fontSize:11,fontWeight:700,cursor:"pointer",outline:"none"}}>
                <option value="todo">할 일</option><option value="in-progress">진행중</option><option value="done">완료</option><option value="delayed">지연</option>
              </select>
            </div>
            <div style={{padding:"12px 18px 0",flexShrink:0}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                {[["테스크명","name","text"],["담당자","assignee","text"],["시작일","start","date"],["종료일","end","date"]].map(([label,field,type])=>(
                  <div key={field}>
                    <label style={{fontSize:10,fontWeight:600,color:"#94A3B8",display:"block",marginBottom:3}}>{label}</label>
                    <input type={type} value={memoData.task[field]} onChange={e=>updField(memoData.task.id,memoData.proj.id,field,e.target.value)}
                      style={{width:"100%",boxSizing:"border-box",padding:"6px 8px",border:"1px solid #E2E8F0",borderRadius:7,fontSize:11,outline:"none",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"12px 18px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#334155",marginBottom:6}}>📝 메모</div>
              <textarea value={memoData.task.memo} onChange={e=>updField(memoData.task.id,memoData.proj.id,"memo",e.target.value)}
                placeholder="진행 상황, 이슈, 참고사항을 기록하세요."
                style={{width:"100%",boxSizing:"border-box",minHeight:200,border:"1px solid #E2E8F0",borderRadius:8,padding:"10px",fontSize:12,color:"#334155",resize:"vertical",fontFamily:"inherit",lineHeight:1.7,outline:"none"}}/>
            </div>
          </div>
        </>
      )}

      {/* 프로젝트 추가 모달 */}
      {showAddProj&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:14,padding:22,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#0F172A"}}>새 프로젝트 추가</h3>
            <label style={{fontSize:11,color:"#64748B",fontWeight:600,display:"block",marginBottom:4}}>프로젝트명</label>
            <input value={newProj.name} onChange={e=>setNewProj(p=>({...p,name:e.target.value}))} placeholder="프로젝트 이름" style={{...inp,marginBottom:12}}/>
            <label style={{fontSize:11,color:"#64748B",fontWeight:600,display:"block",marginBottom:6}}>색상</label>
            <div style={{display:"flex",gap:7,marginBottom:16}}>
              {["#4A90D9","#10B981","#EF4444","#8B5CF6","#F59E0B","#EC4899","#0EA5E9","#64748B"].map(c=>(
                <button key={c} onClick={()=>setNewProj(p=>({...p,color:c}))} style={{width:24,height:24,borderRadius:"50%",background:c,border:newProj.color===c?"3px solid #0F172A":"2px solid transparent",cursor:"pointer"}}/>
              ))}
            </div>
            <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAddProj(false)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",fontSize:12,color:"#64748B"}}>취소</button>
              <button onClick={addProj} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#6366F1",color:"white",cursor:"pointer",fontSize:12,fontWeight:700}}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 테스크 추가 모달 */}
      {showAddTask&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:60,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:14,padding:22,width:340,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
            <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700,color:"#0F172A"}}>새 테스크 추가</h3>
            {[["테스크명","name","text","테스크 이름"],["담당자","assignee","text","담당자 이름"],["시작일","start","date",null],["종료일","end","date",null]].map(([label,key,type,ph])=>(
              <div key={key} style={{marginBottom:9}}>
                <label style={{fontSize:11,color:"#64748B",fontWeight:600,display:"block",marginBottom:3}}>{label}</label>
                <input type={type} value={newTask[key]} onChange={e=>setNewTask(t=>({...t,[key]:e.target.value}))} placeholder={ph||""} style={inp}/>
              </div>
            ))}
            <div style={{marginBottom:9}}>
              <label style={{fontSize:11,color:"#64748B",fontWeight:600,display:"block",marginBottom:3}}>프로젝트</label>
              <select value={newTask.projectId??projects[0]?.id??""} onChange={e=>setNewTask(t=>({...t,projectId:Number(e.target.value)}))} style={{...inp,background:"white"}}>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"#64748B",fontWeight:600,display:"block",marginBottom:3}}>상태</label>
              <select value={newTask.status} onChange={e=>setNewTask(t=>({...t,status:e.target.value}))} style={{...inp,background:"white"}}>
                <option value="todo">할 일</option><option value="in-progress">진행중</option><option value="done">완료</option><option value="delayed">지연</option>
              </select>
            </div>
            <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
              <button onClick={()=>setShowAddTask(false)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",fontSize:12,color:"#64748B"}}>취소</button>
              <button onClick={addTask} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#3B82F6",color:"white",cursor:"pointer",fontSize:12,fontWeight:700}}>추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:70,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"white",borderRadius:14,padding:"24px",width:320,boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{fontSize:28,marginBottom:8}}>🗑</div>
              <div style={{fontSize:14,fontWeight:700,color:"#0F172A",marginBottom:6}}>{confirmDel.type==="project"?"프로젝트 삭제":"테스크 삭제"}</div>
              <div style={{fontSize:12,color:"#64748B",lineHeight:1.6}}>'{confirmDel.name}'을(를) 삭제할까요?{confirmDel.type==="project"&&<><br/>포함된 테스크도 모두 삭제됩니다.</>}</div>
            </div>
            <div style={{display:"flex",gap:7,marginTop:16}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,padding:"9px",borderRadius:8,border:"1px solid #E2E8F0",background:"white",cursor:"pointer",fontSize:12,fontWeight:600,color:"#64748B"}}>취소</button>
              <button onClick={doDel} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:"#EF4444",color:"white",cursor:"pointer",fontSize:12,fontWeight:700}}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
//  CEO 지시사항 트래커
// ════════════════════════════════════════════
function CEOApp() {
  const [data, setData] = useState(INIT_CEO);
  const [nextId, setNextId] = useState(9);
  const [filterStatus, setFilterStatus] = useState("전체");
  const [catFilter, setCatFilter] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'new' | item(edit)
  const [form, setForm] = useState({date:"",cat:"소싱",content:"",assignee:"",due:"",status:"미착수",progress:0,note:""});

  const today = todayStr();
  const filtered = data.filter(r=>{
    const ms = filterStatus==="전체"||r.status===filterStatus;
    const mc = !catFilter||r.cat===catFilter;
    const mq = !search||(r.content+r.assignee+r.cat).toLowerCase().includes(search.toLowerCase());
    return ms&&mc&&mq;
  });

  const kpi = s => data.filter(r=>r.status===s).length;
  const rate = data.length ? Math.round(kpi("완료")/data.length*100) : 0;

  const openNew = () => { setForm({date:today,cat:"소싱",content:"",assignee:"",due:"",status:"미착수",progress:0,note:""}); setModal("new"); };
  const openEdit = item => { setForm({...item,cat:item.cat}); setModal(item); };
  const save = () => {
    if(!form.date||!form.content.trim()||!form.assignee.trim()) return alert("지시일, 지시내용, 담당자는 필수입니다.");
    const prog = form.status==="완료"?100:Number(form.progress)||0;
    if(modal==="new") { setData(d=>[...d,{id:nextId,...form,progress:prog}]); setNextId(n=>n+1); }
    else setData(d=>d.map(r=>r.id===modal.id?{...r,...form,progress:prog}:r));
    setModal(null);
  };
  const del = id => { if(confirm("삭제하시겠습니까?")) setData(d=>d.filter(r=>r.id!==id)); };

  const catColors = {소싱:"#ede9fe//#5b21b6",염색:"#fce7f3//#9d174d",조달:"#e0f2fe//#0c4a6e",영업:"#dcfce7//#14532d",전시:"#fff7ed//#7c2d12",개발:"#f0fdf4//#166534",기타:"#f1f5f9//#475569"};
  const catStyle = cat => { const p=catColors[cat]||"#f1f5f9//#475569"; const [bg,cl]=p.split("//"); return {background:bg,color:cl}; };
  const statusColor = {완료:{bg:"#d1fae5",text:"#065f46"},진행중:{bg:"#dbeafe",text:"#1e40af"},지연:{bg:"#fef3c7",text:"#92400e"},미착수:{bg:"#f1f5f9",text:"#475569"}};
  const inp = {width:"100%",boxSizing:"border-box",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none"};

  return (
    <div style={{minHeight:"100%",background:"#f0f2f5",fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif",fontSize:14}}>
      {/* 헤더 */}
      <div style={{background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",color:"#fff",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h2 style={{fontSize:17,fontWeight:700,margin:0}}>📋 CEO 지시사항 이행 현황</h2>
          <div style={{fontSize:11,opacity:.6,marginTop:2}}>{new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}</div>
        </div>
        <button onClick={openNew} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:"#4f8ef7",color:"#fff"}}>+ 신규 등록</button>
      </div>

      {/* KPI */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,padding:"16px 24px 0"}}>
        {[{label:"전체",val:data.length,sub:"등록된 지시사항",color:"#6366f1",bdr:"#6366f1"},{label:"완료",val:kpi("완료"),sub:`완료율 ${rate}%`,color:"#10b981",bdr:"#10b981"},{label:"진행중",val:kpi("진행중"),sub:"이행 중",color:"#3b82f6",bdr:"#3b82f6"},{label:"지연",val:kpi("지연"),sub:"기한 초과",color:"#f59e0b",bdr:"#f59e0b"}].map(k=>(
          <div key={k.label} style={{background:"#fff",borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,.06)",borderLeft:`4px solid ${k.bdr}`}}>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.label}</div>
            <div style={{fontSize:26,fontWeight:800,color:k.color,marginTop:3}}>{k.val}</div>
            <div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 툴바 */}
      <div style={{display:"flex",gap:8,padding:"14px 24px 10px",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{flex:1,minWidth:180,position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:"#9ca3af",fontSize:13}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="지시내용, 담당자, 카테고리 검색..." style={{width:"100%",boxSizing:"border-box",padding:"7px 10px 7px 30px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,background:"#fff",fontFamily:"inherit",outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["전체","완료","진행중","지연","미착수"].map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filterStatus===s?"#4f8ef7":"#e2e8f0"}`,background:filterStatus===s?"#eff6ff":"#fff",color:filterStatus===s?"#2563eb":"#374151",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              {s}
            </button>
          ))}
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{padding:"6px 9px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:11,background:"#fff",fontFamily:"inherit",cursor:"pointer",outline:"none",color:"#374151"}}>
          <option value="">전체 카테고리</option>
          {["소싱","염색","조달","영업","전시","개발","기타"].map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <div style={{padding:"0 24px 24px",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
          <thead><tr style={{background:"#f8fafc"}}>
            {["No","지시일","카테고리","지시내용","담당자","완료기한","상태","진행률","비고","관리"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #e9ecef",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={10} style={{padding:40,textAlign:"center",color:"#9ca3af"}}>📭 해당하는 지시사항이 없습니다.</td></tr>
            ) : filtered.map(r=>{
              const isWarn = r.due&&r.status!=="완료"&&r.due<today;
              const sc = statusColor[r.status]||{bg:"#f1f5f9",text:"#475569"};
              const cs = catStyle(r.cat);
              return (
                <tr key={r.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"10px 12px",color:"#9ca3af",fontSize:11}}>{r.id}</td>
                  <td style={{padding:"10px 12px",fontSize:11,whiteSpace:"nowrap"}}>{r.date}</td>
                  <td style={{padding:"10px 12px"}}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:500,...cs}}>{r.cat}</span></td>
                  <td style={{padding:"10px 12px",fontSize:12,lineHeight:1.5,minWidth:180}}>{r.content}</td>
                  <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>{r.assignee}</td>
                  <td style={{padding:"10px 12px",whiteSpace:"nowrap",fontSize:11,color:isWarn?"#dc2626":"#6b7280",fontWeight:isWarn?600:400}}>{r.due||"-"}{isWarn?" ⚠️":""}</td>
                  <td style={{padding:"10px 12px"}}><span style={{display:"inline-flex",alignItems:"center",padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,...sc}}>{r.status}</span></td>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{height:5,background:"#e9ecef",borderRadius:3,minWidth:70}}><div style={{height:"100%",borderRadius:3,background:r.status==="완료"?"#10b981":r.status==="진행중"?"#3b82f6":r.status==="지연"?"#f59e0b":"#cbd5e1",width:`${r.progress}%`}}/></div>
                    <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{r.progress}%</div>
                  </td>
                  <td style={{padding:"10px 12px",fontSize:11,color:"#6b7280"}}>{r.note||""}</td>
                  <td style={{padding:"10px 12px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={()=>openEdit(r)} style={{padding:"4px 9px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,background:"#e0e7ff",color:"#4338ca"}}>수정</button>
                      <button onClick={()=>del(r.id)} style={{padding:"4px 9px",borderRadius:6,border:"none",cursor:"pointer",fontSize:11,fontWeight:500,background:"#fee2e2",color:"#dc2626"}}>삭제</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 등록/수정 모달 */}
      {modal!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#fff",borderRadius:14,width:480,maxWidth:"95vw",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #e9ecef",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <h3 style={{margin:0,fontSize:15,fontWeight:700}}>{modal==="new"?"지시사항 등록":"지시사항 수정"}</h3>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#6b7280"}}>×</button>
            </div>
            <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12,overflowY:"auto"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>지시일 *</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={inp}/></div>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>카테고리 *</label>
                  <select value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))} style={{...inp,background:"white"}}>
                    {["소싱","염색","조달","영업","전시","개발","기타"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>지시내용 *</label><textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} placeholder="CEO 지시사항을 입력하세요" style={{...inp,resize:"vertical",minHeight:60}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>담당자 *</label><input value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} placeholder="홍길동" style={inp}/></div>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>완료기한</label><input type="date" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))} style={inp}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>상태 *</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{...inp,background:"white"}}>
                    {["미착수","진행중","지연","완료"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>진행률 (%)</label><input type="number" min={0} max={100} value={form.progress} onChange={e=>setForm(f=>({...f,progress:e.target.value}))} placeholder="0" style={inp}/></div>
              </div>
              <div><label style={{fontSize:11,fontWeight:600,color:"#374151",display:"block",marginBottom:4}}>비고</label><input value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} placeholder="특이사항 또는 메모" style={inp}/></div>
            </div>
            <div style={{padding:"12px 20px",display:"flex",justifyContent:"flex-end",gap:8,borderTop:"1px solid #e9ecef",flexShrink:0}}>
              <button onClick={()=>setModal(null)} style={{padding:"8px 16px",borderRadius:8,border:"1px solid #d1d5db",background:"white",cursor:"pointer",fontSize:13,color:"#374151"}}>취소</button>
              <button onClick={save} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"#4f8ef7",color:"white",cursor:"pointer",fontSize:13,fontWeight:700}}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
//  메인 허브 (탭 전환)
// ════════════════════════════════════════════
export default function WoojuHub() {
  const [tab, setTab] = useState("gantt");
  const tabs = [
    { id:"gantt", label:"📊 프로젝트 스케줄", sub:"간트 / 캘린더 / 리스트" },
    { id:"ceo",   label:"📋 CEO 지시사항",    sub:"이행 현황 트래커" },
  ];
  return (
    <div style={{minHeight:"100vh",background:"#F1F5F9",fontFamily:"'Apple SD Gothic Neo','Malgun Gothic',sans-serif"}}>
      {/* 글로벌 헤더 */}
      <div style={{background:"#0F172A",color:"white",padding:"0 24px",display:"flex",alignItems:"stretch",gap:0}}>
        <div style={{display:"flex",alignItems:"center",marginRight:24,paddingRight:24,borderRight:"1px solid rgba(255,255,255,.1)"}}>
          <span style={{fontSize:18,marginRight:8}}>🌐</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:-.3}}>우주글로벌</div>
            <div style={{fontSize:10,opacity:.5}}>내부 관리 시스템</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"stretch",gap:2}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"14px 20px",border:"none",cursor:"pointer",background:"transparent",color:tab===t.id?"white":"rgba(255,255,255,.45)",borderBottom:tab===t.id?"3px solid #4f8ef7":"3px solid transparent",transition:"all .15s",display:"flex",flexDirection:"column",alignItems:"flex-start",gap:1}}>
              <span style={{fontSize:13,fontWeight:tab===t.id?700:500}}>{t.label}</span>
              <span style={{fontSize:10,opacity:.6}}>{t.sub}</span>
            </button>
          ))}
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",fontSize:11,opacity:.4,paddingLeft:16}}>
          ⚡ 로컬 테스트 모드
        </div>
      </div>

      {/* 컨텐츠 */}
      <div style={{display: tab==="gantt"?"block":"none"}}><GanttApp/></div>
      <div style={{display: tab==="ceo"?"block":"none"}}><CEOApp/></div>
    </div>
  );
}
