const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./User");

const reviewSchema = new Schema({
  movieID: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.Mixed,
    ref: User,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  reactions: {
    like: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
    love: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
    haha: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
    wow: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
    sad: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
    angry: [
      {
        type: Schema.Types.ObjectId,
        ref: User,
      },
    ],
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
