const express = require("express");
const router = express.Router();
const watchlistController = require("../controllers/watchlist_controller");
const { verifyUser } = require("../middlewares/auth");

// Route to get all movies in the user's watchlist
router.get("/", watchlistController.getWatchlist);

// Route to add a movie to the user's watchlist
router.post("/:id", watchlistController.addToWatchlist);

// Route to remove a movie from the user's watchlist
router.delete("/:id", watchlistController.removeFromWatchlist);

module.exports = router;
