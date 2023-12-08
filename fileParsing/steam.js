const axios = require('axios');
var fsp = require('fs/promises');

exports.getSteamId = async (name) =>
{
  const localSteamIds = await fsp.readFile("./localSteamIds.json")
  const SteamIds = JSON.parse(localSteamIds.toString()).applist.apps
  const dataLength = Object.keys(SteamIds).length
  for(var i = 0; i < dataLength; i++) {
    var id = SteamIds[i].name.toLowerCase().replace(/[^\x20-\x7E]/g, '').replace(':', '')
    const forbidArray = ['dlc', 'add-on', 'season pass', 'pack', 'Soundtrack', 'demo']
    const checker = forbidArray.some(v => id.includes(v))

    if(checker)
    {
      continue
    }

    if (id.includes(name.toLowerCase())){
        return SteamIds[i].appid;
    }
}
return -1;
}

exports.updateSteamIds = async () => {
    const steamIdsUrl = 'http://api.steampowered.com/ISteamApps/GetAppList/v0002/';
    const localFilePath = './localSteamIds.json';
    try {
        const response = await axios.get(steamIdsUrl);
        const newData = response.data;
    
        // Update local file
        const jsonString = JSON.stringify(newData)
        await fsp.writeFile(localFilePath, jsonString);
        console.log('Local file updated successfully.');
    } catch (error) {
        console.error('Error:', error.message);
    }
}