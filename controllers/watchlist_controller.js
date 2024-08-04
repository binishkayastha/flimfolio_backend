const Watchlist = require("../models/Watchlist");
const User = require("../models/User");
const axios = require("axios");
const apiKey = process.env.API_KEY;

// Controller method to get all movies in the user's watchlist
const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have middleware to extract the user ID

    const watchlist = await Watchlist.find({ user: userId });

    res.json({data : watchlist});
  } catch (err) {
    next(err);
  }
};


// Controller method to add a movie to the user's watchlist
const addToWatchlist = async (req, res, next) => {
    try {
      const userId = req.user.id; // Assuming you have middleware to extract the user ID
      const movieId = req.params.id;   

      const user = await User.findById(userId);

      const movieDetailsResponse = await  axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
      );

      const movieDetails = movieDetailsResponse.data;

    if (!movieDetails) {
      return res.status(404).json({ error: "Movie not found" });
    }

      const watchlist = new Watchlist({
        user: userId,
        movieId: movieId,
        movieDetails: movieDetails
      });

      user.watchlist.push(movieId);
      await user.save();
  
      await watchlist.save();
  
      res.json({data : [watchlist]});
    } catch (err) {
      next(err);
    }
  };
  

// Controller method to remove a movie from the user's watchlist
const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming you have middleware to extract the user ID
    const movieId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const watchlist = await Watchlist.findOneAndDelete({ user: userId, movieId });

    // Filter out null values and convert to string before saving
    user.watchlist = user.watchlist.filter((watchlistItem) => watchlistItem && watchlistItem.toString() !== movieId);
    await user.save();

    res.json(watchlist);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
