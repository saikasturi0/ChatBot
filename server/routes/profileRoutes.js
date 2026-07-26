import express from "express";

import {
    handleUserDetails,
    handleSetPassword,
    handleChangePassword,
} from "../controllers/profile.js";
import { AuthenticateUser } from "../controllers/Authentication.js";

const router = express.Router();

// Update profile
router.get("/profile", AuthenticateUser, (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            careerGoal: req.user.careerGoal,
            googleAuth: req.user.googleAuth
        }
    });
});

router.post("/update-profile", AuthenticateUser, handleUserDetails);

// Set password
router.post("/set-password", AuthenticateUser, handleSetPassword);

// Change password
router.post("/change-password", AuthenticateUser, handleChangePassword);

export default router;
