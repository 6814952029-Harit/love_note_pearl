const express = require("express");
const cors = require("cors");
const trackRoutes = require("./routes/track.routes");
const authRoutes = require("./routes/auth.routes");
const letterRoutes = require("./routes/letter.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const app = express();

// 1. Global middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// 2. Routes
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/letters", letterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tracks", trackRoutes);

// 3. Error handling — must be LAST
app.use(notFound);
app.use(errorHandler);

module.exports = app;
