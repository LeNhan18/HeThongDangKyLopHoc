import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="logo">DEVSKILL+</div>
      <nav>
        <a href="#courses">Course</a>
        <a href="#about">About</a>
        <a href="#stats">Stats</a>
        <a href="#blog">Blog</a>
      </nav>
      <button className="join-btn">Join Us</button>
    </header>
  );
} 