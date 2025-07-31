import React from "react";
import "./css/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div>Liên hệ: <a href="mailto:admin@htdk.com">admin@htdk.com</a></div>
      <div>© {new Date().getFullYear()} HTĐK Lớp Học</div>
    </footer>
  );
} 