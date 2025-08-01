import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CourseAdminPage({ user }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [editing, setEditing] = useState(null); // course object or null
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user || !user.roles || (!user.roles.some(r => r.toLowerCase() === "teacher") && !user.roles.some(r => r.toLowerCase() === "admin"))) {
      navigate("/");
    } else {
      fetchCourses();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchCourses = async () => {
    const res = await axios.get("http://localhost:8000/courses/");
    setCourses(res.data);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = course => {
    setEditing(course);
    setForm({ name: course.name, description: course.description || "", image: course.image || "" });
    setMsg("");
  };

  const handleDelete = async id => {
    if (!window.confirm("Bạn chắc chắn muốn xóa?")) return;
    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/courses/${id}`);
      setMsg("Đã xóa thành công!");
      fetchCourses();
    } catch (err) {
      console.error("Lỗi xóa khóa học:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert("Lỗi: " + err.response.data.detail);
        setMsg("Lỗi: " + err.response.data.detail);
      } else {
        alert("Lỗi xóa khóa học!");
        setMsg("Lỗi xóa khóa học!");
      }
    }
    setLoading(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await axios.put(`http://localhost:8000/courses/${editing.id}`, form);
        setMsg("Đã cập nhật thành công!");
        alert("Đã cập nhật thành công!");
      } else {
        await axios.post("http://localhost:8000/courses/", form);
        setMsg("Đã thêm mới thành công!");
        alert("Đã thêm mới thành công!");
      }
      setForm({ name: "", description: "", image: "" });
      setEditing(null);
      fetchCourses();
    } catch (err) {
      console.error("Lỗi khi lưu khóa học:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        alert("Lỗi: " + err.response.data.detail);
        setMsg("Lỗi: " + err.response.data.detail);
      } else {
        alert("Lỗi khi lưu khóa học!");
        setMsg("Lỗi khi lưu khóa học!");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px #eee" }}>
      <h2>Quản lý khóa học</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <input
          type="text"
          name="name"
          placeholder="Tên khóa học"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <textarea
          name="description"
          placeholder="Mô tả"
          value={form.description}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <input
          type="text"
          name="image"
          placeholder="Link ảnh (tùy chọn)"
          value={form.image}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 8, padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ padding: "8px 24px", borderRadius: 6, background: "#ff6f00", color: "#fff", border: "none", fontWeight: 600 }}>
          {editing ? "Cập nhật" : "Thêm mới"}
        </button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "", image: "" }); }} style={{ marginLeft: 12 }}>Hủy</button>}
      </form>
      {msg && <div style={{ color: msg.includes("lỗi") ? "red" : "green", marginBottom: 16 }}>{msg}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f8f8" }}>
            <th style={{ padding: 8, border: "1px solid #eee" }}>Tên</th>
            <th style={{ padding: 8, border: "1px solid #eee" }}>Mô tả</th>
            <th style={{ padding: 8, border: "1px solid #eee" }}>Ảnh</th>
            <th style={{ padding: 8, border: "1px solid #eee" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.id}>
              <td style={{ padding: 8, border: "1px solid #eee" }}>{course.name}</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>{course.description}</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>{course.image ? <img src={course.image} alt="img" style={{ width: 60, borderRadius: 6 }} /> : ""}</td>
              <td style={{ padding: 8, border: "1px solid #eee" }}>
                <button onClick={() => handleEdit(course)} style={{ marginRight: 8 }}>Sửa</button>
                <button onClick={() => handleDelete(course.id)} style={{ color: "red" }}>Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 