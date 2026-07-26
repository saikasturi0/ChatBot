    import 'dotenv/config';
    import express from 'express';
    import cors from 'cors';
    import cookieParser from 'cookie-parser';
    import helmet from 'helmet';
    import compression from 'compression';
    import rateLimit from 'express-rate-limit';
    import connectToDB, { disconnectFromDB } from './config/db.js';
    import authRoutes from './routes/authRoutes.js';
    import webSearchRoutes from './routes/web-search.js'
    import ProfileRoutes from './routes/profileRoutes.js'
    import ragRoutes from './routes/ragRoutes.js'
    import chatRoutes from './routes/chatRoutes.js'
    import memoryRoutes from './routes/memoryRoutes.js'


    const app = express();
    const isProduction = process.env.NODE_ENV === "production";
    const allowedOrigins = (process.env.CLIENT_URL || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.set("trust proxy", 1);
    app.disable("x-powered-by");
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
    app.use(compression());
    app.use(rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX) || 300,
        standardHeaders: "draft-8",
        legacyHeaders: false
    }));
    app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));
    app.use(express.urlencoded({ extended: true, limit: process.env.FORM_BODY_LIMIT || "2mb" }));

    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || (!isProduction && allowedOrigins.length === 0)) {
                callback(null, true);
                return;
            }
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    }));

    app.use(cookieParser());
    app.get("/health", (req, res) => {
        res.status(200).json({
            success: true,
            message: "OK",
            environment: process.env.NODE_ENV || "development"
        });
    });
    app.use("/", authRoutes);
    app.use("/", webSearchRoutes);
    app.use("/", ProfileRoutes);
    app.use("/", ragRoutes);
    app.use("/", chatRoutes);
    app.use("/", memoryRoutes);
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found"
        });
    });
    app.use((error, req, res, next) => {
        if (!isProduction) {
            console.error("Unhandled server error:", error);
        }

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error",
            error: isProduction ? undefined : error.stack
        });
    });

    const startServer = async () => {
        try {
            await connectToDB();

            const port = process.env.PORT || 3000;
            const server = app.listen(port, () => {
                if (!isProduction) {
                    console.log(`Server is running on port ${port}`);
                } else {
                    console.log(`Server is running on port ${port}`);
                }
            });

            const shutdown = async (signal) => {
                console.log(`${signal} received. Shutting down gracefully.`);
                server.close(async () => {
                    await disconnectFromDB();
                    process.exit(0);
                });
            };

            process.on("SIGTERM", () => shutdown("SIGTERM"));
            process.on("SIGINT", () => shutdown("SIGINT"));
        } catch (error) {
            console.error('Failed to connect to DB:', error);
            process.exit(1);
        }
    };

    startServer();

    export default app;
