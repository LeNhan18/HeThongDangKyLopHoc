import React from "react";
import "./css/Hero.css";
const heroImg = "https://cdn.haitrieu.com/wp-content/uploads/2021/09/Logo-DH-CONG-NGHE-THANH-PHO-HO-CHI-MINH-HUTECH.png";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          Smart Learning <br />
          <span className="highlight">Deeper & More Amazing</span>
        </h1>
        <p>
          Phát triển kỹ năng, học hỏi kiến thức mới cùng hệ thống đăng ký lớp học hiện đại, realtime.
        </p>
        <div className="hero-btns">
          <a className="cta-btn" href="#courses">Start Free Trial</a>
          <a className="cta-btn secondary" href="#how">How it Works</a>
        </div>
      </div>
      <img src={heroImg} alt="Hero" className="hero-img" />
    </section>
  );
} 