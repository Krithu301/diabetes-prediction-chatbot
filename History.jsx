import React, { useEffect, useState } from "react";
import axios from "axios";
import "./History.css";

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch history
  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:4000/api/history", {
        headers: { Authorization: "Bearer " + token },
      });
      setRows(res.data);
    } catch (err) {
      console.error("History fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="history-page">
      <div className="history-card">
        <div className="header-row">
          <h2 className="title">📜 Prediction History</h2>
        </div>

        {loading ? (
          <p className="loading">Loading your past predictions...</p>
        ) : rows.length === 0 ? (
          <p className="empty">No prediction records found yet.</p>
        ) : (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Input Details</th>
                  <th>Prediction Result</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  let input = {};
                  let output = {};
                  try {
                    // Handle both string and object from API
                    input = typeof r.input === "string" ? JSON.parse(r.input) : r.input;
                    output = typeof r.output === "string" ? JSON.parse(r.output) : r.output;
                  } catch (e) {
                    console.error("Parsing error:", e);
                  }

                  // ✅ Determine risk based on probability
                  const riskLabel = output.prob >= 0.5 ? "High Risk" : "Low Risk";

                  return (
                    <tr
                      key={r.id}
                      className={riskLabel === "High Risk" ? "high-row" : "low-row"}
                    >
                      <td>{r.id}</td>
                      <td>
                        <ul className="input-list">
                          {Object.entries(input).map(([k, v]) => (
                            <li key={k}>
                              <strong>
                                {k === "dpf"
                                  ? "Diabetes Pedigree"
                                  : k === "bmi"
                                  ? "BMI"
                                  : k === "skinthickness"
                                  ? "Skin Thickness"
                                  : k === "bloodpressure"
                                  ? "Blood Pressure"
                                  : k.charAt(0).toUpperCase() + k.slice(1)}
                                :
                              </strong>{" "}
                              {v}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <div className="output">
                          <p>
                            <strong>
                              {riskLabel === "High Risk" ? "🚨 High Risk" : "🌿 Low Risk"}
                            </strong>
                          </p>
                          <p>Probability: {(output.prob * 100).toFixed(2)}%</p>
                        </div>
                      </td>
                      <td>
                        {new Date(r.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
