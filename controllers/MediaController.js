const { default: axios } = require('axios');
const UserController = require('./UserController');

const types = {
  Movie: 'movie',
  Series: 'tv',
  Anime: 'anime',
};

async function getRawgList(searchQuery) {
  const url = `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${searchQuery}&page_size=10&platforms=4`; // 4 === PC
  const response = await axios.get(url);
  const jsonData = JSON.parse(JSON.stringify(response.data)).results;

  if (!jsonData) {
    return -1;
  }

  const reformattedJson = jsonData.map((result) => ({
    mediaId: result.id,
    slug: result.slug,
    name: result.name,
    image: result.background_image?.replace('/media/', '/media/resize/420/-/') ?? null,
    release: new Date(result.released).getFullYear(),
  }));

  return reformattedJson;
}

async function getTMDBList(searchQuery, type) {
  const url = `https://api.themoviedb.org/3/search/${type}?query=${searchQuery}&api_key=${process.env.TMDB_API_KEY}`;
  const response = await axios.get(url);
  const jsonData = JSON.parse(JSON.stringify(response.data)).results;

  if (!jsonData) {
    return -1;
  }

  const reformattedJson = jsonData.map((result) => ({
    mediaId: result.id,
    name: result.name || result.title,
    image: `https://image.tmdb.org/t/p/w94_and_h141_bestv2/${result.poster_path}`,
    release: new Date(result.first_air_date).getFullYear(),
  }));

  return reformattedJson;
}

async function getMetaData(searchQuery, fileType, next) {
  switch (fileType) {
    case 'Game':
      return getRawgList(searchQuery);

    case 'Movie':
      return getTMDBList(searchQuery, types.Movie);

    case 'Series':
    case 'Anime':
      return getTMDBList(searchQuery, types.Series);

    default:
      next(new Error('Invalid FileType'));
  }
}

async function search(req, res, next) {
  const { searchQuery, fileType } = req.body;

  if (!(searchQuery && fileType)) {
    return res.status(400).json({ success: false, message: 'Please Put A Search Value Before Searching' });
  }

  const token = req.cookies.access_token;
  const isLoggedIn = await UserController.isLoggedInF(token);
  if (!isLoggedIn) {
    return res.status(401).json({ success: false, message: 'User Unauthenticated' });
  }
  try {
    const result = await getMetaData(searchQuery, fileType, next);

    if (result === -1) {
      return res.status(404).json({ success: false, message: 'No Results Found' });
    }
    return res.status(200).json({ success: true, results: result });
  } catch (brr) {
    next(brr);
  }
}

module.exports = { types, getMetaData, search };
