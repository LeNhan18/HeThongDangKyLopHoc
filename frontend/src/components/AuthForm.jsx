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
      axios.get("http://localhost:8000/api/user/roles/").then(res => setRoles(res.data));
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
        const res = await axios.post("http://localhost:8000/auth/login", params, { withCredentials: true });
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
      {/* Debug info */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px', borderRadius: '5px', zIndex: 1000, fontSize: '12px' }}>
        Mode: {isLogin ? 'Login' : 'Signup'}
      </div>

      {/* Background particles */}
      <div className="particles">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      {/* Main container */}
      <div className="auth-wrapper">
        {/* Forms container */}
        <div className="forms-container">
          <div className="signin-signup">
            {/* Sign In Form */}
            <form className="sign-in-form" onSubmit={handleSubmit}>
              <h2 className="title">Đăng nhập</h2>

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {fieldErrors.email && <div className="error-msg">{fieldErrors.email}</div>}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {fieldErrors.password && <div className="error-msg">{fieldErrors.password}</div>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            {/* Sign Up Form */}
            <form className="sign-up-form" onSubmit={handleSubmit}>
              <h2 className="title">Đăng ký</h2>

              <div className="input-field">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              {fieldErrors.name && <div className="error-msg">{fieldErrors.name}</div>}

              <div className="input-field">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {fieldErrors.email && <div className="error-msg">{fieldErrors.email}</div>}

              <div className="input-field">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              {fieldErrors.password && <div className="error-msg">{fieldErrors.password}</div>}

              <div className="input-field">
                <i className="fas fa-user-tag"></i>
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              {fieldErrors.role && <div className="error-msg">{fieldErrors.role}</div>}

              <button type="submit" className="btn" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </button>
            </form>
          </div>
        </div>

        {/* Panels container */}
        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>Chưa có tài khoản?</h3>
              <p>Tạo tài khoản mới để bắt đầu hành trình học tập cùng chúng tôi</p>
              <button className="btn transparent" type="button" onClick={() => {
                console.log("Clicking to signup mode");
                setIsLogin(false);
              }}>
                Đăng ký
              </button>
            </div>
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cpath fill='%23f59e0b' d='M100 200c0-33.1 26.9-60 60-60s60 26.9 60 60-26.9 60-60 60-60-26.9-60-60z'/%3E%3Cpath fill='%23fbbf24' d='M220 120c0-22.1 17.9-40 40-40s40 17.9 40 40-17.9 40-40 40-40-17.9-40-40z'/%3E%3C/svg%3E" className="image" alt="Signup illustration" />
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>Đã có tài khoản?</h3>
              <p>Đăng nhập để truy cập vào hệ thống quản lý lớp học của bạn</p>
              <button className="btn transparent" type="button" onClick={() => {
                console.log("Clicking to login mode");
                setIsLogin(true);
              }}>
                Đăng nhập
              </button>
            </div>
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cpath fill='%234f46e5' d='M50 150c0-55.2 44.8-100 100-100s100 44.8 100 100-44.8 100-100 100-100-44.8-100-100z'/%3E%3Cpath fill='%23818cf8' d='M250 100c0-27.6 22.4-50 50-50s50 22.4 50 50-22.4 50-50 50-50-22.4-50-50z'/%3E%3C/svg%3E" className="image" alt="Login illustration" />
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {msg && (
        <div className="message-overlay" onClick={() => setMsg("")}>
          <div className="message-box" onClick={(e) => e.stopPropagation()}>
            {Array.isArray(msg) ? (
              msg.map((m, idx) => (
                <div key={idx}>{typeof m === 'object' && m.msg ? m.msg : JSON.stringify(m)}</div>
              ))
            ) : typeof msg === 'object' ? (
              <div>{msg.msg || JSON.stringify(msg)}</div>
            ) : (
              <div>{msg}</div>
            )}
            <button
              onClick={() => setMsg("")}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 