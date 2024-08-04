const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Top Rated Movies Schema
const topRatedMoviesSchema = new Schema({
  imdbId: {
    type: String,
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: true
  },
  numberOfRatings: {
    type: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now()
  }
});


const topRatedMovies = mongoose.model('TopRatedMovie', topRatedMoviesSchema);
module.exports = topRatedMovies;


  