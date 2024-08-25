const Review = require("../models/Review");
const mongoose = require("mongoose");
const natural = require("natural");
const TfIdf = natural.TfIdf;

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

    // Initialize TF-IDF
    const tfidf = new TfIdf();

    // Add each review to the TF-IDF document
    reviews.forEach((review) => tfidf.addDocument(review.review));

    // Summarize reviews using TF-IDF
    const reviewsWithSummary = reviews.map((review, index) => {
      // Extract the top 5 terms with the highest TF-IDF scores for each review
      const summaryTerms = tfidf
        .listTerms(index)
        .slice(0, 5)
        .map((term) => term.term)
        .join(", ");

      return {
        ...review.toObject(),
        summary: summaryTerms,
        isUserLoggedIn: loggedInUserID === review.user._id.toString(),
        isReacted: Object.keys(review.reactions).some((reactionType) =>
          review.reactions[reactionType].includes(loggedInUserID)
        ),
      };
    });

    res.json({
      data: reviewsWithSummary,
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

    // Initialize TF-IDF and add the review document
    const tfidf = new natural.TfIdf();
    tfidf.addDocument(review.review);

    // Extract the top 5 terms with the highest TF-IDF scores
    const summary = tfidf
      .listTerms(0)
      .slice(0, 5)
      .map((term) => term.term)
      .join(", ");

    res.json({
      data: {
        ...review.toObject(),
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to add a reaction
const addReaction = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const userID = req.user.id;
    const { reactionType } = req.body;

    const validReactions = ["like", "love", "haha", "wow", "sad", "angry"];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const review = await Review.findById(reviewID);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Remove existing reaction of the same type from the user
    review.reactions[reactionType] = review.reactions[reactionType].filter(
      (user) => !user.equals(userID)
    );

    // Add new reaction
    review.reactions[reactionType].push(userID);
    await review.save();

    res.json({
      message: "Reaction added successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller to remove a reaction
const removeReaction = async (req, res) => {
  try {
    const reviewID = req.params.reviewID;
    const userID = req.user.id;
    const { reactionType } = req.body;

    const validReactions = ["like", "love", "haha", "wow", "sad", "angry"];
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const review = await Review.findById(reviewID);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Remove reaction of the specified type from the user
    review.reactions[reactionType] = review.reactions[reactionType].filter(
      (user) => !user.equals(userID)
    );
    await review.save();

    res.json({
      message: "Reaction removed successfully",
      review,
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
  addReaction,
  removeReaction,
  likeMovieReview,
  unlikeMovieReview,
};
