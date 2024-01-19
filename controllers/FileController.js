/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const UserController = require('./UserController');
const { File, Folder, Subfolder } = require('../model/folders');
const { User } = require('../model/user');
const Type = require('../model/type');
const utils = require('../utils');
const { parseFile, formatBytes } = require('../fileParsing/bulk');
const { getMetaData } = require('./MediaController');

async function createFileCommon(req, res, next, user, FileType, NewFileName, FileParentPath, size, mediaId) {
  const isMainFile = user.username === FileParentPath.slice(1);
  const ParentPath = utils.pathNormalize(path.join(FileParentPath, NewFileName));
  const NormalizedParentPath = utils.pathNormalize(FileParentPath);

  const existingFile = await File.findOne({
    owner: user._id,
    path: ParentPath,
  });

  if (existingFile) {
    return {
      success: false,
      message: "Can't Create a Duplicate File In the Same Folder",
      statusCode: 409,
    };
  }
  let contentDetails;
  let existingDetails;

  switch (FileType) {
    case 'Game':
    case 'Movie':
    case 'Series':
    case 'Anime':
      existingDetails = await Type[FileType].findOne({ mediaId });
      contentDetails = existingDetails || await Type[FileType].create({ mediaId });
      break;
    default:
      next(new Error('Invalid FileType'));
  }

  if (isMainFile) {
    const folder = await Folder.findOne({ name: user.username });
    const file = await File.create({
      name: NewFileName,
      path: ParentPath,
      owner: user._id,
      size: size || '-',
      typeModel: FileType,
      contentDetails,
    });
    await folder.updateOne({ $push: { files: file } });

    return { success: true, message: 'File Created Successfully', statusCode: 201 };
  }

  const levelCheck = await Subfolder.findOne({ owner: user._id, path: NormalizedParentPath });
  if (!levelCheck) {
    return { success: false, message: 'File Must Be Created Under An Existing Folder', statusCode: 409 };
  }

  if (!FileParentPath.includes(user.username)) {
    return { success: false, message: 'Files Must Be Created Under Your Own Ownership Only!', statusCode: 401 };
  }

  const file = await File.create({
    name: NewFileName,
    path: ParentPath,
    owner: user._id,
    size: size || '-',
    typeModel: FileType,
    contentDetails,
  });

  await levelCheck.updateOne({ $push: { files: file } });

  return 0;
}

exports.CreateFile = async (req, res, next) => {
  const {
    FileParentPath, NewFileName, FileType, size, mediaId,
  } = req.body;

  if (!(FileParentPath && NewFileName && FileType)) {
    return res.status(400).json({ success: false, message: 'All Field Inputs Are Required' });
  }
  const FileTypes = ['Game', 'Movie', 'Series', 'Anime'];

  if (!FileTypes.includes(FileType)) {
    return res.status(400).json({ success: false, message: 'Please Select a Valid File Type' });
  }

  const token = req.cookies.access_token;
  const isLoggedIn = await UserController.isLoggedInF(token);
  if (!isLoggedIn) {
    return res.status(401).json({ success: false, message: 'User Unauthenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    const user = await User.findById(decoded.userId);

    const { success, message, statusCode } = await createFileCommon(req, res, next, user, FileType, NewFileName, FileParentPath, size, mediaId);

    if (statusCode) {
      return res.status(statusCode).json({ success, message });
    }

    return res.status(201).json({ success: true, message: 'File Created Successfully' });
  } catch (brr) {
    next(brr);
  }
};

exports.folderSync = async (req, res, next) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];

  const token = req.cookies.access_token || req.headers.authorization.split(' ')[1];
  const isLoggedIn = await UserController.isLoggedInF(token);
  let user;
  if (!isLoggedIn) {
    return res.status(401).json({ success: false, message: 'User Unauthenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    user = await User.findById(decoded.userId);
  } catch (brr) {
    next(brr);
  }

  const errors = [];

  const promises = items.map(async (item) => {
    const {
      srvPath, fileName, size, fileType,
    } = item;

    if (!(srvPath && fileName && size && fileType)) {
      errors.push({
        success: false, message: 'All Field Inputs Are Required', fileName, statusCode: 400,
      });
    }
    const FileTypes = ['Game', 'Movie', 'Series', 'Anime'];

    if (!FileTypes.includes(fileType)) {
      errors.push({
        success: false, message: 'Please Select a Valid File Type', fileName, statusCode: 400,
      });
    }

    const parsedFileName = parseFile(fileName);

    const metadata = (await getMetaData(parsedFileName, fileType, next))[0];

    if (!metadata) {
      errors.push({
        success: false, message: 'Searched Media Not Found', fileName, statusCode: 404,
      });
      return;
    }

    const formatedSize = formatBytes(size);

    const { success, message, statusCode } = await createFileCommon(req, res, next, user, fileType, metadata.name, srvPath, formatedSize, metadata.mediaId);
    if (statusCode) {
      errors.push({
        success, message, fileName, parsedfileName: metadata.name, statusCode,
      });
    }
  });

  await Promise.all(promises);

  return res.status(201).json({ success: true, message: 'File/Files Synced Successfully', errors });
};

exports.DeleteFile = async (req, res, next) => {
  const { FileId } = req.body;

  if (!(FileId)) {
    return res.status(400).json({ success: false, message: 'All Field Inputs Are Required' });
  }

  const token = req.cookies.access_token;
  const isLoggedIn = await UserController.isLoggedInF(token);
  if (!isLoggedIn) {
    return res.status(401).json({ success: false, message: 'User Unauthenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    const user = await User.findById(decoded.userId);

    const fileToDelete = await File.findOne({ _id: new mongoose.Types.ObjectId(FileId), owner: user._id });

    const contentToDelete = await Type.Game.deleteOne({ _id: fileToDelete.contentDetails });

    const deletedfile = await Subfolder.updateOne({ files: { $in: fileToDelete._id } }, { $pull: { files: fileToDelete._id } });

    const mainFolder = await Folder.findById(user.OwnedFolder);

    const folder = await mainFolder.updateOne({ $pull: { files: fileToDelete._id } });

    await fileToDelete.deleteOne();

    return res.status(200).json({ success: true, message: 'File Deleted Sucessfully' });
  } catch (brr) {
    next(brr);
  }
};
