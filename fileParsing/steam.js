const axios = require('axios');
const cheerio = require('cheerio');
var fsp = require('fs/promises');

exports.getSteamId = async (name) =>
{
    const url = `https://store.steampowered.com/search/?term=${name}`
    const response = await axios.get(url, {
        transformResponse: x => x
    }); // to disable json parsing
    const html = response.data;
    const $ = cheerio.load(html);

    const appidValue = $('#search_resultsRows > a:nth-child(1)').attr('data-ds-appid');

    if(!appidValue)
    {
        return -1;
    }

    return appidValue
}