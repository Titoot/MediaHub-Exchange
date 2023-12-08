const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  steamid: { type: String, default: null },
  genre: String,
  headerImage: String,
  description: String,
});

const movieSchema = new mongoose.Schema({
  genre: { type: String, default: null },
  headerImage: String,
  description: String,
});

const seriesSchema = new mongoose.Schema({
  seasons: Number,
  genre: { type: String, default: null },
  headerImage: String,
  description: String,
});

const animeSchema = new mongoose.Schema({
  seasons: Number,
  genre: { type: String, default: null },
  headerImage: String,
  description: String,
});

const Game = mongoose.model('Game', gameSchema);

const Movie = mongoose.model('Movie', movieSchema);

const Series = mongoose.model('Series', seriesSchema);

const Anime = mongoose.model('Anime', animeSchema);

module.exports = { Game, Movie, Series, Anime };