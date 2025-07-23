import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header, Hero, Stats, CourseList, Footer } from "./components";
import AuthPage from "./pages/AuthPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseAdminPage from "./pages/CourseAdminPage";
import "./App.css";

function HomePage({ user, onRequireAuth, onLogout }) {
  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <Hero />
      <Stats />
      <CourseList user={user} onRequireAuth={onRequireAuth} />
      <Footer />
    </>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    if (window.location) window.location.href = "/";
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              onRequireAuth={() => window.location.href = "/auth"}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/auth"
          element={
            <AuthPage
              onAuthSuccess={userData => {
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
              }}
            />
          }
        />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/admin/courses" element={<CourseAdminPage user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
