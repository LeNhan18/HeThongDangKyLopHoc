import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseCard from "./CourseCard";
import "./CourseList.css";
import EditCourseForm from "./EditCourseForm";

export default function CourseList({ user, onRequireAuth }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8000/courses/")
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]));
  }, []);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRegister = async (course) => {
    if (!user) {
      onRequireAuth && onRequireAuth();
      return;
    }
    if (!course.classes || course.classes.length === 0) {
      alert("Khóa học này chưa có lớp để đăng ký!");
      return;
    }
    const classId = course.classes[0].id;
    try {
      await axios.post(`http://localhost:8000/register_class/${classId}`);
      alert("Đăng ký lớp học thành công!");
    } catch (err) {
      alert("Đăng ký thất bại hoặc bạn đã đăng ký lớp này!");
    }
  };

  return (
    <section className="course-list" id="courses">
      <h2>Explore Our Course</h2>
      <div className="course-search">
        <input
          type="text"
          placeholder="Search Courses"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="course-cards">
        {filtered.length === 0 ? (
          <div>Không có khóa học nào.</div>
        ) : (
          filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              user={user}
              onRequireAuth={onRequireAuth}
              onRegister={handleRegister}
              onEdit={setEditingCourse} // Truyền hàm này
            />
          ))
        )}
      </div>
      {editingCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditCourseForm
              course={editingCourse}
              onClose={() => setEditingCourse(null)}
              onSuccess={() => {
                setEditingCourse(null);
                axios.get("http://localhost:8000/courses/").then(res => setCourses(res.data));
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
} 