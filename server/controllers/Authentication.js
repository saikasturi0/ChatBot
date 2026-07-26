import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import users from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// It Generates a JWT token for the authenticated user
function TokenGenerator(user){
    const token = jwt.sign({
        id: user._id,
    }, JWT_SECRET, { expiresIn: "7d" });

    return token;
}

// Middleware to authenticate the user using the JWT token from cookies
async function AuthenticateUser(req, res, next){
    const token = req.cookies.token;
    if(!token) return res.status(401).json({ success: false, message: "Unauthorized" });    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await users.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error("AUTH ERROR:", err);
        return res.status(401).json({ success: false, message: "Invalid token" });
    } 
}

// It Creates a cookie with the JWT token for the authenticated user
async function CreateCookie(token, res){
    res.cookie("token", token, COOKIE_OPTIONS);
}

// It Handles user registration by hashing the password and generating a JWT token
async function RegisterUser(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const user = await users.findOne({ email: email.toLowerCase() });
        if(user){
            return res.status(409).json({ success: false, message: "User already exists" });
        }

        const newUser = new users({ name, email, password });
        await newUser.save();

        const token = TokenGenerator(newUser);
        CreateCookie(token, res);

        return res.status(201).json({ success: true, user: sanitizeUser(newUser) });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// It Handles user login by verifying the email and password, then generating a JWT token
async function LoginUser(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await users.findOne({ email: email.toLowerCase() });

        if(!user) return res.status(401).json({ success: false, message: "Invalid email or password" });

        const isPasswordValid = await bcrypt.compare(password, user.password);
    
        if(!isPasswordValid) return res.status(401).json({ success: false, message: "Invalid email or password" });
    
        const token = TokenGenerator(user);
        CreateCookie(token, res);

        return res.status(200).json({ success: true, user: sanitizeUser(user) });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

// It Clears the JWT token cookie to log out the user
async function LogoutUser(req, res) {
    res.clearCookie("token", COOKIE_OPTIONS);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
}

function sanitizeUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        careerGoal: user.careerGoal,
        googleAuth: user.googleAuth
    };
}

export {AuthenticateUser, RegisterUser, LoginUser, LogoutUser};
