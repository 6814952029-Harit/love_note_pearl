const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const createToken = (userId) => jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
const authResponse = (user) => ({ token: createToken(user._id.toString()), user: user.toJSON() });

const register = async (req, res, next) => {
    try {
        const { displayName, email, password, adminCode } = req.body;
        if (!displayName || !email || !password) return res.status(400).json({ message: "displayName, email and password are required." });
        if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
        const normalizedEmail = email.trim().toLowerCase();
        if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "This email is already registered." });
        const isBootstrapAdmin = Boolean(
            process.env.ADMIN_EMAIL
            && process.env.ADMIN_BOOTSTRAP_CODE
            && normalizedEmail === process.env.ADMIN_EMAIL.trim().toLowerCase()
            && adminCode === process.env.ADMIN_BOOTSTRAP_CODE
        );
        const user = await User.create({ displayName, email: normalizedEmail, passwordHash: await User.hashPassword(password), role: isBootstrapAdmin ? "admin" : "user" });
        res.status(201).json(authResponse(user));
    } catch (error) { next(error); }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
        if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: "Invalid email or password." });
        res.json(authResponse(user));
    } catch (error) { next(error); }
};

const getMe = async (req, res) => res.json({ user: req.user });

const listUsers = async (req, res, next) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) { next(error); }
};

const updateUserByAdmin = async (req, res, next) => {
    try {
        const { displayName, email, role } = req.body;
        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (email !== undefined) updates.email = email.trim().toLowerCase();
        if (role !== undefined) {
            if (!["user", "admin"].includes(role)) return res.status(400).json({ message: "Role must be user or admin." });
            if (req.params.id === req.user._id.toString() && role !== "admin") return res.status(400).json({ message: "You cannot remove your own admin role." });
            updates.role = role;
        }
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ message: "User not found." });
        res.json({ user });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "This email is already registered." });
        next(error);
    }
};

module.exports = { register, login, getMe, listUsers, updateUserByAdmin };
