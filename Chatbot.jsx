import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Chatbot.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [buttons, setButtons] = useState([]);

  useEffect(() => {
    sendToBackend("start");
  }, []);

  async function sendToBackend(msg) {
    try {
      const res = await axios.post("/chatapi/chat", { message: msg });
      if (res.data.response) {
        setMessages(prev => [...prev, { from: "bot", text: res.data.response }]);
      }
      setButtons(res.data.buttons || []);
    } catch (err) {
      setMessages(prev => [...prev, { from: "bot", text: "⚠️ Server not reachable." }]);
    }
  }

  function handleButtonClick(value, label) {
    setMessages(prev => [...prev, { from: "user", text: label }]);
    sendToBackend(value);
  }

  return (
    <div className="chatbot-container">
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.from}`}>{m.text}</div>
        ))}
      </div>
      <div className="button-area">
        {buttons.map((b, i) => (
          <button key={i} className="chat-btn" onClick={() => handleButtonClick(b.value, b.label)}>{b.label}</button>
        ))}
      </div>
    </div>
  );
}
