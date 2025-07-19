import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:8000";

function App() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/courses/`)
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]));
  }, []);

  return (
    <div className="main-bg">
      <header className="header">
        <div className="logo">HTĐK Lớp Học</div>
        <nav>
          <a href="#features">Tính năng</a>
          <a href="#courses">Khóa học</a>
          <a href="#about">Giới thiệu</a>
          <a href="#contact">Liên hệ</a>
        </nav>
      </header>
      <section className="hero">
        <h1>Hệ Thống Đăng Ký Lớp Học</h1>
        <p>Đăng ký lớp học, quản lý khóa học, realtime, dashboard hiện đại cho trường học và trung tâm đào tạo.</p>
        <a className="cta-btn" href="#features">Khám phá ngay</a>
      </section>
      <section id="features" className="features">
        <h2>Tính năng nổi bật</h2>
        <ul>
          <li>Đăng ký lớp học, khóa học realtime</li>
          <li>Quản lý học viên, giảng viên, quản trị</li>
          <li>Thông báo xác nhận, thay đổi lịch học</li>
          <li>Chống trùng lặp đăng ký, tối ưu lịch học</li>
          <li>Dashboard thống kê, báo cáo nhanh</li>
        </ul>
      </section>
      <section id="courses" className="features">
        <h2>Danh sách khóa học</h2>
        {courses.length === 0 ? (
          <div>Không có khóa học nào.</div>
        ) : (
          <ul>
            {courses.map((course) => (
              <li key={course.id}>
                <strong>{course.name}</strong> <br />
                <span style={{ color: '#b0bec5' }}>{course.description}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section id="about" className="about">
        <h2>Giới thiệu</h2>
        <p>
          Ứng dụng giúp trường học, trung tâm đào tạo, học online quản lý lớp học hiệu quả, đăng ký tức thì, cập nhật trạng thái realtime.
        </p>
      </section>
      <footer className="footer" id="contact">
        <div>Liên hệ: <a href="mailto:admin@htdk.com">admin@htdk.com</a></div>
        <div>© {new Date().getFullYear()} HTĐK Lớp Học</div>
      </footer>
    </div>
  );
}

export default App;
