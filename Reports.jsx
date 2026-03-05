import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Reports() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios.get("/api/history", { headers: { Authorization: "Bearer " + token } })
      .then((r) => setRows(r.data || []))
      .catch(() => setRows([]));
  }, []);

  async function download(id) {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/report/" + id, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) throw new Error("Failed to download report");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Download failed: " + e.message);
    }
  }

  return (
    <div className="card">
      <h2>Reports</h2>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            ID {r.id} - <button onClick={() => download(r.id)}>Download</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
