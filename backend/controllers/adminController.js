const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { refineAiSuggestion } = require("../services/aiService");

const getAdmins = asyncHandler(async (_req, res) => {
  const admins = await User.find({ role: "ADMIN" }).select("name email role").sort({ name: 1 });

  res.status(200).json({
    success: true,
    data: admins,
  });
});

const refineAiDraft = asyncHandler(async (req, res) => {
  const { originalSuggestion, question, context = [] } = req.body;

  if (!originalSuggestion || !question) {
    return res.status(400).json({
      success: false,
      message: "Original suggestion and question are required",
    });
  }

  const result = await refineAiSuggestion(originalSuggestion, question, context);

  res.status(200).json({
    success: true,
    data: {
      refinedSuggestion: result.refinedSuggestion,
      reply: result.reply,
      aiAvailable: result.aiAvailable,
    },
  });
});

module.exports = {
  getAdmins,
  refineAiDraft,
};
