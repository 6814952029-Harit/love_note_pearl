const express = require("express");
const { requireAuth } = require("../middlewares/auth.middleware");
const { createLetter, listMyLetters, getMyLetter, updateLetter, getPublicLetter, unlockLetter } = require("../controllers/letter.controller");

const router = express.Router();
router.get("/public/:slug", getPublicLetter);
router.post("/public/:slug/unlock", unlockLetter);
router.get("/", requireAuth, listMyLetters);
router.post("/", requireAuth, createLetter);
router.get("/:id", requireAuth, getMyLetter);
router.put("/:id", requireAuth, updateLetter);
module.exports = router;
