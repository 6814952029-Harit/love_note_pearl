const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const requireAuth = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || "").split(" ");
        if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Authentication is required." });
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ message: "User no longer exists." });
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ message: "Invalid or expired token." });
        next(error);
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission to perform this action." });
    }
    next();
};

module.exports = { requireAuth, requireRole };
