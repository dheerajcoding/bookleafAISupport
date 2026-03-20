const express = require("express");

const authRoutes = require("./authRoutes");
const bookRoutes = require("./bookRoutes");
const ticketRoutes = require("./ticketRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/books", bookRoutes);
router.use("/tickets", ticketRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
