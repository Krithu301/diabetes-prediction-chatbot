import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InputPage.css";

export default function InputPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    pregnancies: "",
    glucose: "",
    bloodpressure: "",
    skinthickness: "",
    insulin: "",
    bmi: "",
    dpf: "",
    age: "",
  });

  // ✅ New states for height and weight
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  // ✅ Automatically calculate BMI when height or weight changes
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) * (h / 100)); // formula kg/m^2
      const rounded = bmi.toFixed(1);
      setForm((prev) => ({ ...prev, bmi: rounded }));
    }
  }, [height, weight]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function go() {
    if (Object.values(form).some((v) => v === "")) {
      alert("⚠️ Please fill out all fields before predicting.");
      return;
    }
    localStorage.setItem("latestInput", JSON.stringify(form));
    nav("/dashboard/predict");
  }

  const inputs = [
    { name: "pregnancies", label: "Number of Pregnancies 👶" },
    { name: "glucose", label: "Glucose Level (mg/dL) 🍬" },
    { name: "bloodpressure", label: "Blood Pressure (mm Hg) 💓" },
    { name: "skinthickness", label: "Skin Thickness (mm) 💉" },
    { name: "insulin", label: "Insulin Level (μU/mL) 💧" },
    // ✅ BMI now auto-calculated below
    { name: "bmi", label: "Body Mass Index (BMI) ⚖️" },
    { name: "dpf", label: "Diabetes Pedigree Function 🧬" },
    { name: "age", label: "Age (Years) 🎂" },
  ];

  return (
    <div className="input-page">
      <div className="input-card">
        <h2 className="title">🩸 Health Test Input Form</h2>
        <p className="subtitle">
          Enter your medical test details to predict your diabetes risk.
        </p>

        {/* ✅ Height & Weight added before normal fields */}
        <div className="extra-inputs">
          <div className="form-item">
            <label className="form-label">Height (cm) 📏</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter height"
              className="form-input"
            />
          </div>

          <div className="form-item">
            <label className="form-label">Weight (kg) ⚖️</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter weight"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-grid">
          {inputs.map((item) => (
            <div key={item.name} className="form-item">
              <label htmlFor={item.name} className="form-label">
                {item.label}
              </label>
              <input
                id={item.name}
                name={item.name}
                type="number"
                value={form[item.name]}
                onChange={onChange}
                placeholder="Enter value"
                className="form-input"
                readOnly={item.name === "bmi"} // ✅ BMI cannot be manually edited
              />
            </div>
          ))}
        </div>

        <button onClick={go} className="save-btn">
          💾 Save & Predict Risk
        </button>
      </div>
    </div>
  );
}
