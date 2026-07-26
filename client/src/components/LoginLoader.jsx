import React, { useEffect, useState } from "react";
import "./LoginLoader.css";
import { useNavigate } from "react-router-dom";

const messages = [
  "Setting up your chat space...",
  "Loading your conversations...",
  "Almost there...",
];

const LoginLoader = ({ redirectTo = "/chatBot", duration = 3000 }) => {
  const navigate = useNavigate();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1 < messages.length ? prev + 1 : prev));
    }, duration / messages.length);

    const redirectTimer = setTimeout(() => {
      navigate(redirectTo);
    }, duration);

    return () => {
      clearInterval(msgTimer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, redirectTo, duration]);

  return (
    <div className="transition-page">
      <div className="transition-glow-top"></div>
      <div className="transition-glow-bottom"></div>

      <div className="transition-content">

        <div className="bot-progress-wrap">
          <svg width="96" height="96" viewBox="0 0 96 96" className="progress-svg">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(180,76,255,0.1)" strokeWidth="3" />
            <circle
              className="progress-circle"
              cx="48" cy="48" r="42"
              fill="none"
              stroke="#b44cff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="264" 
              strokeDashoffset="264"
              style={{ animationDuration: `${duration}ms` }}
            />
          </svg>

          <div className="bot-avatar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d6b3ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="8" width="16" height="11" rx="3" />
              <circle className="eye" cx="9" cy="13.5" r="1.3" fill="#d6b3ff" />
              <circle className="eye" cx="15" cy="13.5" r="1.3" fill="#d6b3ff" />
              <path d="M12 8V5" />
              <circle cx="12" cy="3.5" r="1.2" fill="#b44cff" stroke="none" />
              <path d="M2 12h2M20 12h2" />
            </svg>
          </div>
        </div>

        <div className="transition-text">
          <p className="welcome-line">
            Welcome <span>back</span>
          </p>
          <p className="status-line">{messages[msgIndex]}</p>
        </div>

        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ animationDuration: `${duration}ms` }}
          ></div>
        </div>

      </div>
    </div>
  );
};

export default LoginLoader;
