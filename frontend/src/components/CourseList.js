import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseCard from "./CourseCard";
import "./CourseList.css";
import EditCourseForm from "./EditCourseForm";

export default function CourseList({ user, onRequireAuth }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [adding, setAdding] = useState(false);

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

  const handleDelete = async (course) => {
    console.log("DEBUG handleDelete:", course);
    if (window.confirm(`Bạn có chắc muốn xóa khóa học "${course.name}"?`)) {
      try {
        console.log("DEBUG handleDelete: Gọi API DELETE");
        await axios.delete(`http://localhost:8000/courses/${course.id}`);
        console.log("DEBUG handleDelete: Xóa thành công");
        alert("Xóa khóa học thành công!");
        // Refresh danh sách khóa học
        const res = await axios.get("http://localhost:8000/courses/");
        setCourses(res.data);
      } catch (err) {
        console.error("DEBUG handleDelete - Lỗi:", err.response?.data || err);
        alert("Xóa khóa học thất bại!");
      }
    }
  };

  // Xử lý thêm mới khóa học
  const handleAddCourse = async (form) => {
    try {
      await axios.post("http://localhost:8000/courses/", form);
      setAdding(false);
      // Refresh danh sách
      const res = await axios.get("http://localhost:8000/courses/");
      setCourses(res.data);
    } catch (err) {
      alert("Lỗi khi thêm khóa học!");
    }
  };

  // Kiểm tra quyền admin/teacher
  const canManage = user && user.roles && (user.roles.some(r => r.toLowerCase() === "admin") || user.roles.some(r => r.toLowerCase() === "teacher"));

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
        {canManage && (
          <button className="add-course-btn" onClick={() => setAdding(true)}>
            <span style={{fontSize:'1.3em',marginRight:4}}>➕</span> Thêm khóa học
          </button>
        )}
      </div>
      <div className="course-cards">
        {filtered.length === 0 ? (
          <div>Không có khóa học nào.</div>
        ) : (
          filtered.map(course => (
            course && (
              <CourseCard
                key={course.id}
                course={course}
                user={user}
                onRequireAuth={onRequireAuth}
                onRegister={handleRegister}
                onEdit={setEditingCourse}
                onDelete={handleDelete}
              />
            )
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
      {adding && (
        <div className="modal-overlay">
          <div className="modal-content">
            <EditCourseForm
              course={{ name: "", description: "", image: "" }}
              onClose={() => setAdding(false)}
              onSuccess={handleAddCourse}
              isCreate={true}
            />
          </div>
        </div>
      )}
    </section>
  );
} 