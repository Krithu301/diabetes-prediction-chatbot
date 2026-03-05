import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import InputPage from "./dashboard/InputPage";
import PredictPage from "./dashboard/PredictPage";
import Reports from "./dashboard/Reports";
import History from "./dashboard/History";

export default function Dashboard() {
  const [active, setActive] = useState("home");
  const nav = useNavigate();
  const [user, setUser] = useState({ name: "there" });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.name) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error("Error reading user:", err);
    }
  }, []);

  const menu = [
    ["home", "Dashboard"],
    ["input", "Input"],
    ["predict", "Prediction"],
    ["history", "History"],
    ["reports", "Reports"],
  ];

  const quote =
    "Good health is not just the absence of disease — it’s daily positive choices.";

  return (
    <div>
      {/* Top Navbar */}
      <div className="app-nav">
        <div className="brand">Smart Diabetes Health Predictor</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>
              Hi{user ? ", " + user.name.split(" ")[0] : ""} 👋
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{quote}</div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              nav("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="layout">
        <div className="sidebar card">
          {menu.map((m) => (
            <div
              key={m[0]}
              className={"item " + (active === m[0] ? "active" : "")}
              onClick={() => {
                setActive(m[0]);
                nav("/dashboard/" + m[0]);
              }}
            >
              {m[1]}
            </div>
          ))}
        </div>

        {/* Main Page Content */}
        <div className="content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="card" style={{ textAlign: "center" }}>
                  <h1>Welcome to Smart Diabetes Health Predictor</h1>
                  <p className="muted">
                    You are logged in as{" "}
                    <strong>{user?.name || "User"}</strong>.
                  </p>
                  <p style={{ color: "#b91c1c", fontStyle: "italic" }}>
                    “Stay consistent, not perfect — your health is your wealth!”
                  </p>
                </div>
              }
            />
            <Route path="input" element={<InputPage />} />
            <Route path="predict" element={<PredictPage />} />
            <Route path="history" element={<History />} />
            <Route path="reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
