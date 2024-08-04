const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require("./User");

const movieDetailsSchema = new mongoose.Schema({
  // Define the fields you want to store for the movie details
  id: { type: String, required: true },
  title: { type: String, required: true },
  poster_path: { type: String, required: true },
  // Add other fields as needed
});


const watchlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  movieDetails: movieDetailsSchema
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

module.exports = Watchlist;
