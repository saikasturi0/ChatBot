import React, { useEffect, useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../config/api";

import { FaArrowLeft } from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";


const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const existing = document.querySelector(
      'script[src="https://unpkg.com/@splinetool/viewer@1.10.16/build/spline-viewer.js"]'
    );
    if (!existing) {
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://unpkg.com/@splinetool/viewer@1.10.16/build/spline-viewer.js";
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, []);

  // It Handles user login by sending a POST request to the server with the login credentials and managing the response accordingly
  const handleLogin = async () => {
    if(!email || !password){
      toast.error("Please fill all the fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const data = await response.json();

      if (data.success) {
        navigate("/chatBot");
      } else {
        toast.error(data.message || "Login failed");
      }

    } catch (error) {
      console.error("Error logging in user:", error);
      toast.error("Error logging in user");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">

          <button className="back-btn" onClick={() => navigate("/")}>
            <FaArrowLeft />
            Back to Home
          </button>

          <h1>Welcome <span>back</span></h1>
          <p className="subtitle">Login to continue your creative journey.</p>

          {/* Google */}
          <button className="social-btn">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <hr />
            <span>or continue with email</span>
            <hr />
          </div>

          {/* Email */}
          <div className="field">
            <label>Email address</label>
            <div className="input-box">
              <HiOutlineMail />
              <input type="email" placeholder="Enter your email" value = {email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label>Password</label>
            <div className="input-box">
              <HiOutlineLockClosed />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value = {password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="eye-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
              </button>
            </div>
          </div>

          <div className="options">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>
            <button className="forgot">Forgot password?</button>
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>

          <p className="signup-text">
            Don't have an account?
            <Link to="/register"> Sign up</Link>
          </p>
        </div>

        {/* ── RIGHT PANEL — Spline 3D Robot ── */}

        <div className="login-right">
          <spline-viewer
            class="login-spline"
            url="https://prod.spline.design/NyzabPdtRyuHRFPp/scene.splinecode"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
