const Review = require("../models/Review");
const mongoose = require('mongoose');

// Controller to add a review for a movie
const addMovieReview = async (req, res) => {
  try {
    const movieID = req.params.id;
    const { rating, review } = req.body;
    const user = req.user.id;

    const newReview = new Review({
      movieID,
      user,
      rating,
      review,
      createdAt: Date.now(),
    });

    await newReview.save();

    res.status(201).json({
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    res.json({ error: error.message });
  }
};

// Controller to update a review
const updateMovieReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const { rating, review: updatedReview } = req.body;

    const reviewToUpdate = await Review.findById(reviewID);

    if (!reviewToUpdate) {
      return res.status(404).json({ error: "Review not found" });
    }

    reviewToUpdate.rating = rating;
    reviewToUpdate.review = updatedReview;
    reviewToUpdate.updatedAt = Date.now();

    await reviewToUpdate.save();

    res.status(201).json({
      message: "Review updated successfully",
      review: reviewToUpdate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to delete a review
const deleteMovieReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;

    const result = await Review.deleteOne({ _id: reviewID });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(204).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMovieReviews = async (req, res) => {
  try {
    const movieID = req.params.id;
    const loggedInUserID = req.user ? req.user.id : null;

    // Fetch all reviews for the movie
    const reviews = await Review.find({ movieID }).populate("user");

    // Create an array to store the review IDs liked by the user
    let likedReviewIds = [];

    // If the user is logged in, fetch the liked reviews by the user
    if (loggedInUserID) {
      const likedReviews = await Review.find({
        _id: { $in: reviews.map((review) => new mongoose.Types.ObjectId(review._id)) },
        likes: loggedInUserID,
      });
      likedReviewIds = likedReviews.map((review) => review._id.toString());
    }

    // Add the isUserLoggedIn and isLiked fields to each review object
    const reviewsWithExtraFields = reviews.map((review) => ({
      ...review.toObject(),
      isUserLoggedIn: loggedInUserID === review.user._id.toString(),
      isLiked: likedReviewIds.includes(review._id.toString()),
    }));

    res.json({
      data: reviewsWithExtraFields,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to get a review by id
const getMovieReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;

    const review = await Review.findById(reviewID).populate("user");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({
      data: review,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to like a review
const likeMovieReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const userID = req.user.id;

    const review = await Review.findById(reviewID);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const isLiked = review.likes.includes(userID);

    if (isLiked) {
      return res.json({ message: "You have already liked this review" });
    }

    review.likes.push(userID);
    await review.save();

    res.json({
      message: "Review liked successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to unlike a review
const unlikeMovieReview = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const userID = req.user.id;

    const review = await Review.findById(reviewID);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const isLiked = review.likes.includes(userID);

    if (!isLiked) {
      return res.json({ message: "You have not liked this review" });
    }

    const likeIndex = review.likes.indexOf(userID);
    review.likes.splice(likeIndex, 1);
    await review.save();

    res.json({
      message: "Review unliked successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  addMovieReview,
  updateMovieReview,
  deleteMovieReview,
  getMovieReviews,
  getMovieReview,
  likeMovieReview,
  unlikeMovieReview
};
