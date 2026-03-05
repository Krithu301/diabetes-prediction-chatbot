import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PredictPage.css";

export default function PredictPage() {
  const [input, setInput] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedInput = localStorage.getItem("latestInput");
    setInput(savedInput ? JSON.parse(savedInput) : null);

    // Clear old result on entry
    localStorage.removeItem("lastResult");
    setResult(null);

    return () => {
      localStorage.removeItem("lastResult");
      setResult(null);
    };
  }, []);

  // ✅ BMI Category function
  function getBMICategory(bmi) {
    const val = parseFloat(bmi);
    if (isNaN(val)) return { label: "N/A", color: "gray" };
    if (val < 18.5) return { label: "Underweight", color: "#f4b400" };
    if (val < 24.9) return { label: "Normal", color: "#0f9d58" };
    if (val < 29.9) return { label: "Overweight", color: "#fbbc05" };
    return { label: "Obese", color: "#db4437" };
  }

  // 🧠 100 personalized recommendations
  function getRecommendation(prob) {
    const p = Math.round(prob * 100);
    const recs = {
      1: "💚 Excellent! Stay active and enjoy a balanced life.",
      2: "🥦 Fantastic! Keep up your good eating habits.",
      3: "🏃‍♀️ Great! Continue your morning walk routine.",
      4: "🍎 Low risk! Eat fruits daily and avoid excess sugar.",
      5: "☀️ Nice! A little sunshine boosts your vitamin D.",
      6: "🧘‍♂️ Calm mind, healthy body. Keep stress low.",
      7: "💧 Hydrate well! Water keeps your metabolism happy.",
      8: "🍚 Maintain portion control to stay fit.",
      9: "🥗 Awesome! Greens and fiber keep your sugar stable.",
      10: "🚶‍♀️ Keep moving — light activity helps every day.",
      11: "🍊 Add vitamin-rich foods like oranges or guava.",
      12: "🌿 Stay natural — avoid processed snacks.",
      13: "💤 Good sleep = balanced hormones. Rest well!",
      14: "🩺 Routine checkups help catch issues early.",
      15: "🍓 Fresh fruits over sugary drinks — every time!",
      16: "🥬 Try including spinach or kale weekly.",
      17: "🧡 Keep your heart healthy with light exercise.",
      18: "🥛 Switch to low-fat dairy for better health.",
      19: "💪 Continue strength training twice a week.",
      20: "⚖️ Keep your BMI within a healthy range.",
      21: "🍞 Choose whole grains over refined ones.",
      22: "💚 You’re doing great! Keep it consistent.",
      23: "🥗 Don’t skip breakfast — eat smart in the morning.",
      24: "🍅 Tomatoes and cucumber are great for sugar balance.",
      25: "🍵 Try green tea instead of sugary drinks.",
      26: "🥜 Add nuts — almonds and walnuts are great.",
      27: "🍋 Lemon water in the morning refreshes metabolism.",
      28: "🫀 Keep your heart rate steady with deep breathing.",
      29: "🌸 Small daily walks can do wonders!",
      30: "⚠️ Slight risk. Monitor sugar and stay active.",
      31: "🥗 Stay mindful of portion sizes and late-night snacks.",
      32: "🍞 Limit bread and rice portions to stay in range.",
      33: "🩹 Avoid excess fried food — switch to baked or steamed.",
      34: "🍌 Fruits yes, but keep banana portions small.",
      35: "⚖️ Maintain your weight — check monthly.",
      36: "🧃 Avoid packaged juices — they spike sugar fast.",
      37: "🍪 Watch desserts! Replace with fruit snacks.",
      38: "🥤 Sugary sodas? Better to skip them entirely.",
      39: "🥗 Eat home-cooked food whenever possible.",
      40: "🚶‍♂️ After meals, walk for 10 minutes.",
      41: "⚠️ Mild risk — include more fiber daily.",
      42: "🥦 Add more veggies like broccoli to your diet.",
      43: "🍵 Herbal teas can help with sugar control.",
      44: "🏋️‍♀️ Add light workouts thrice a week.",
      45: "🥥 Stay away from too much coconut-based oil.",
      46: "💊 Check your sugar once every 3 months.",
      47: "🧂 Reduce salt and processed food intake.",
      48: "🍽️ Smaller, more frequent meals are best.",
      49: "🚴‍♀️ Try cycling for fun and fitness!",
      50: "⚠️ Moderate risk. Review your daily sugar habits.",
      51: "🥗 Increase fiber intake through vegetables.",
      52: "🍵 Drink warm water after meals.",
      53: "🍊 Add citrus fruits to your lunch plate.",
      54: "💤 Sleep 7–8 hours every night consistently.",
      55: "🩺 Check your fasting sugar if you feel tired often.",
      56: "🥙 Avoid skipping meals — it confuses your sugar level.",
      57: "💧 Stay hydrated, even in cool weather.",
      58: "🍓 Natural fruits > canned juices always.",
      59: "🧘‍♀️ Yoga can stabilize both stress and sugar.",
      60: "⚠️ Risk increasing — consult your doctor soon.",
      61: "🍛 Reduce white rice, choose millets or brown rice.",
      62: "🥖 Prefer chapati over bread when possible.",
      63: "🥒 Add cucumber and carrots as snack options.",
      64: "🚶‍♀️ Walk at least 30 mins every day.",
      65: "🥗 High fiber diet reduces insulin resistance.",
      66: "🥜 Add a handful of nuts daily for energy.",
      67: "🍋 Lemon juice before meals helps control sugar spikes.",
      68: "🥦 Include more plant-based protein in meals.",
      69: "🍎 Apple a day keeps sugar in check too!",
      70: "🚨 Elevated risk. Reduce sweets and oily snacks.",
      71: "🩹 Keep an eye on sudden tiredness or thirst.",
      72: "💉 Time to get your blood glucose checked.",
      73: "🍽️ Avoid overeating at dinner.",
      74: "🥗 More salads, fewer carbs for dinner.",
      75: "🚨 High risk! Follow a diabetic-friendly diet plan.",
      76: "🍚 Avoid white rice, sugary cereals, and refined flour.",
      77: "🥛 Switch to sugar-free milk alternatives.",
      78: "🍵 Try cinnamon tea to regulate sugar.",
      79: "🩺 Schedule a doctor visit this month.",
      80: "🚨 High risk! Cut down sugar immediately.",
      81: "🥗 Eat smaller portions throughout the day.",
      82: "🥦 Focus on high-fiber vegetables.",
      83: "💧 Drink more water to flush out toxins.",
      84: "🍵 Herbal tea daily can aid sugar balance.",
      85: "🚨 Track sugar regularly and stay consistent.",
      86: "🩺 Doctor consultation strongly advised.",
      87: "⚖️ Manage weight through steady exercise.",
      88: "🚴‍♀️ Add cardio to improve metabolism.",
      89: "🥗 Avoid fried foods completely now.",
      90: "🔴 Very high risk! Urgent lifestyle review needed.",
      91: "💊 Medication might be necessary — consult your doctor.",
      92: "🍎 Strict diet control recommended now.",
      93: "🩹 Avoid stress — it raises blood sugar levels too.",
      94: "🥦 Focus on protein and greens daily.",
      95: "⚠️ Monitor sugar weekly and track progress.",
      96: "🚨 Follow medical advice and maintain records.",
      97: "🧘‍♀️ Meditation and yoga can help control spikes.",
      98: "🩸 Get complete blood work done immediately.",
      99: "⚠️ You are at the edge — seek medical support now.",
      100: "🆘 Critical! Immediate hospital consultation required.",
    };

    return recs[p] || "💬 Keep a healthy routine and check with your doctor if unsure.";
  }

  async function handlePredict() {
    const token = localStorage.getItem("token");
    if (!input) {
      alert("⚠️ Please enter and save your health details first.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:4000/api/predict",
        { features: input },
        { headers: { Authorization: "Bearer " + token } }
      );

      const prediction = response.data.prediction || {};
      prediction.prob = Number(prediction.prob || 0);
      prediction.label = prediction.prob >= 0.5 ? "High Risk" : "Low Risk";
      prediction.recommendation = getRecommendation(prediction.prob);

      setResult(prediction);
      localStorage.setItem("lastResult", JSON.stringify(prediction));
      localStorage.setItem("visualizeNeedsUpdate", "true");
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Prediction failed: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="predict-page">
      <div className="predict-card">
        <h2 className="title">🩺 Diabetes Risk Prediction</h2>

        {input && (
          <div className="input-boxes">
            {Object.entries(input).map(([key, value]) => (
              <div key={key} className="input-item">
                <p className="label">
                  {key === "dpf"
                    ? "Diabetes Pedigree"
                    : key === "bmi"
                    ? "BMI"
                    : key === "skinthickness"
                    ? "Skin Thickness"
                    : key === "bloodpressure"
                    ? "Blood Pressure"
                    : key.charAt(0).toUpperCase() + key.slice(1)}
                </p>
                <p className="value">{value}</p>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handlePredict}
          disabled={loading}
          className={`predict-btn ${loading ? "disabled" : ""}`}
        >
          {loading ? "Predicting..." : "🔍 Predict Risk"}
        </button>

        {result && (
          <>
            <div
              className={`result-card ${
                result.label === "High Risk" ? "high-risk" : "low-risk"
              }`}
            >
              <h3 className="result-title">
                {result.label === "High Risk" ? "🚨 High Risk" : "🌿 Low Risk"}
              </h3>
              <p className="prob">
                Probability: <strong>{(result.prob * 100).toFixed(2)}%</strong>
              </p>
              <p className="recommendation">{result.recommendation}</p>
            </div>

            {/* ✅ BMI Category Display */}
            {input?.bmi && (
              <div className="bmi-category-box">
                <h4>Your BMI Category:</h4>
                {(() => {
                  const { label, color } = getBMICategory(input.bmi);
                  return (
                    <p style={{ color, fontWeight: "600", fontSize: "1.1rem" }}>
                      {label} ({input.bmi})
                    </p>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {!input && (
          <p className="no-input">Please fill in your health details first.</p>
        )}
      </div>
    </div>
  );
}
