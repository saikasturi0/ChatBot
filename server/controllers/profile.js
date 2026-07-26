import users from "../models/User.js";
import bcrypt from "bcrypt";

// Update User Profile
async function handleUserDetails(req, res) {
    try {
        const { name, career_goal } = req.body;

        const user = await users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.name = name || user.name;
        user.careerGoal = career_goal || user.careerGoal;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                name: user.name,
                email: user.email,
                career_goal: user.careerGoal,
            },
        });
    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

// Set Password (for users who don't have a password yet)
async function handleSetPassword(req, res) {
    try {
        const { password } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const user = await users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.password = password;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password set successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

// Change Password
async function handleChangePassword(req, res) {
    try {
        const { current_password, password } = req.body;

        if (!current_password || !password) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const user = await users.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await user.comparePassword(
            current_password
        );

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        user.password = password;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export {
    handleUserDetails,
    handleSetPassword,
    handleChangePassword,
};
