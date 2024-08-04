// admin-controller.js

const User = require("../models/User");
const Review = require("../models/Review");
const Watchlist = require("../models/Watchlist");
// const ExchangeRequest = require("../models/ExchangeRequest");
// const Book = require("../models/Books");

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReview = await Review.countDocuments();
    const totalWatchlist = await Watchlist.countDocuments();

    res.json({
      totalUsers,
        totalReview,
        totalWatchlist,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// View all users
exports.viewAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password from the results
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    User.findByIdAndDelete(req.params.userId)
    .then((reply) => res.status(204).end())
    .catch(next);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};