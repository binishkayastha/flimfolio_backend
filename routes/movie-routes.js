const express = require("express");
const router = express.Router();
const movieController = require("../controllers/movie_controller");
const { verifyUser } = require("../middlewares/auth");

// Route to get trending movies
router.get("/trending", movieController.getTrendingMovies);

// Route to get popular movies
router.get("/popular", movieController.getPopularMovies);

// Route to get top rated movies
router.get("/top_rated", movieController.getTopRatedMovies);

// Route to get movie details with cast, similar movies, and top reviews
router.get("/:id", verifyUser, movieController.getMovieDetails);

// Route to search movies by name
router.get("/search/:name", movieController.searchMoviesByName);

module.exports = router;
