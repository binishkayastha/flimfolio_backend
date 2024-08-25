const express = require("express");
const router = express.Router();
const movieController = require("../controllers/review-controller");

// Route to add a review for a movie
router.post("/:id/reviews", movieController.addMovieReview);

// Route to update a review
router.put("/:id/reviews/:reviewID", movieController.updateMovieReview);

// Route to delete a review
router.delete("/:id/reviews/:reviewID", movieController.deleteMovieReview);

// Route to get all reviews for a movie
router.get("/:id/reviews", movieController.getMovieReviews);

// Route to get review by id
router.get("/:id/reviews/:reviewID", movieController.getMovieReview);

// Route to like a review
router.post("/:id/reviews/:reviewID/like", movieController.likeMovieReview);

// Route to unlike a review
router.post("/:id/reviews/:reviewID/unlike", movieController.unlikeMovieReview);

// Route to add a reaction to a review
router.post("/:id/reviews/:reviewID/reactions", movieController.addReaction);

// Route to remove a reaction from a review
router.delete(
  "/:id/reviews/:reviewID/reactions",
  movieController.removeReaction
);

module.exports = router;
