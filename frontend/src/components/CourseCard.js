import React from "react";
import { useNavigate } from "react-router-dom";
import "./CourseCard.css";
import { FaUser } from "react-icons/fa";

export default function CourseCard({ course, user, onEdit, onDelete, onRegister }) {
  const navigate = useNavigate();

  const handleDetail = () => {
    navigate(`/courses/${course.id}`);
  };
  const handleRegister = () => {
    if (!user) {
      navigate("/auth");
    } else {
      onRegister && onRegister(course);
    }
  };

  return (
    <div className="course-card">
      <div className="course-img">
        {course.image && <img src={course.image} alt={course.name} />}
      </div>
      <div className="course-info">
        <h3>{course.name}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><FaUser /> Giảng viên: ...</span>
        </div>
        <button className="enroll-btn" onClick={handleDetail}>
          Xem chi tiết
        </button>
        {user && user.roles && user.roles.some(r => r.toLowerCase() === "student") && (
          <button className="enroll-btn" style={{background:'#4f8cff',marginLeft:8}} onClick={handleRegister}>
            Đăng ký khóa học
          </button>
        )}
        {user && user.roles && (user.roles.some(r => r.toLowerCase() === "teacher") || user.roles.some(r => r.toLowerCase() === "admin")) && (
          <>
            <button className="enroll-btn" style={{background:'#888',marginLeft:8}} onClick={() => onEdit && onEdit(course)}>
              Sửa
            </button>
            <button className="enroll-btn" style={{background:'#e74c3c',marginLeft:8}} onClick={() => onDelete && onDelete(course)}>
              Xóa
            </button>
          </>
        )}
      </div>
    </div>
  );
} 