import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Header, Hero, Stats, CourseList, Footer } from "./components";
import AuthPage from "./pages/AuthPage";
import "./App.css";

function HomePage({ user, onRequireAuth }) {
  return (
    <>
      <Header />
      <Hero />
      <Stats />
      <CourseList user={user} onRequireAuth={onRequireAuth} />
      <Footer />
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              user={user}
              onRequireAuth={() => window.location.href = "/auth"}
            />
          }
        />
        <Route
          path="/auth"
          element={
            <AuthPage
              onAuthSuccess={userData => {
                setUser(userData);
                window.location.href = "/";
              }}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
