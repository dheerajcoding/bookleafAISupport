const Book = require("../models/Book");
const asyncHandler = require("../utils/asyncHandler");

const getAuthorBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ authorId: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: books,
  });
});

module.exports = {
  getAuthorBooks,
};
