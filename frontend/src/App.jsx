import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header, Hero, Stats, CourseList, Footer } from "./components";
import ClassList from "./components/ClassList";
import AuthPage from "./pages/AuthPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CourseAdminPage from "./pages/CourseAdminPage";
import AdminPage from "./pages/AdminPage";
import CourseManagementPage from "./pages/CourseManagementPage";
import AdminLessons from "./pages/AdminLessons";
import CourseClassDetail from "./components/CourseClassDetail";
import ClassRoom from "./pages/ClassRoom";
import "./App.css";

function HomePage({ user, onRequireAuth, onLogout }) {
  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <Hero />
      <Stats />
      <CourseList user={user} onRequireAuth={onRequireAuth} />
      <ClassList user={user} onRequireAuth={onRequireAuth} />
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
        <Route path="/admin/users" element={<AdminPage user={user} />} />
        <Route path="/admin/course-management" element={<CourseManagementPage user={user} />} />
        <Route path="/admin/lessons" element={<AdminLessons user={user} />} />
        <Route path="/detail/course/:courseId" element={<CourseClassDetail courseId={window.location.pathname.split('/')[3]} />} />
        <Route path="/detail/class/:classId" element={<CourseClassDetail classId={window.location.pathname.split('/')[3]} />} />
        <Route path="/class/:classId/room" element={<ClassRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
