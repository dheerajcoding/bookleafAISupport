const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    book_id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    isbn: { type: String, default: null },
    genre: { type: String, default: null },
    publication_date: { type: Date, default: null },
    status: { type: String, default: null },
    mrp: { type: Number, default: null },
    author_royalty_per_copy: { type: Number, default: null },
    total_copies_sold: { type: Number, default: null },
    total_royalty_earned: { type: Number, default: null },
    royalty_paid: { type: Number, default: null },
    royalty_pending: { type: Number, default: null },
    last_royalty_payout_date: { type: Date, default: null },
    print_partner: { type: String, default: null },
    available_on: { type: [String], default: [] },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Book", bookSchema);
