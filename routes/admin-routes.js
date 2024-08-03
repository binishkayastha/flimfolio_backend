const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin-controller");
const { verifyUser } = require("../middlewares/auth");

// Admin dashboard summary
router.get("/dashboard-summary", verifyUser, adminController.getDashboardSummary);

// Admin view and delete users
router.get("/users", verifyUser, adminController.viewAllUsers);
router.delete("/users/:userId", verifyUser, adminController.deleteUser);

module.exports = router;