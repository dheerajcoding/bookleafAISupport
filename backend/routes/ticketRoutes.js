const express = require("express");

const {
  createTicket,
  getTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
  updateTicketMeta,
} = require("../controllers/ticketController");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const {
  createTicketSchema,
  messageSchema,
  statusSchema,
  assignSchema,
  updateTicketMetaSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.use(auth);

router.post("/", authorize("AUTHOR"), validate(createTicketSchema), createTicket);
router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/:id/message", validate(messageSchema), addTicketMessage);
router.patch("/:id/status", authorize("ADMIN"), validate(statusSchema), updateTicketStatus);
router.patch("/:id/assign", authorize("ADMIN"), validate(assignSchema), assignTicket);
router.patch("/:id/meta", authorize("ADMIN"), validate(updateTicketMetaSchema), updateTicketMeta);

module.exports = router;
