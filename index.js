require("dotenv").config();
require("./config/database").connect();
const Folder = require("./model/folders");
const utils = require("./utils")
const express = require("express");
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, './public'))

app.get('/', async (req, res) => {
    //await CreateFolder()
    var folders = []
    await Folder.findOne({name: "Titoot"}).then(function (folder) {
      console.log(folder.name)
      folders.push(insertFolder(folder.name, utils.formatDate(new Date())))
      });
    res.render('index', {folders: folders});
  });

app.get('/:folderName', async (req, res) => {
  var folderName = req.params.folderName
  const folder = await Folder.findOne({name: folderName})
  if(!folder)
  {
    res.status(404).send("Folder Not Found");
    return;
  }
  var folders = []
  folder.subfolders.forEach(folder => {
    folders.push(insertFolder(folder.name, utils.formatDate(new Date()), true, folderName))
  });

  var files = []
  var files = await Promise.all(
    folder.files.map(async (file) => {
      return await insertFiles(file.name, '69GB', utils.formatDate(new Date()), '1931770');
    })
  );

  var struct = folders.concat(files)

  res.render('index', {folders: struct});

})

app.get('/:folderName/:subFolderName', async (req, res) => {
  var folderName = req.params.folderName
  var subFolderName = req.params.subFolderName
  const folder = await Folder.findOne({name: folderName})
  if(!folder)
  {
    res.status(404).send("Folder Not Found");
    return;
  }
  var filesArray = []
  var filesArray = await Promise.all(
    folder.subfolders[0].files.map(async (file) => {
      return insertFiles(file.name, '69GB', utils.formatDate(new Date()), '1931770');
    })
  );

  res.render('index', {folders: filesArray});

})

function insertFolder(Name, Date, isSubFolder=false, MainFolder=null) {
  var name = isSubFolder ? path.join(MainFolder, Name) : Name
  return `
  <li class="list-item">
              <a gd-type="application/pdf" href="/${name}">
                <div class="baritem-1" title="${Name}">
                  <i class="icon material-icons">folder</i>
                  ${Name}
                </div>
                <div class="baritem-2">${Date}</div>
                <div class="baritem-3">-</div>
              </a>
              <div class="baritem-3">
                  -
              </div>
            </li>
  `
}
async function insertFiles(Name, Size, Date, userLocation) {
  const steamId = getSteamId(Name)
  steamUrl = `https://store.steampowered.com/api/appdetails?appids=${steamId}`

  const res = await axios({
    method: 'get',
    url: steamUrl
    });
  const gameData = res.data[steamId].data
  return `
  <li class="list-item">
              <a gd-type="application/pdf" onclick="$('#info-container').css('display', 'block');$('.info-title').text('${gameData.name}'); $('.text-content p').text('${gameData.short_description}'); $('.card-image').attr('src', '${gameData.header_image}');">
                <div class="baritem-1" title="${Name}">
                  <i class="icon material-icons">insert_drive_file</i>
                  ${gameData.name}
                </div>
                <div class="baritem-2">${Date}</div>
                <div class="baritem-3">${Size}</div>
              </a>
              <div class="baritem-3">
                <button class="info-button" onclick="$('#info-container').css('display', 'block');$('.info-title').text('${gameData.name}'); $('.text-content p').text('${gameData.short_description}'); $('.card-image').attr('src', '${gameData.header_image}');">
                  <i class="icon material-icons">info_outline</i>
                </button>
              </div>
            </li>
  `
}

function getSteamId(name)
{
  if (!fs.existsSync("./localSteamIds.json")) {
    utils.updateSteamIds()
    return getSteamId(name)
  }
  const SteamIds = JSON.parse(fs.readFileSync("./localSteamIds.json").toString()).applist.apps
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

async function CreateFolder()
{
  const folder = await Folder.create({
    name: 'Titoot',
    files: [
      { name: 'Horizon Zero Dawn', content: 'This is the content of file1.txt' },
      { name: 'Batman', content: 'This is the content of file2.txt' }
    ],
    subfolders: [
      {
        name: 'Movies',
        files: [
          { name: 'sex', content: 'This is the content of sex' }
        ]
      }
    ]
  });
  console.log(folder)
}

app.set('view engine', 'ejs');

// Logic here

module.exports = app;