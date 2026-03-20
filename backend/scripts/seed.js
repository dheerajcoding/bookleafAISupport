require("dotenv").config();

const fs = require("fs");
const path = require("path");

const connectDB = require("../config/db");
const User = require("../models/User");
const Book = require("../models/Book");

const DATA_FILE = process.env.SEED_DATA_FILE || path.join(__dirname, "../data/authors-books.json");
const DEFAULT_AUTHOR_PASSWORD = process.env.SEED_AUTHOR_PASSWORD || "password123";
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

function parseDate(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getAuthorsFromDataset(dataset) {
  if (Array.isArray(dataset)) {
    return dataset;
  }

  if (Array.isArray(dataset.authors)) {
    return dataset.authors;
  }

  throw new Error("Dataset format is invalid. Expected an array or an object with 'authors' array.");
}

async function upsertAuthor(author) {
  const email = (author.email || "").toLowerCase().trim();
  if (!email) {
    return null;
  }

  let user = await User.findOne({ email });

  if (!user) {
    user = new User({
      author_id: author.author_id || author.id || undefined,
      name: author.name || "Unknown Author",
      email,
      password: DEFAULT_AUTHOR_PASSWORD,
      role: "AUTHOR",
      city: author.city || null,
      joined_date: parseDate(author.joined_date) || new Date(),
    });
    await user.save();
    return user;
  }

  user.author_id = author.author_id || user.author_id;
  user.name = author.name || user.name;
  user.city = author.city || user.city;
  user.joined_date = parseDate(author.joined_date) || user.joined_date;
  user.role = "AUTHOR";
  // Keep seeded credentials deterministic so all seeded users can log in.
  user.password = DEFAULT_AUTHOR_PASSWORD;

  await user.save();
  return user;
}

function mapBook(book, authorId) {
  return {
    book_id: book.book_id,
    title: book.title || "Untitled",
    isbn: book.isbn || null,
    genre: book.genre || null,
    publication_date: parseDate(book.publication_date),
    status: book.status || null,
    mrp: typeof book.mrp === "number" ? book.mrp : null,
    author_royalty_per_copy:
      typeof book.author_royalty_per_copy === "number" ? book.author_royalty_per_copy : null,
    total_copies_sold: typeof book.total_copies_sold === "number" ? book.total_copies_sold : null,
    total_royalty_earned:
      typeof book.total_royalty_earned === "number" ? book.total_royalty_earned : null,
    royalty_paid: typeof book.royalty_paid === "number" ? book.royalty_paid : null,
    royalty_pending: typeof book.royalty_pending === "number" ? book.royalty_pending : null,
    last_royalty_payout_date: parseDate(book.last_royalty_payout_date),
    print_partner: book.print_partner || null,
    available_on: Array.isArray(book.available_on) ? book.available_on : [],
    authorId,
  };
}

async function upsertBooks(author, authorUser) {
  const books = Array.isArray(author.books) ? author.books : [];

  for (const book of books) {
    if (!book.book_id) {
      continue;
    }

    await Book.findOneAndUpdate(
      { book_id: book.book_id },
      { $set: mapBook(book, authorUser._id) },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
}

async function createAdminUser() {
  const adminEmail = "admin@bookleaf.com";
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = new User({
      name: "BookLeaf Admin",
      email: adminEmail,
      password: DEFAULT_ADMIN_PASSWORD,
      role: "ADMIN",
      city: "N/A",
      joined_date: new Date(),
    });
    await admin.save();
    return;
  }

  admin.role = "ADMIN";
  admin.name = admin.name || "BookLeaf Admin";
  admin.password = DEFAULT_ADMIN_PASSWORD;
  await admin.save();
}

async function seed() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(
      `Seed data file not found at ${DATA_FILE}. Place the provided JSON dataset there or set SEED_DATA_FILE.`,
    );
  }

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  const dataset = JSON.parse(raw);
  const authors = getAuthorsFromDataset(dataset);

  await connectDB();

  for (const author of authors) {
    const authorUser = await upsertAuthor(author);
    if (!authorUser) {
      continue;
    }
    await upsertBooks(author, authorUser);
  }

  await createAdminUser();

  // eslint-disable-next-line no-console
  console.log("Seeding complete");
  process.exit(0);
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Seeding failed", error.message);
  process.exit(1);
});
