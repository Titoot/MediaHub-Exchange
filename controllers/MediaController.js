const { default: axios } = require('axios');
const UserController = require('./UserController');

const types = {
  Movie: 'movie',
  Series: 'tv',
  Anime: 'anime',
};

exports.search = async (req, res, next) => {
  const { searchQuery, fileType } = req.body;

  if (!(searchQuery && fileType)) {
    return res.status(400).json({ success: false, message: 'All Field Inputs Are Required' });
  }

  const token = req.cookies.access_token;
  const isLoggedIn = await UserController.isLoggedInF(token);
  if (!isLoggedIn) {
    return res.status(401).json({ success: false, message: 'User Unauthenticated' });
  }
  try {
    let result;
    switch (fileType) {
      case 'Game':
        result = await getRawgList(searchQuery);
        break;
      case 'Movie':
        result = await getSimklList(searchQuery, types.Movie);
        break;
      case 'Series':
        result = await getSimklList(searchQuery, types.Series);
        break;
      case 'Anime':
        result = await getSimklList(searchQuery, types.Anime);
        break;

      default:
        next(new Error('Invalid FileType'));
    }
    if (result === -1) {
      return res.status(404).json({ success: false, message: 'No Results Found' });
    }
    return res.status(200).json({ success: true, results: result });
  } catch (brr) {
    next(brr);
  }
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
    image: result.background_image,
    release: new Date(result.released).getFullYear(),
  }));

  return reformattedJson;
}

async function getSimklList(searchQuery, type) {
  const url = `https://api.simkl.com/search/${type}?q=${searchQuery}&page=1&limit=10&client_id=${process.env.SIMKL_API_KEY}`;
  const response = await axios.get(url);
  const jsonData = JSON.parse(JSON.stringify(response.data));

  if (!jsonData) {
    return -1;
  }

  const reformattedJson = jsonData.map((result) => ({
    mediaId: result.ids.simkl_id,
    slug: result.ids.slug,
    name: result.title,
    image: `https://wsrv.nl/?url=https://simkl.in/posters/${result.poster}_w.jpg`,
    release: result.year,
  }));

  return reformattedJson;
}
