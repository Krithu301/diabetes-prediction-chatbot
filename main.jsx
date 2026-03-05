import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SmartChatbot from "./pages/SmartChatbot"; // our floating chatbot
import "./styles.css";

function App() {
  const isAuth = () => !!localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/*"
          element={isAuth() ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* 👇 Floating SmartChatbot visible on all pages */}
      <SmartChatbot />
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(<App />);
