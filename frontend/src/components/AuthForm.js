import React, { useState } from "react";
import axios from "axios";
import "./AuthForm.css";

export default function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      if (isLogin) {
        // Đăng nhập
        const params = new URLSearchParams();
        params.append("email", form.email);
        params.append("password", form.password);
        const res = await axios.post("http://localhost:8000/auth/login", params);
        setMsg("Đăng nhập thành công!");
        onAuthSuccess && onAuthSuccess(res.data);
      } else {
        // Đăng ký
        await axios.post("http://localhost:8000/users/register", {
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setMsg("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
      }
    } catch (err) {
      setMsg(
        err.response?.data?.detail ||
        (isLogin ? "Đăng nhập thất bại!" : "Đăng ký thất bại!")
      );
    }
    setLoading(false);
  };

  return (
    <div className={`auth-container ${isLogin ? "" : "signup-mode"}`}>
      <div className="form-box">
        <h2>{isLogin ? "Đăng nhập" : "Đăng ký"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
          />
          {!isLogin && (
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="student">Học viên</option>
              <option value="teacher">Giảng viên</option>
              <option value="admin">Quản trị</option>
            </select>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
        <div className="switch-link">
          {isLogin ? (
            <>
              Chưa có tài khoản?{" "}
              <span onClick={() => setIsLogin(false)}>Đăng ký</span>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <span onClick={() => setIsLogin(true)}>Đăng nhập</span>
            </>
          )}
        </div>
        {msg && <div className="auth-msg">{msg}</div>}
      </div>
      <div className="auth-bg"></div>
    </div>
  );
} 