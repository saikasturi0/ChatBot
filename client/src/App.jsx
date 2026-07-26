import React from "react";
import Home from "./components/Home";
import SlideBar from "./components/SlideBar";
import Main from "./components/Main";
import LoginLoader from "./components/LoginLoader";
import Login from "./components/Login"
import Register from "./components/Registration";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ProfilePage from "./components/ProfilePage";
import { API_BASE_URL } from "./config/api";


const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/isAuthenticated`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const data = await res.json();

        setTimeout(() => {
          setIsAuthenticated(data.success);
          setShowLoader(false);
        }, 3000);

      } catch {
        setTimeout(() => {
          setIsAuthenticated(false);
          setShowLoader(false);
        }, 3000);
      }
    };

    checkAuth();
  }, []);

  if (showLoader) {
    return <LoginLoader duration={3000} />;
  }

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
}

const App = () => {
  return (
    <>
    <ToastContainer
      position="top-center"
      autoClose={2500}
      theme="dark"
    >
    </ToastContainer>
    <HashRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/chatBot"
          element={
            <ProtectedRoute>
              <>
                <SlideBar />
                <Main />
              </>
            </ProtectedRoute>
          }
          />

        <Route
        path = "/loader"
        element = {
          <>
            <LoginLoader></LoginLoader>
          </>
        }
        ></Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </HashRouter>
    </>
  );
};

export default App;
