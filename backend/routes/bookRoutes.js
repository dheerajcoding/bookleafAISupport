const express = require("express");

const { getAuthorBooks } = require("../controllers/bookController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/", auth, authorize("AUTHOR"), getAuthorBooks);

module.exports = router;
