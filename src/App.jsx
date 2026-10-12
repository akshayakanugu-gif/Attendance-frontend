import { useState, useEffect } from "react";

const BACKEND = "https://attendance-backend-ypkj.onrender.com";
const FIVE_STUDENTS = [
  "Arjun@gmail.com","Priya@gmail.com","Rahul@gmail.com","Sneha@gmail.com","Aman@gmail.com"
];
const SUBJECTS = ["DBMS","SE","OS","CN","AI"];

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [presentMap, setPresentMap] = useState({});
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadRecords();
    // Wake up backend on load
    fetch(BACKEND).catch(()=>{});
    const init = {};
    FIVE_STUDENTS.forEach(e => init[e]=true);
    setPresentMap(init);
  }, []);

  const loadRecords = async () => {
    try {
      const res = await fetch(`${BACKEND}/attendance`);
      const data = await res.json();
      // Support both old {attendance:[]} and new []
      const arr = Array.isArray(data)? data : (data.attendance || []);
      setAllRecords(arr);
      localStorage.setItem("attendance", JSON.stringify(arr));
    } catch {
      const local = JSON.parse(localStorage.getItem("attendance")||"[]");
      setAllRecords(local);
    }
  };

  const login = async () => {
    try {
      const res = await fetch(`${BACKEND}/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({email, password: pass})
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error||"Login failed"); return; }
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data); setMsg(""); loadRecords();
    } catch { setMsg("Backend sleeping, wait 30 sec and try again"); }
  };

  const markAttendance = async () => {
    setLoading(true); setMsg("Waking up backend... (30 sec)");
    // Step 1: Wake up backend first!
    try { await fetch(BACKEND); } catch {}
    await new Promise(r=>setTimeout(r, 3000));

    setMsg("Saving attendance...");
    const now = new Date();
    const recordsToSave = FIVE_STUDENTS.map(stuEmail => ({
      studentEmail: stuEmail,
      subject: subject,
      status: presentMap[stuEmail]? "Present" : "Absent",
      byFaculty: user.email,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    }));

    try {
      const res = await fetch(`${BACKEND}/attendance`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(recordsToSave)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`✅ Saved! Backend now has ${data.count} records`);
      loadRecords();
    } catch (e) {
      // Fallback to local + show error
      const existing = JSON.parse(localStorage.getItem("attendance")||"[]");
      const merged = [...existing,...recordsToSave];
      localStorage.setItem("attendance", JSON.stringify(merged));
      setAllRecords(merged);
      setMsg(`⚠️ Backend sleep, saved locally. Refresh backend page then mark again! Error: ${e.message}`);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div style={{padding:20, maxWidth:400, margin:"50px auto"}}>
        <h2>Attendance Login</h2>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%", padding:8, margin:"5px 0"}}/>
        <input placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{width:"100%", padding:8, margin:"5px 0"}}/>
        <button onClick={login} style={{width:"100%", padding:10, background:"black", color:"white"}}>Login</button>
        <p style={{color:"red"}}>{msg}</p>
        <p style={{fontSize:12}}>faculty@gmail.com / 1234<br/>Arjun@gmail.com / 1234 etc</p>
      </div>
    );
  }

  return (
    <div style={{padding:20}}>
      <h3>Faculty Dashboard: {user.email}</h3>
      <button onClick={()=>{localStorage.removeItem("user"); setUser(null);}}>Logout</button>
      <hr/>
      <label>Select Subject: </label>
      <select value={subject} onChange={e=>setSubject(e.target.value)}>
        {SUBJECTS.map(s=><option key={s}>{s}</option>)}
      </select>
      <h4>Mark Attendance - {FIVE_STUDENTS.length} Students</h4>
      {FIVE_STUDENTS.map(stu=>(
        <div key={stu} style={{display:"flex", justifyContent:"space-between", padding:8, borderBottom:"1px solid #ccc"}}>
          <span>{stu}</span>
          <label><input type="checkbox" checked={presentMap[stu]||false} onChange={e=>setPresentMap({...presentMap, [stu]: e.target.checked})}/> Present</label>
        </div>
      ))}
      <button onClick={markAttendance} disabled={loading} style={{width:"100%", padding:12, background:"orange", marginTop:10, fontWeight:"bold"}}>
        {loading? "Saving..." : "MARK ATTENDANCE - 5 Students"}
      </button>
      <p style={{fontWeight:"bold", color: msg.includes("✅")?"green":"red"}}>{msg}</p>
      <h4>All Records ({allRecords.length}) - From Backend</h4>
      <div style={{maxHeight:300, overflow:"auto"}}>
        {allRecords.slice().reverse().map((r,i)=>(
          <div key={i} style={{padding:5, borderBottom:"1px solid #eee", background: r.status==="Absent"?"#ffcccc":"#ccffcc"}}>
            {r.studentEmail} - {r.subject} - <b>{r.status}</b> - {r.date} {r.time}
          </div>
        ))}
      </div>
      <hr/>
      <a href={BACKEND} target="_blank">Open Backend (to wake it)</a>
    </div>
  );
}
