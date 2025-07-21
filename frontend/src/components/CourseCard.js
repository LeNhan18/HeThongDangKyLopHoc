import React from "react";
import "./CourseCard.css";
import { FaUser } from "react-icons/fa";

export default function CourseCard({ course }) {
  return (
    <div className="course-card">
      <div className="course-img">
        {course.image && <img src = {course.image} alt= {course.name} />}
        </div>
      <div className="course-info">
        <h3>{course.name}</h3>
        <p>{course.description}</p>
        <div className="course-meta">
          <span><FaUser /> Giảng viên: ...</span>
        </div>
        <button className="enroll-btn">Xem chi tiết</button>
      </div>
    </div>
  );
} 