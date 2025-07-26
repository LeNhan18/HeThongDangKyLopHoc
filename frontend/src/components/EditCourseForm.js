import React, { useState } from "react";
import axios from "axios";

export default function EditCourseForm({ course, onClose, onSuccess, isCreate }) {
  const [form, setForm] = useState({
    name: course.name,
    description: course.description || "",
    image: course.image || ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [imagePreview, setImagePreview] = useState(course.image || "");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Xử lý chọn file ảnh và upload lên server
  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (file) {
      // Hiển thị preview
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);

      // Upload lên server
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await axios.post("http://localhost:8000/upload-image/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setForm(f => ({ ...f, image: res.data.url }));
        setImagePreview(res.data.url); // Cập nhật preview là link ảnh thật sau khi upload
      } catch (err) {
        alert("Lỗi upload ảnh!");
      }
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        image: form.image || course.image || ""
      };
      console.log("DEBUG - Data being sent:", data);
      if (isCreate) {
        await axios.post("http://localhost:8000/courses/", data);
      } else {
        await axios.put(`http://localhost:8000/courses/${course.id}`, data);
      }
      setMsg(isCreate ? "Tạo mới thành công!" : "Cập nhật thành công!");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("DEBUG - Error:", err.response?.data || err);
      setMsg("Lỗi khi cập nhật!");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 320 }}>
      <h3>{isCreate ? "Thêm khóa học" : "Sửa khóa học"}</h3>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        placeholder="Tên khóa học"
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Mô tả"
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ marginBottom: 8 }}
      />
      {imagePreview && (
        <img src={imagePreview} alt="preview" style={{ width: 120, marginBottom: 8, borderRadius: 8 }} />
      )}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button type="submit" disabled={loading} style={{ padding: "8px 24px", borderRadius: 6, background: "#ff6f00", color: "#fff", border: "none", fontWeight: 600 }}>
          {isCreate ? "Tạo mới" : "Lưu"}
        </button>
        <button type="button" onClick={onClose} style={{ padding: "8px 24px", borderRadius: 6, background: "#888", color: "#fff", border: "none", fontWeight: 600 }}>
          Đóng
        </button>
      </div>
      {msg && <div style={{ color: msg.includes("lỗi") ? "red" : "green", marginTop: 12 }}>{msg}</div>}
    </form>
  );
} 