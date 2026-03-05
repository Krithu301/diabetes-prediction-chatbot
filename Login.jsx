import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const nav=useNavigate();
  async function submit(e){ e.preventDefault(); try{ const res=await axios.post('/api/auth/login',{email,password}); localStorage.setItem('token', res.data.token); localStorage.setItem('user', JSON.stringify(res.data.user)); nav('/dashboard'); }catch(e){ alert(e.response?.data?.error||'Login failed') } }
  return <div style={{maxWidth:420,margin:'60px auto'}} className="card"><h2>Sign in</h2><form onSubmit={submit}><label>Email<input value={email} onChange={e=>setEmail(e.target.value)} /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label><div style={{display:'flex',gap:8}}><button type="submit">Sign in</button><Link to="/register"><button type="button">Register</button></Link></div></form></div>
}
