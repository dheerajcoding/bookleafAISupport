const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/jwt");

const register = asyncHandler(async (req, res) => {
  const { author_id, name, email, password, role, city, joined_date } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const user = await User.create({
    author_id: author_id || undefined,
    name,
    email,
    password,
    role: role || "AUTHOR",
    city,
    joined_date,
  });

  const token = signToken(user);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        author_id: user.author_id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        joined_date: user.joined_date,
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = (email || "").toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(user);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        author_id: user.author_id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        joined_date: user.joined_date,
      },
    },
  });
});

module.exports = {
  register,
  login,
};
