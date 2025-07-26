import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  
  // Kiểm tra user có role admin không
  const isAdmin = user && user.roles && user.roles.some(r => r.toLowerCase() === "admin");
  
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
          {isAdmin && (
            <button 
              onClick={() => navigate("/admin/users")} 
              style={{
                marginLeft:8,
                padding:'4px 12px',
                borderRadius:6,
                border:'none',
                background:'#ff6f00',
                color:'#fff',
                fontWeight:600,
                cursor:'pointer'
              }}
            >
              Admin
            </button>
          )}
          <button onClick={onLogout} style={{marginLeft:8,padding:'4px 12px',borderRadius:6,border:'none',background:'#e74c3c',color:'#fff',fontWeight:600,cursor:'pointer'}}>Đăng xuất</button>
        </div>
      ) : (
        <button className="join-btn" onClick={() => navigate("/auth")}>Đăng nhập</button>
      )}
    </header>
  );
} 