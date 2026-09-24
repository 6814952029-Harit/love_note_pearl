const express = require("express");
const { listUsers, updateUserByAdmin } = require("../controllers/user.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users", listUsers);
router.put("/users/:id", updateUserByAdmin);

module.exports = router;
