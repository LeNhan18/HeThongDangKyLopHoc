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

  // Xử lý URL ảnh
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Nếu URL bắt đầu bằng http, giữ nguyên
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // Nếu là relative path, thêm domain backend
    return `http://localhost:8000${imageUrl}`;
  };

  const imageUrl = getImageUrl(course.image);

  return (
    <div className="course-card">
      <div className="course-img">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={course.name}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="course-img-placeholder" style={{ display: imageUrl ? 'none' : 'flex' }}>
          <span>{course.name?.charAt(0)?.toUpperCase() || 'C'}</span>
        </div>
      </div>
      <div className="course-info">
        <h3>{course.name}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><FaUser /> Giảng viên: {user.name}</span>
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