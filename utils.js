const axios = require('axios');
var fsp = require('fs/promises');

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }
  
exports.formatDate = (date) => {
    return (
        [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
        ].join('-') +
        ' ' +
        [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds()),
        ].join(':')
    );
}

exports.updateSteamIds = async () => {
    const steamIdsUrl = 'http://api.steampowered.com/ISteamApps/GetAppList/v0002/'; // Replace with your remote link
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