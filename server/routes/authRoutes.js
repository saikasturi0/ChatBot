import {AuthenticateUser, RegisterUser, LoginUser, LogoutUser} from '../controllers/Authentication.js';
import express from 'express';

const router = express.Router();

// It Checks if the user is authenticated by verifying the JWT token from cookies
router.post("/isAuthenticated", AuthenticateUser, (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
});

// It Handles user registration by hashing the password and generating a JWT token
router.post("/register", RegisterUser)

// It Handles user login by verifying the email and password, then generating a JWT token
router.post("/login", LoginUser)

// It Clears the JWT token cookie to log out the user
router.post("/logout", LogoutUser);

export default router;
