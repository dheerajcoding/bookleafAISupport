const mongoose = require("mongoose");
const { TICKET_STATUS, TICKET_CATEGORIES, TICKET_PRIORITIES } = require("../utils/constants");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["AUTHOR", "ADMIN"], required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ticketSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: TICKET_CATEGORIES, default: "General Inquiry" },
    priority: { type: String, enum: TICKET_PRIORITIES, default: "Medium" },
    status: { type: String, enum: TICKET_STATUS, default: "Open" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    messages: { type: [messageSchema], default: [] },
    aiDraftResponse: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", ticketSchema);
