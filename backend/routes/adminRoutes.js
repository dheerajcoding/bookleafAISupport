const express = require("express");

const { getAdmins, refineAiDraft } = require("../controllers/adminController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get("/users", auth, authorize("ADMIN"), getAdmins);
router.post("/ai-refine", auth, authorize("ADMIN"), refineAiDraft);

module.exports = router;
