const BACKEND = "https://attendance-backend-ypkj.onrender.com";
import { useState, useEffect } from "react";
const FIVE_STUDENTS = ["akshaya@gmail.com","rahul@gmail.com","priya@gmail.com","ayan@gmail.com","sneha@gmail.com"];
const SUBJECTS = ["DBMS","SE","OS","CN","AI"];

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [presentMap, setPresentMap] = useState({});
  const [records, setRecords] = useState([]); const [msg, setMsg] = useState("");

  useEffect(()=>{
    const u = localStorage.getItem("user"); if(u) setUser(JSON.parse(u));
    const m={}; FIVE_STUDENTS.forEach(s=>m[s]=true); setPresentMap(m);
    load(); fetch(BACKEND).catch(()=>{});
  },[]);

  const load = async ()=>{
    try{ const r=await fetch(`${BACKEND}/attendance`); const d=await r.json(); setRecords(Array.isArray(d)?d:[]); }catch{}
  };

  const login = async ()=>{
    try{
      const r=await fetch(`${BACKEND}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:pass})});
      const d=await r.json(); if(!r.ok){setMsg(d.error); return;}
      localStorage.setItem("user",JSON.stringify(d)); setUser(d); load();
    }catch{ setMsg("Backend sleeping, open backend URL first!"); }
  };

  const mark = async ()=>{
    setMsg("Saving to LIVE backend...");
    const now=new Date();
    const payload=FIVE_STUDENTS.map(s=>({studentEmail:s,subject:subject,status:presentMap[s]?"Present":"Absent",byFaculty:user.email,date:now.toLocaleDateString(),time:now.toLocaleTimeString()}));
    try{
      const r=await fetch(`${BACKEND}/attendance`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json(); if(!r.ok) throw new Error(d.error);
      setMsg(`✅ LIVE SAVED! Total: ${d.count}`); load();
    }catch(e){ setMsg("❌ "+e.message); }
  };

  if(!user) return (
    <div style={{padding:20,maxWidth:350,margin:"40px auto",border:"1px solid #ccc"}}>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:8}}/>
      <input placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{width:"100%",padding:8,margin:"5px 0"}}/>
      <button onClick={login} style={{width:"100%",padding:10,background:"black",color:"white"}}>Login</button>
      <p style={{color:"red"}}>{msg}</p>
      <a href={BACKEND} target="_blank">Wake backend</a>
    </div>
  );

  return (
    <div style={{padding:15}}>
      <h3>{user.email} <button onClick={()=>{localStorage.clear(); setUser(null);}}>Logout</button></h3>
      <select value={subject} onChange={e=>setSubject(e.target.value)}>{SUBJECTS.map(s=><option key={s}>{s}</option>)}</select>
      {FIVE_STUDENTS.map(s=>(
        <div key={s} style={{display:"flex",justifyContent:"space-between",padding:6,borderBottom:"1px solid #ddd"}}>
          <span>{s}</span><label><input type="checkbox" checked={!!presentMap[s]} onChange={e=>setPresentMap({...presentMap,[s]:e.target.checked})}/> Present</label>
        </div>
      ))}
      <button onClick={mark} style={{width:"100%",padding:12,background:"orange",fontWeight:"bold",marginTop:10}}>MARK ATTENDANCE</button>
      <p style={{color:msg.includes("✅")?"green":"red",fontWeight:"bold"}}>{msg}</p>
      <h4>Live Records ({records.length})</h4>
      <div>{records.slice().reverse().slice(0,20).map((r,i)=><div key={i} style={{background:r.status==="Absent"?"#ffdddd":"#ddffdd",padding:4}}>{r.studentEmail} - {r.subject} - {r.status}</div>)}</div>
    </div>
  );
}
