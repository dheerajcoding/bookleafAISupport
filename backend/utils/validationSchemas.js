const Joi = require("joi");
const { TICKET_STATUS, TICKET_CATEGORIES, TICKET_PRIORITIES } = require("./constants");

const registerSchema = Joi.object({
  author_id: Joi.string().trim().allow(null, ""),
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("AUTHOR", "ADMIN").optional(),
  city: Joi.string().max(120).allow(null, ""),
  joined_date: Joi.date().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createTicketSchema = Joi.object({
  bookId: Joi.string().hex().length(24).allow(null),
  subject: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(3000).required(),
});

const messageSchema = Joi.object({
  content: Joi.string().min(1).max(3000).required(),
});

const statusSchema = Joi.object({
  status: Joi.string()
    .valid(...TICKET_STATUS)
    .required(),
});

const assignSchema = Joi.object({
  adminId: Joi.string().hex().length(24).required(),
});

const updateTicketMetaSchema = Joi.object({
  category: Joi.string()
    .valid(...TICKET_CATEGORIES)
    .optional(),
  priority: Joi.string()
    .valid(...TICKET_PRIORITIES)
    .optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTicketSchema,
  messageSchema,
  statusSchema,
  assignSchema,
  updateTicketMetaSchema,
};
