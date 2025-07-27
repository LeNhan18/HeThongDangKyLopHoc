import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPage.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    roles: ["student"]
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/users/");
      setUsers(response.data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách user:", error);
      alert("Không thể lấy danh sách user!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Cập nhật user
        await axios.put(`http://localhost:8000/users/${editingUser.id}`, form);
        alert("Cập nhật user thành công!");
      } else {
        // Tạo user mới
        await axios.post("http://localhost:8000/users/", form);
        alert("Tạo user thành công!");
      }
      setShowModal(false);
      setEditingUser(null);
      setForm({ email: "", password: "", name: "", roles: ["student"] });
      fetchUsers();
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Có lỗi xảy ra!");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      name: user.name || "",
      roles: user.roles || ["student"]
    });
    setShowModal(true);
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Bạn có chắc muốn xóa user "${user.email}"?`)) {
      try {
        await axios.delete(`http://localhost:8000/users/${user.id}`);
        alert("Xóa user thành công!");
        fetchUsers();
      } catch (error) {
        console.error("Lỗi khi xóa user:", error);
        alert("Không thể xóa user!");
      }
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setForm({ email: "", password: "", name: "", roles: ["student"] });
    setShowModal(true);
  };

  if (loading) {
    return <div className="admin-loading">Đang tải...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý User</h1>
        <button className="add-user-btn" onClick={handleAdd}>
          ➕ Thêm User
        </button>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Tên</th>
              <th>Roles</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.name || "Chưa có tên"}</td>
                <td>
                  <div className="roles-tags">
                    {user.roles.map((role, index) => (
                      <span key={index} className={`role-tag role-${role.toLowerCase()}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEdit(user)}
                    >
                      ✏️ Sửa
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(user)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingUser ? "Sửa User" : "Thêm User"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu {editingUser && "(để trống nếu không đổi)"}:</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Tên:</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Roles:</label>
                <select
                  multiple
                  value={form.roles}
                  onChange={(e) => setForm({...form, roles: Array.from(e.target.selectedOptions, option => option.value)})}
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingUser ? "Cập nhật" : "Tạo mới"}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 