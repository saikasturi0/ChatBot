import React, { useEffect, useState } from "react";
import "./ProfilePage.css";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserCircle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineFlag,
  HiOutlineSave,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { API_BASE_URL } from "../config/api";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [username, setUsername] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [setPwdMsg, setSetPwdMsg] = useState(null);
  const [savingSetPwd, setSavingSetPwd] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showChangeNewPwd, setShowChangeNewPwd] = useState(false);
  const [showConfirmNewPwd, setShowConfirmNewPwd] = useState(false);
  const [changePwdMsg, setChangePwdMsg] = useState(null);
  const [savingChangePwd, setSavingChangePwd] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          credentials: "include",
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          navigate("/login", { replace: true });
          return;
        }

        setUser(data.user);
        setUsername(data.user.name || "");
        setCareerGoal(data.user.careerGoal || "");
      } catch {
        navigate("/login", { replace: true });
      } finally {
        setLoadingUser(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const initials = (user?.name || "User")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const response = await fetch(`${API_BASE_URL}/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: username,
          career_goal: careerGoal,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      setUser((prev) => ({
        ...prev,
        name: data.user.name,
        careerGoal: data.user.career_goal,
      }));
      setProfileMsg({ type: "success", text: data.message });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile. Try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setSetPwdMsg(null);

    if (newPassword.length < 8) {
      setSetPwdMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPwdMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSavingSetPwd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to set password");
      }

      setSetPwdMsg({ type: "success", text: data.message });
      setUser((prev) => ({ ...prev, googleAuth: "Normal" }));
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSetPwdMsg({ type: "error", text: err.message || "Failed to set password. Try again." });
    } finally {
      setSavingSetPwd(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePwdMsg(null);

    if (!currentPassword) {
      setChangePwdMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (newPwd.length < 8) {
      setChangePwdMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (newPwd !== confirmNewPwd) {
      setChangePwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSavingChangePwd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPwd,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }

      setChangePwdMsg({ type: "success", text: data.message });
      setCurrentPassword("");
      setNewPwd("");
      setConfirmNewPwd("");
    } catch (err) {
      setChangePwdMsg({ type: "error", text: err.message || "Failed to change password. Try again." });
    } finally {
      setSavingChangePwd(false);
    }
  };

  if (loadingUser) {
    return <div className="profile-page" />;
  }

  const isGoogle = user?.googleAuth === "Google";

  return (
    <div className="profile-page">
      <div className="topbar">
        <button className="back-btn" onClick={() => navigate("/chatBot")}>
          <FaArrowLeft />
          Back to Chat
        </button>
        <h2>
          Account <span>Settings</span>
        </h2>
      </div>

      <div className="body-area">
        <div className="sidebar">
          <div className="sidebar-profile">
            <div className="avatar">{initials}</div>
            <div className="sidebar-profile-info">
              <p>{user?.name || "User"}</p>
              <p>{user?.email}</p>
            </div>
          </div>

          <button
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUserCircle />
            My Profile
          </button>

          <button
            className={`nav-item ${activeTab === "password" ? "active" : ""}`}
            onClick={() => setActiveTab("password")}
          >
            <HiOutlineLockClosed />
            {isGoogle ? "Set Password" : "Change Password"}
          </button>
        </div>

        <div className="content">
          <div className="content-inner">
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile}>
                <div className="content-title">
                  <FaUserCircle />
                  My Profile
                </div>
                <div className="content-desc">View and update your personal information</div>

                {profileMsg && (
                  <div className={`msg ${profileMsg.type}`}>
                    {profileMsg.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {profileMsg.text}
                  </div>
                )}

                <div className="field">
                  <label>Username</label>
                  <div className="input-box">
                    <FaUserCircle />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Email address</label>
                  <div className="input-box readonly">
                    <HiOutlineMail />
                    <input type="email" value={user?.email || ""} disabled />
                  </div>
                </div>

                <div className="field">
                  <label>Career goal</label>
                  <div className="input-box">
                    <HiOutlineFlag />
                    <input
                      type="text"
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      placeholder="What's your career goal?"
                    />
                  </div>
                </div>

                <button className="save-btn" type="submit" disabled={savingProfile}>
                  <HiOutlineSave />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}

            {activeTab === "password" &&
              (isGoogle ? (
                <form onSubmit={handleSetPassword}>
                  <div className="content-title">
                    <HiOutlineLockClosed />
                    Set Password
                  </div>
                  <div className="content-desc">
                    You signed up with Google. Set a password to also enable email and password login.
                  </div>

                  {setPwdMsg && (
                    <div className={`msg ${setPwdMsg.type}`}>
                      {setPwdMsg.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                      {setPwdMsg.text}
                    </div>
                  )}

                  <div className="row-2">
                    <div className="field">
                      <label>New password</label>
                      <div className="input-box">
                        <HiOutlineLockClosed />
                        <input
                          type={showNewPwd ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          className="eye-btn"
                          type="button"
                          onClick={() => setShowNewPwd(!showNewPwd)}
                          aria-label="Toggle password visibility"
                        >
                          {showNewPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                        </button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Confirm password</label>
                      <div className="input-box">
                        <HiOutlineLockClosed />
                        <input
                          type={showConfirmPwd ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <button
                          className="eye-btn"
                          type="button"
                          onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hint">
                    <HiOutlineInformationCircle />
                    Must be at least 8 characters
                  </div>

                  <button className="save-btn" type="submit" disabled={savingSetPwd}>
                    <HiOutlineLockClosed />
                    {savingSetPwd ? "Setting..." : "Set Password"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <div className="content-title">
                    <HiOutlineLockClosed />
                    Change Password
                  </div>
                  <div className="content-desc">Update your account password regularly to keep it secure.</div>

                  {changePwdMsg && (
                    <div className={`msg ${changePwdMsg.type}`}>
                      {changePwdMsg.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                      {changePwdMsg.text}
                    </div>
                  )}

                  <div className="field">
                    <label>Current password</label>
                    <div className="input-box">
                      <HiOutlineLockClosed />
                      <input
                        type={showCurrentPwd ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        className="eye-btn"
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        aria-label="Toggle password visibility"
                      >
                        {showCurrentPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                      </button>
                    </div>
                  </div>

                  <div className="row-2">
                    <div className="field">
                      <label>New password</label>
                      <div className="input-box">
                        <HiOutlineLockClosed />
                        <input
                          type={showChangeNewPwd ? "text" : "password"}
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          className="eye-btn"
                          type="button"
                          onClick={() => setShowChangeNewPwd(!showChangeNewPwd)}
                          aria-label="Toggle password visibility"
                        >
                          {showChangeNewPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                        </button>
                      </div>
                    </div>

                    <div className="field">
                      <label>Confirm new password</label>
                      <div className="input-box">
                        <HiOutlineLockClosed />
                        <input
                          type={showConfirmNewPwd ? "text" : "password"}
                          value={confirmNewPwd}
                          onChange={(e) => setConfirmNewPwd(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <button
                          className="eye-btn"
                          type="button"
                          onClick={() => setShowConfirmNewPwd(!showConfirmNewPwd)}
                          aria-label="Toggle password visibility"
                        >
                          {showConfirmNewPwd ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hint">
                    <HiOutlineInformationCircle />
                    New password must be at least 8 characters
                  </div>

                  <button className="save-btn" type="submit" disabled={savingChangePwd}>
                    <HiOutlineLockClosed />
                    {savingChangePwd ? "Updating..." : "Update Password"}
                  </button>
                </form>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
