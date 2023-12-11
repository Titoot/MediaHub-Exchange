const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  steamid: { type: String, default: null },
  genre: { type: String, default: null },
  headerImage: { type: String, default: null },
  description: { type: String, default: null },
});

const movieSchema = new mongoose.Schema({
  genre: { type: String, default: null },
  headerImage: { type: String, default: null },
  description: { type: String, default: null },
});

const seriesSchema = new mongoose.Schema({
  seasons: { type: String, default: null },
  genre: { type: String, default: null },
  headerImage: { type: String, default: null },
  description: { type: String, default: null },
});

const animeSchema = new mongoose.Schema({
  seasons: { type: String, default: null },
  genre: { type: String, default: null },
  headerImage: { type: String, default: null },
  description: { type: String, default: null },
});

const Game = mongoose.model('Game', gameSchema);

const Movie = mongoose.model('Movie', movieSchema);

const Series = mongoose.model('Series', seriesSchema);

const Anime = mongoose.model('Anime', animeSchema);

module.exports = { Game, Movie, Series, Anime };