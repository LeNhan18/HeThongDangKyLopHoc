import React from "react";
import "./css/Hero.css";
const heroImg = "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80";

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