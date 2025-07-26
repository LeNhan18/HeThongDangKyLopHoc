import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  return (
    <header className="header">
      <div className="logo">IT skill+</div>
      <nav>
        <a href="#courses">Course</a>
        <a href="#about">About</a>
        <a href="#stats">Stats</a>
        <a href="#blog">Blog</a>
      </nav>
      {user ? (
        <div className="user-info" style={{color:'#fff',fontWeight:'bold',marginLeft:16,display:'flex',alignItems:'center',gap:12}}>
          {user.email}
          <button onClick={onLogout} style={{marginLeft:8,padding:'4px 12px',borderRadius:6,border:'none',background:'#e74c3c',color:'#fff',fontWeight:600,cursor:'pointer'}}>Đăng xuất</button>
        </div>
      ) : (
        <button className="join-btn" onClick={() => navigate("/auth")}>Đăng nhập</button>
      )}
    </header>
  );
} 