const axios = require('axios');

exports.getGameDetails = async (id) => {
  const url = `https://api.rawg.io/api/games/${id}?key=${process.env.RAWG_API_KEY}&page_size=10&platforms=4`; // 4 === PC
  const response = await axios.get(url);
  const jsonData = JSON.parse(JSON.stringify(response.data));

  if (!jsonData) {
    return -1;
  }
  const genres = jsonData.genres.slice(0, 3).map((genre) => genre.name);
  const reformattedJson = {
    mediaId: jsonData.id,
    headerImage: jsonData.background_image.replace('/media/', '/media/resize/420/-/'),
    description: jsonData.description_raw.substring(0, 400),
    genre: genres,
    release: new Date(jsonData.released).getFullYear(),
  };

  return reformattedJson;
};
