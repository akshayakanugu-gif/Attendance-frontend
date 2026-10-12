import { useState, useEffect } from "react"
const BACKEND = "http://attendance-backend-ypkj.onrender.com"

// 5 FIXED STUDENTS
const FIVE_STUDENTS = [
  { name: "Akshaya", email: "akshaya@gmail.com" },
  { name: "Rahul", email: "rahul@gmail.com" },
  { name: "Priya", email: "priya@gmail.com" },
  { name: "Ayan", email: "ayan@gmail.com" },
  { name: "Sneha", email: "sneha@gmail.com" },
]

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"))
  const [subject, setSubject] = useState("DBMS")
  const [marked, setMarked] = useState({})
  const [records, setRecords] = useState(JSON.parse(localStorage.getItem("attendance") || "[]"))

  useEffect(() => {
    let init = {}
    FIVE_STUDENTS.forEach(s => init[s.email] = true)
    setMarked(init)
    fetch(`${BACKEND}/attendance`).then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setRecords(d) }).catch(()=>{})
  }, [])

  const markAttendance = async () => {
    const date = new Date().toLocaleDateString()
    const time = new Date().toLocaleTimeString()
    const newRecords = []
    for(let s of FIVE_STUDENTS){
      const rec = { studentEmail: s.email, studentName: s.name, subject, date, time, status: marked[s.email] ? "Present" : "Absent" }
      newRecords.push(rec)
      // try backend also
      try{ await fetch(`${BACKEND}/attendance`, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(rec)}) }catch(e){}
    }
    const all = [...records, ...newRecords]
    setRecords(all)
    localStorage.setItem("attendance", JSON.stringify(all))
    alert(`Attendance marked for ${subject} at ${time}`)
  }

  if(!user) return <Login setUser={setUser} />

  if(user.role === "student"){
    const myRecords = records.filter(r => r.studentEmail === user.email)
    return (
      <div style={{padding:20, fontFamily:"Arial"}}>
        <h2>Student: {user.email}</h2>
        <button onClick={()=>{localStorage.removeItem("user"); setUser(null)}}>Logout</button>
        <h3>My Attendance - Subject Wise</h3>
        <table border="1" cellPadding="10" style={{width:"100%", marginTop:10}}>
          <thead><tr><th>Subject</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
          <tbody>{myRecords.map((a,i)=><tr key={i}><td>{a.subject}</td><td>{a.date}</td><td>{a.time}</td><td style={{color:a.status==="Present"?"green":"red", fontWeight:"bold"}}>{a.status}</td></tr>)}</tbody>
        </table>
        {myRecords.length===0 && <p>No attendance marked yet</p>}
      </div>
    )
  }

  return (
    <div style={{padding:20, fontFamily:"Arial"}}>
      <h2>Faculty Dashboard: {user.email}</h2>
      <button onClick={()=>{localStorage.removeItem("user"); setUser(null)}}>Logout</button>
      
      <div style={{margin:"20px 0"}}>
        <b>Select Subject: </b>
        <select value={subject} onChange={e=>setSubject(e.target.value)} style={{padding:10, fontSize:16}}>
          <option>DBMS</option><option>Operating System</option><option>CN</option><option>Java</option><option>Python</option>
        </select>
      </div>

      <h3>Mark Attendance - 5 Students</h3>
      {FIVE_STUDENTS.map(s=>(
        <div key={s.email} style={{border:"1px solid #ccc", padding:12, margin:6, display:"flex", justifyContent:"space-between"}}>
          <span><b>{s.name}</b> - {s.email}</span>
          <label><input type="checkbox" checked={marked[s.email]||false} onChange={e=>setMarked({...marked, [s.email]: e.target.checked})} /> Present</label>
        </div>
      ))}
      <button onClick={markAttendance} style={{background:"orange", color:"white", padding:14, width:"100%", fontSize:18, marginTop:15, border:"none"}}>MARK ATTENDANCE FOR {subject}</button>

      <h3 style={{marginTop:30}}>All Records ({records.length})</h3>
      <table border="1" cellPadding="8" style={{width:"100%"}}>
        <thead><tr><th>Student</th><th>Subject</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>{records.slice().reverse().slice(0,20).map((a,i)=><tr key={i}><td>{a.studentName}</td><td>{a.subject}</td><td>{a.date}</td><td>{a.time}</td><td>{a.status}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function Login({setUser}){
  const [email,setEmail] = useState("")
  const [pass,setPass] = useState("")
  const doLogin = async () => {
    try{
      const res = await fetch(`${BACKEND}/login`, {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({email, password: pass})})
      const data = await res.json()
      if(data.user){ localStorage.setItem("user", JSON.stringify(data.user)); setUser(data.user); return }
    }catch(e){}
    // fallback demo login if backend not working
    if(email.includes("faculty")){ const u={email, role:"faculty"}; localStorage.setItem("user", JSON.stringify(u)); setUser(u) }
    else if(email){ const u={email, role:"student"}; localStorage.setItem("user", JSON.stringify(u)); setUser(u) }
    else alert("Enter email")
  }
  return (
    <div style={{padding:50}}>
      <h2>Attendance Login</h2>
     
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10, width:"80%"}} /><br/><br/>
      <input placeholder="password" type="password" value={pass} onChange={e=>setPass(e.target.value)} style={{padding:10, width:"80%"}} /><br/><br/>
      <button onClick={doLogin} style={{padding:10, width:"85%", background:"blue", color:"white"}}>Login</button>
    </div>
  )
}

export default App
