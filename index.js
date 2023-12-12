require("dotenv").config();
if (process.env.NODE_ENV !== 'test') {
  require("./config/database").connect();
}
const Folder = require("./model/folders");
const Type = require("./model/type");
const utils = require("./utils")
const steam = require("./fileParsing/steam")
const UserController = require("./controllers/UserController")
const FolderController = require("./controllers/FolderController")
const FileController = require("./controllers/FileController")
const express = require("express");
const cookieParser = require("cookie-parser");
const axios = require('axios');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, './public'))
app.use(cookieParser());
app.use(UserController.isLoggedIn)
app.use(FolderController.isOwned)
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  console.error({message: err.message, error: err})
  res.status(err.statusCode).json({status: err.statusCode, message: 'Internal Server Error'})
})

app.post('/login', UserController.Login)
app.post('/signup', UserController.Register)
app.get('/logout', UserController.logout)

app.post('/createFolder', FolderController.CreateFolder)
app.delete('/deleteFolder', FolderController.DeleteFolder)

app.post('/createFile', FileController.CreateFile)

app.get('/', async (req, res) => {

    const folder = await Folder.Folder.find({})
    if(folder)
    {
      var folders = await Promise.all(
        folder.map(async (folderId) => {
          return await insertFolder(folderId, false, req.path)
        })
      );
    }

    res.render('index', {folders: folders, isLoggedIn: res.locals.isLoggedIn, isOwned: false });
  });

app.get('/:folderName', async (req, res) => {
  var folderName = req.params.folderName
  const folder = await Folder.Folder.findOne({name: folderName})
  if(!folder)
  {
    res.status(404).send("Folder Not Found");
    return;
  }
  var folders = await Promise.all(
    folder.subfolders.map(async (folderId) => {
      return await insertFolder(folderId, true, req.path, res.locals.isOwned)
    })
  );

  var files = []
  var files = await Promise.all(
    folder.files.map(async (fileId) => {
      return await insertFiles(fileId, res.locals.isOwned);
    })
  );

  var struct = folders.concat(files)

  res.render('index', {folders: struct, isLoggedIn: res.locals.isLoggedIn, isOwned: res.locals.isOwned });

})

app.get('/:folderName/:subFolderName*?', async (req, res) => {

  const subfolder = await Folder.Subfolder.findOne({path: utils.pathNormalize(req.path)})
  if(!subfolder)
  {
    res.status(404).send("Folder Not Found");
    return;
  }

  var folders = await Promise.all(
    subfolder.subfolders.map(async (folderId) => {
      return await insertFolder(folderId, true, req.path, res.locals.isOwned)
    })
  );

  var filesArray = await Promise.all(
    subfolder.files.map(async (file) => {
      const fileDetails = await Folder.File.findById(file);
      
      return insertFiles(fileDetails, res.locals.isOwned);
    })
  );

  const struct = folders.concat(filesArray)

  res.render('index', {folders: struct, isLoggedIn: res.locals.isLoggedIn, isOwned: res.locals.isOwned });

})

async function insertFolder(folderId, isSubFolder=false, routePath=null, isOwned=false) {
  const folder = isSubFolder ? await Folder.Subfolder.findById(folderId) : folderId
  const name = isSubFolder ? path.join(routePath, folder.name) : folder.name
  const icon = isSubFolder ? 'folder' : 'person'

  // if MainFolder get user location
  return `
  <li class="list-item">
              <a gd-type="application/pdf" href="${name}">
                <div class="baritem-1" title="${folder.name}">
                  <i class="icon material-icons">${icon}</i>
                  ${folder.name}
                </div>
                <div class="baritem-2">${utils.formatDate(folder.modifiedAt)}</div>
                <div class="baritem-3">-</div>
              </a>
              <div class="baritem-3">
              ${isOwned ? '<button class="folder-delete-button material-icons">folder_delete</button>' : '-'}
              </div>
            </li>
  `
}
async function insertFiles(fileId, isOwned=false) {
  const file = await Folder.File.findById(fileId)
  const fileType = file.typeModel
  const contentDetails = await getContentDetails(fileType, file.contentDetails)
  //const steamId = getSteamId(Name)
  return await generateFileListItem(file, fileType, contentDetails, isOwned)
}

async function generateFileListItem(file, fileType, contentDetails, isOwned=false) {
  const fileIcon = setcommonAttributes(fileType)
  const commonAttributes = `
    <div class="baritem-1" title="${file.name}">
      <i class="icon material-icons">${fileIcon}</i>
      ${file.name}
    </div>
    <div class="baritem-2">${utils.formatDate(file.modifiedAt)}</div>
    <div class="baritem-3">${file.size}</div>
  `;

  switch (fileType) {
    case 'Game':
      if(contentDetails.steamid == null)
      {
        const steamId = await steam.getSteamId(file.name)
        steamUrl = `https://store.steampowered.com/api/appdetails?appids=${steamId}`

        const res = await axios({
          method: 'get',
          url: steamUrl
          });
        const steamData = res.data[steamId].data
        await file.updateOne({ name: steamData.name })
        await contentDetails.set({ steamid: steamId, headerImage: steamData.header_image, description: steamData.short_description}).save()
      }

      const gameData = contentDetails;
      return `
        <li class="list-item">
          <a gd-type="application/pdf" onclick="showInfo('${file.name}', '${gameData.description}', '${gameData.headerImage}', '${gameData.steamid}', '${file.size}', 'fuck it forgot to create the schema')">
            ${commonAttributes}
          </a>
          <div class="baritem-3">
          ${isOwned ? '<button class="file-delete-button material-icons">delete</button>' : ''}
            <button class="info-button" onclick="showInfo('${file.name}', '${gameData.description}', '${gameData.headerImage}', '${gameData.steamid}', '${file.size}', 'fuck it forgot to create the schema')">
              <i class="icon material-icons">info_outline</i>
            </button>
          </div>
        </li>
      `;
    case 'Movie':
      const movieData = contentDetails;
      return `
        <li class="list-item">
          <a gd-type="application/pdf" onclick="showInfo('${file.name}', '${movieData.description}', '${movieData.headerImage}')">
            ${commonAttributes}
          </a>
          <div class="baritem-3">
            ${isOwned ? '<button class="file-delete-button material-icons">delete</button>' : ''}
            <button class="info-button" onclick="showInfo('${file.name}', '${movieData.description}', '${movieData.headerImage}')">
              <i class="icon material-icons">info_outline</i>
            </button>
          </div>
        </li>
      `;

    default:
      throw new Error('Invalid file type');
  }
}

function setcommonAttributes(fileType)
{
  switch (fileType) {
    case 'Game':
      return 'games'

    case 'Movie':
        return 'movie'
    
    case 'Series':
          return 'live_tv'
    case 'Anime':
          return 'sick'
    default:
      throw new Error('Invalid file type');
  }
}

async function getContentDetails(fileType, contentDetailsId)
{

switch (fileType) {
  case 'Game':
    return await Type.Game.findById(contentDetailsId);

  case 'Movie':
    return await Type.Movie.findById(contentDetailsId);

  case 'Series':
    return await Type.Series.findById(contentDetailsId);

  case 'Anime':
    return await Type.Anime.findById(contentDetailsId);

  default:
    throw new Error('Invalid file type');
}

}

async function CreateFolder()
{
  const gameFile = await Folder.File.create({
    name: 'Game File',
    content: 'Game Content',
    typeModel: 'Game',
    contentDetails: await Type.Game.create({
      steamid: '123',
      genre: 'Action',
      headerImage: 'game-image.jpg',
      description: 'Game Description',
    }),
  });

  const movieFile = await Folder.File.create({
    name: 'Movie File',
    content: 'Movie Content',
    typeModel: 'Movie',
    contentDetails: await Type.Movie.create({
      genre: 'Drama',
      headerImage: 'movie-image.jpg',
      description: 'Movie Description',
    }),
  });

  // Create subfolders
  const subfolder1 = await Folder.Subfolder.create({
    name: 'Subfolder 1',
    files: [gameFile._id],
  });

  const subfolder2 = await Folder.Subfolder.create({
    name: 'Subfolder 2',
    files: [movieFile._id],
  });

  // Create the main folder with subfolders
  const mainFolder = await Folder.Folder.create({
    name: 'Main Folder',
    subfolders: [subfolder1._id, subfolder2._id],
  });

  console.log('Folder Structure Created:', mainFolder);
}

app.set('view engine', 'ejs');

// Logic here

module.exports = app;