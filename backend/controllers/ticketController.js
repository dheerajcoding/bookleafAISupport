const Ticket = require("../models/Ticket");
const Book = require("../models/Book");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { classifyTicket, generateDraftResponse } = require("../services/aiService");
const { emitToAdmin, emitToAuthor, emitToTicket } = require("../services/socketService");

function buildTicketQuery(user, query) {
  if (user.role === "ADMIN") {
    const adminQuery = {};
    if (query.status) {
      adminQuery.status = query.status;
    }
    if (query.category) {
      adminQuery.category = query.category;
    }
    if (query.priority) {
      adminQuery.priority = query.priority;
    }
    return adminQuery;
  }

  return { authorId: user._id };
}

const populateTicket = [
  { path: "authorId", select: "name email author_id" },
  { path: "bookId", select: "title book_id status publication_date" },
  { path: "assignedTo", select: "name email" },
];

const createTicket = asyncHandler(async (req, res) => {
  const { bookId, subject, description } = req.body;

  let book = null;
  if (bookId) {
    book = await Book.findOne({ _id: bookId, authorId: req.user._id });
    if (!book) {
      throw new ApiError(404, "Book not found for this author");
    }
  }

  const aiClassification = await classifyTicket(description);
  const aiDraft = await generateDraftResponse(description, book);

  const ticket = await Ticket.create({
    authorId: req.user._id,
    bookId: book ? book._id : null,
    subject,
    description,
    category: aiClassification.category,
    priority: aiClassification.priority,
    status: "Open",
    aiDraftResponse: aiDraft.draft,
    messages: [
      {
        sender: "AUTHOR",
        content: description,
      },
    ],
  });

  const hydrated = await Ticket.findById(ticket._id).populate(populateTicket);

  const io = req.app.get("io");
  emitToAdmin(io, "ticket:new", hydrated);
  emitToAuthor(io, req.user._id, "ticket:updated", hydrated);

  res.status(201).json({
    success: true,
    data: hydrated,
    meta: {
      aiClassificationUsed: aiClassification.aiAvailable,
      aiDraftUsed: aiDraft.aiAvailable,
    },
  });
});

const getTickets = asyncHandler(async (req, res) => {
  const query = buildTicketQuery(req.user, req.query);

  const tickets = await Ticket.find(query)
    .populate(populateTicket)
    .sort({ updatedAt: -1, createdAt: -1 });

  res.status(200).json({ success: true, data: tickets });
});

const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticket = await Ticket.findById(id).populate(populateTicket);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (
    req.user.role === "AUTHOR" &&
    ticket.authorId._id.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Forbidden");
  }

  res.status(200).json({ success: true, data: ticket });
});

const addTicketMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (
    req.user.role === "AUTHOR" &&
    ticket.authorId.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(403, "Forbidden");
  }

  ticket.messages.push({
    sender: req.user.role,
    content,
  });

  await ticket.save();

  const hydrated = await Ticket.findById(ticket._id).populate(populateTicket);

  const io = req.app.get("io");
  emitToTicket(io, hydrated._id, "ticket:message", hydrated);
  emitToAuthor(io, hydrated.authorId._id, "ticket:updated", hydrated);
  emitToAdmin(io, "ticket:updated", hydrated);

  res.status(200).json({ success: true, data: hydrated });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  ticket.status = status;
  await ticket.save();

  const hydrated = await Ticket.findById(ticket._id).populate(populateTicket);

  const io = req.app.get("io");
  emitToAuthor(io, hydrated.authorId._id, "ticket:updated", hydrated);
  emitToAdmin(io, "ticket:updated", hydrated);

  res.status(200).json({ success: true, data: hydrated });
});

const assignTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body;

  const adminUser = await User.findOne({ _id: adminId, role: "ADMIN" });
  if (!adminUser) {
    throw new ApiError(404, "Admin user not found");
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  ticket.assignedTo = adminId;
  if (ticket.status === "Open") {
    ticket.status = "In Progress";
  }

  await ticket.save();

  const hydrated = await Ticket.findById(ticket._id).populate(populateTicket);

  const io = req.app.get("io");
  emitToAuthor(io, hydrated.authorId._id, "ticket:updated", hydrated);
  emitToAdmin(io, "ticket:updated", hydrated);

  res.status(200).json({ success: true, data: hydrated });
});

const updateTicketMeta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, priority } = req.body;

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new ApiError(404, "Ticket not found");
  }

  if (category) {
    ticket.category = category;
  }
  if (priority) {
    ticket.priority = priority;
  }

  await ticket.save();
  const hydrated = await Ticket.findById(ticket._id).populate(populateTicket);

  const io = req.app.get("io");
  emitToAuthor(io, hydrated.authorId._id, "ticket:updated", hydrated);
  emitToAdmin(io, "ticket:updated", hydrated);

  res.status(200).json({ success: true, data: hydrated });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
  assignTicket,
  updateTicketMeta,
};
