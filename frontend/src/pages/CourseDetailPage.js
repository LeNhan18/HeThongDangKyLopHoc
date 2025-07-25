import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CourseDetailPage.css";

function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/courses/${courseId}`)
      .then(res => setCourse(res.data))
      .catch(() => setCourse(null));
  }, [courseId]);

  if (course === null) return <div>Đang tải...</div>;
  if (!course) return <div>Không tìm thấy khóa học</div>;

  return (
    <div className="course-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Quay lại</button>
      <div className="course-detail-card">
        <img src={course.image || "/default-course.jpg"} alt={course.name} className="course-detail-image" />
        <div className="course-detail-info">
          <h2>{course.name}</h2>
          <p>{course.description}</p>
        </div>
      </div>
      <div className="course-sections">
        <h3>Chương trình học</h3>
        {course.sections && course.sections.length > 0 ? (
          course.sections.map((section, idx) => (
            <div className="section-block" key={section.id}>
              <div className="section-title">
                <span>Chương {idx + 1}: {section.title}</span>
              </div>
              <ul className="lesson-list">
                {section.lessons && section.lessons.length > 0 ? (
                  section.lessons.map((lesson, lidx) => (
                    <li key={lesson.id} className="lesson-item">
                      <span>Bài {lidx + 1}: {lesson.title}</span>
                      {lesson.video_url && (
                        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="lesson-link">
                          Xem video
                        </a>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="lesson-item">Chưa có bài học</li>
                )}
              </ul>
            </div>
          ))
        ) : (
          <div>Chưa có chương nào</div>
        )}
      </div>
    </div>
  );
}

export default CourseDetailPage; 