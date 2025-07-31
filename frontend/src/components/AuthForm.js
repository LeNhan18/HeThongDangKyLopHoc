import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/AuthForm.css";
import { useNavigate } from "react-router-dom";

export default function AuthForm({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "student" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!isLogin) {
      axios.get("http://localhost:8000/roles/").then(res => setRoles(res.data));
    }
  }, [isLogin]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setFieldErrors({});
    try {
      if (isLogin) {
        // Đăng nhập
        const params = new URLSearchParams();
        params.append("email", form.email);
        params.append("password", form.password);
        const res = await axios.post("http://localhost:8000/auth/login", params);
        setMsg("Đăng nhập thành công!");
        onAuthSuccess && onAuthSuccess(res.data);
        navigate("/");
      } else {
        // Đăng ký
        await axios.post("http://localhost:8000/users/register", {
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
        });
        setMsg("Đăng ký thành công! Vui lòng đăng nhập.");
        setIsLogin(true);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Lỗi validate dạng mảng object
        const errors = {};
        detail.forEach(e => {
          if (e.loc && e.loc.length > 0) {
            const field = e.loc[e.loc.length - 1];
            let msg = e.msg === 'field required' || e.msg === 'Field required' ? 'Trường này là bắt buộc' : e.msg;
            errors[field] = msg;
          }
        });
        setFieldErrors(errors);
        setMsg("");
      } else {
        setMsg(detail || (isLogin ? "Đăng nhập thất bại!" : "Đăng ký thất bại!"));
      }
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
          {fieldErrors.email && <div className="auth-msg" style={{marginTop:4}}>{fieldErrors.email}</div>}
          {!isLogin && (
            <>
              <input
                type="text"
                name="name"
                placeholder="Họ và tên"
                value={form.name}
                onChange={handleChange}
                required
              />
              {fieldErrors.name && <div className="auth-msg" style={{marginTop:4}}>{fieldErrors.name}</div>}
            </>
          )}
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={handleChange}
            required
          />
          {fieldErrors.password && <div className="auth-msg" style={{marginTop:4}}>{fieldErrors.password}</div>}
          {!isLogin && (
            <>
              <select name="role" value={form.role} onChange={handleChange} required>
                <option value="">-- Chọn vai trò --</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
              {fieldErrors.role && <div className="auth-msg" style={{marginTop:4}}>{fieldErrors.role}</div>}
            </>
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
        {msg && (
          Array.isArray(msg) ? (
            <div className="auth-msg">
              {msg.map((m, idx) => (
                <div key={idx}>{typeof m === 'object' && m.msg ? m.msg : JSON.stringify(m)}</div>
              ))}
            </div>
          ) : typeof msg === 'object' ? (
            <div className="auth-msg">{msg.msg || JSON.stringify(msg)}</div>
          ) : (
            <div className="auth-msg">{msg}</div>
          )
        )}
      </div>
      <div className="auth-bg"></div>
    </div>
  );
} 