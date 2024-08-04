const axios = require("axios");
const Review = require("../models/Review");
const User = require("../models/User");

const baseURLForImage = "https://image.tmdb.org/t/p/w500";
const apiKey = process.env.API_KEY;

// Controller to get trending movies
const getTrendingMovies = async (req, res, next) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`
    );
    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message });
  }
};

// Controller to get popular movies
const getPopularMovies = async (req, res, next) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`
    );
    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message });
  }
};

// Controller to get top rated movies
const getTopRatedMovies = async (req, res, next) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}`
    );
    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message });
  }
};

const getMovieDetails = async (req, res) => {
  console.log(req.user);
  try {
    const userID = req.user ? req.user.id : null;
    const movieID = req.params.id;

    const userInfo = await User.findById(userID);

    const [movieResponse, castResponse, similarResponse, topReviewsResponse] =
      await Promise.all([
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieID}?api_key=${apiKey}`
        ),
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieID}/credits?api_key=${apiKey}`
        ),
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieID}/similar?api_key=${apiKey}`
        ),
        Review.find({ movieID })
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user"),
      ]);

    const movieDetails = movieResponse.data;
    const castWithImageURL = castResponse.data.cast.map((cast) => ({
      ...cast,
      profile_path: cast.profile_path
        ? `${baseURLForImage}${cast.profile_path}`
        : null,
    }));

    const similarMovies = similarResponse.data.results.map((movie) => ({
      ...movie,
      poster_path: movie.poster_path
        ? `${baseURLForImage}${movie.poster_path}`
        : null,
    }));

    const movieWithImageURL = {
      ...movieDetails,
      poster_path: movieDetails.poster_path
        ? `${baseURLForImage}${movieDetails.poster_path}`
        : null,
      backdrop_path: movieDetails.backdrop_path
        ? `${baseURLForImage}${movieDetails.backdrop_path}`
        : null,
    };

    // If the user is logged in, fetch the reviews liked by the user
    const likedReviews = userInfo
      ? await Review.find({
          _id: { $in: topReviewsResponse.map((review) => review._id) },
          likes: userInfo._id,
        })
      : [];

    // Add the 'isLiked' and 'isUserLoggedIn' fields to each review object
    const topReviewsWithExtraFields = topReviewsResponse.map((review) => ({
      ...review.toObject(),
      isLiked: likedReviews.some((likedReview) => likedReview._id.equals(review._id)),
      isUserLoggedIn: userInfo ? userInfo._id.equals(review.user._id) : false,
    }));

    const isWatchListed = userInfo.watchlist.includes(
      movieID.toString()
    );

    res.json({
      data: [
        {
          id: movieDetails.id,
          movie: movieWithImageURL,
          cast: castWithImageURL,
          similarMovies,
          topReviews: topReviewsWithExtraFields,
          isWatchListed,
        },
      ],
    });
  } catch (error) {
    res.json({ error: error.message });
    return;
  }
};

// Controller to search movies by name
const searchMoviesByName = async (req, res) => {
  try {
    const movieName = req.params.name;

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${movieName}`
    );
    res.json(response.data);
  } catch (err) {
    res.json({ error: err.message });
    return;
  }
};

module.exports = {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getMovieDetails,
  searchMoviesByName,
};
