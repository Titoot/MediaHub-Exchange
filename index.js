/* eslint-disable no-use-before-define */
require('dotenv').config();

if (process.env.NODE_ENV !== 'test') {
  require('./config/database').connect();
}
const express = require('express');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const path = require('path');
const Folder = require('./model/folders');
const Type = require('./model/type');
const utils = require('./utils');
const media = require('./fileParsing/media');
const UserController = require('./controllers/UserController');
const FolderController = require('./controllers/FolderController');
const FileController = require('./controllers/FileController');
const MediaController = require('./controllers/MediaController');

const app = express();

app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.set('views', path.join(__dirname, './public'));
app.use(cookieParser());
app.use(UserController.isLoggedIn);
app.use(FolderController.isOwned);
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  console.error({ message: err.message, error: err });
  res.status(err.statusCode).json({ status: err.statusCode, message: 'Internal Server Error' });
};

app.post('/login', UserController.Login);
app.post('/signup', UserController.Register);
app.get('/logout', UserController.logout);

app.post('/createFolder', FolderController.CreateFolder);
app.delete('/deleteFolder', FolderController.DeleteFolder);

app.post('/createFile', FileController.CreateFile);
app.post('/folderSync', FileController.folderSync);
app.delete('/deleteFile', FileController.DeleteFile);

app.post('/mediaSearch', MediaController.search);

app.get('/', async (req, res) => {
  const folder = await Folder.Folder.find({});
  let folders;
  if (folder) {
    folders = await Promise.all(
      folder.map(async (folderId) => insertFolder(folderId, false, req.path)),
    );
  }

  res.render('index', { folders, isLoggedIn: res.locals.isLoggedIn, isOwned: false });
});

app.get('/:folderName', async (req, res) => {
  const { folderName } = req.params;
  const folder = await Folder.Folder.findOne({ name: folderName });
  if (!folder) {
    res.status(404).send('Folder Not Found');
    return;
  }
  const folders = await Promise.all(
    folder.subfolders.map(async (folderId) => insertFolder(folderId, true, req.path, res.locals.isOwned)),
  );

  const files = await Promise.all(
    folder.files.map(async (fileId) => insertFiles(fileId, res.locals.isOwned)),
  );

  const struct = folders.concat(files);

  res.render('index', { folders: struct, isLoggedIn: res.locals.isLoggedIn, isOwned: res.locals.isOwned });
});

app.get('/:folderName/:subFolderName*?', async (req, res) => {
  const subfolder = await Folder.Subfolder.findOne({ path: utils.pathNormalize(req.path) });
  if (!subfolder) {
    res.status(404).send('Folder Not Found');
    return;
  }

  const folders = await Promise.all(
    subfolder.subfolders.map(async (folderId) => insertFolder(folderId, true, req.path, res.locals.isOwned)),
  );

  const filesArray = await Promise.all(
    subfolder.files.map(async (file) => {
      const fileDetails = await Folder.File.findById(file);

      return insertFiles(fileDetails, res.locals.isOwned);
    }),
  );

  const struct = folders.concat(filesArray);

  res.render('index', { folders: struct, isLoggedIn: res.locals.isLoggedIn, isOwned: res.locals.isOwned });
});

async function insertFolder(folderId, isSubFolder = false, routePath = null, isOwned = false) {
  const folder = isSubFolder ? await Folder.Subfolder.findById(folderId) : folderId;
  if (!folder) {
    throw new Error({ message: 'Folder not found' });
  }
  const name = isSubFolder ? `${routePath}/${folder.name}` : folder.name;
  const icon = isSubFolder ? 'folder' : 'person';

  // if MainFolder get user location
  return `
  <li class="list-item">
              <a gd-type="application/pdf" href="${utils.escapeHTML(name)}">
                <div class="baritem-1" title="${utils.escapeHTML(folder.name)}">
                  <i class="icon material-icons">${icon}</i>
                  ${utils.escapeHTML(folder.name)}
                </div>
                <div class="baritem-2">${utils.formatDate(folder.modifiedAt)}</div>
                <div class="baritem-3">-</div>
              </a>
              <div class="baritem-3">
              ${isOwned ? '<button class="folder-delete-button material-icons">folder_delete</button>' : '-'}
              </div>
            </li>
  `;
}
async function insertFiles(fileId, isOwned = false) {
  const file = await Folder.File.findById(fileId);
  if (!file) {
    throw new Error({ message: 'File not found' });
  }
  const fileType = file.typeModel;
  const contentDetails = await getContentDetails(fileType, file.contentDetails);
  return generateFileListItem(file, fileType, contentDetails, isOwned);
}

async function generateFileListItem(file, fileType, contentDetails, isOwned = false) {
  const fileIcon = setcommonAttributes(fileType);
  let mediaData;
  switch (fileType) {
    case 'Game':
      mediaData = contentDetails.description ? contentDetails : await media.getGameDetails(contentDetails.mediaId);
      break;
    case 'Movie':
      mediaData = contentDetails.description ? contentDetails : await media.getShowDetails(contentDetails.mediaId, MediaController.types.Movie);
      break;
    case 'Series':
    case 'Anime':
      mediaData = contentDetails.description ? contentDetails : await media.getShowDetails(contentDetails.mediaId, MediaController.types.Series);
      break;

    default:
      throw new Error('Invalid file type');
  }

  if (mediaData && !contentDetails.description) {
    const {
      description, headerImage, release, genre,
    } = mediaData;
    if (fileType === 'Series' || fileType === 'Anime') {
      const {
        seasons, episodes, status,
      } = mediaData;
      await contentDetails.set({
        mediaId: contentDetails.mediaId, description, headerImage, release, genre, seasons, episodes, status,
      }).save();
    } else {
      await contentDetails.set({
        mediaId: contentDetails.mediaId, description, headerImage, release, genre,
      }).save();
    }
  }

  return createFileElement(file, contentDetails, fileIcon, isOwned);
}

function createFileElement(file, mediaData, fileIcon, isOwned) {
  const commonAttributes = `
    <div class="baritem-1" title="${utils.escapeHTML(file.name)}">
      <i class="icon material-icons">${fileIcon}</i>
      ${utils.escapeHTML(file.name)}
    </div>
    <div class="baritem-2">${utils.formatDate(file.modifiedAt)}</div>
    <div class="baritem-3">${utils.escapeHTML(file.size)}</div>
  `;
  return `
  <li class="list-item">
    <a gd-type="application/pdf" onclick="showInfo('${utils.escapeHTML(file.name)}', \`${utils.escapeHTML(mediaData.description)}\`, '${mediaData.headerImage}', '${mediaData.mediaId}', '${utils.escapeHTML(file.size)}', '${mediaData.genre}', '${mediaData.release}', '${mediaData.seasons}', '${mediaData.episodes}', '${mediaData.status}')">
    <span hidden>${file.id}</span>
      ${commonAttributes}
    </a>
    <div class="baritem-3">
    ${isOwned ? '<button class="file-delete-button material-icons">delete</button>' : ''}
      <button class="info-button" onclick="showInfo('${utils.escapeHTML(file.name)}', \`${utils.escapeHTML(mediaData.description)}\`, '${mediaData.headerImage}', '${mediaData.mediaId}', '${utils.escapeHTML(file.size)}', '${mediaData.genre}', '${mediaData.release}', '${mediaData.seasons}', '${mediaData.episodes}', '${mediaData.status}')">
        <i class="icon material-icons">info_outline</i>
      </button>
    </div>
  </li>
`;
}

function setcommonAttributes(fileType) {
  switch (fileType) {
    case 'Game':
      return 'games';

    case 'Movie':
      return 'movie';

    case 'Series':
      return 'live_tv';
    case 'Anime':
      return 'sick';
    default:
      throw new Error('Invalid file type');
  }
}

async function getContentDetails(fileType, contentDetailsId) {
  switch (fileType) {
    case 'Game':
      return Type.Game.findById(contentDetailsId);

    case 'Movie':
      return Type.Movie.findById(contentDetailsId);

    case 'Series':
      return Type.Series.findById(contentDetailsId);

    case 'Anime':
      return Type.Anime.findById(contentDetailsId);

    default:
      throw new Error('Invalid file type');
  }
}

app.use(errorHandler);
app.set('view engine', 'ejs');

// Logic here

module.exports = app;
