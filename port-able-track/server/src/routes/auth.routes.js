const express = require("express");
const { register, login, getMe } = require("../controllers/user.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
module.exports = router;
