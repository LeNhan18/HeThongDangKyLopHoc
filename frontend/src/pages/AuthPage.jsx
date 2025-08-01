import React from "react";
import AuthForm from "../components/AuthForm";

export default function AuthPage({ onAuthSuccess }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <AuthForm onAuthSuccess={onAuthSuccess} />
    </div>
  );
} 