const jwt = require('jsonwebtoken');
const path = require('path');
const UserController = require('./UserController');
const { Folder, Subfolder, File } = require('../model/folders');
const { User } = require('../model/user');
const utils = require('../utils');

exports.CreateFolder = async (req, res) => {
  const { FolderParentPath, NewFolderName } = req.body;

  if (!(FolderParentPath && NewFolderName)) {
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

    const isMainFolder = user.username === FolderParentPath.slice(1);
    const ParentPath = utils.pathNormalize(path.join(FolderParentPath, NewFolderName));
    const NormalizedParentPath = utils.pathNormalize(FolderParentPath);

    const existingFolder = await Subfolder.findOne({
      owner: user._id,
      path: ParentPath,
    });

    if (existingFolder) {
      return res.status(409).json({
        success: false,
        message: "Can't Create a Duplicate Folder In the Same Folder",
      });
    }

    if (isMainFolder) {
      const folder = await Folder.findOne({ name: user.username });
      const subfolder = await Subfolder.create({
        name: NewFolderName,
        files: [],
        path: ParentPath,
        owner: user._id,
      });
      await folder.updateOne({ $push: { subfolders: subfolder } });

      return res.status(201).json({ success: true, message: 'Folder Created Successfully' });
    }

    const levelCheck = await Subfolder.findOne({ owner: user._id, path: NormalizedParentPath });
    if (!levelCheck) {
      return res.status(409).json({ success: false, message: 'Folder Must Be Created Under An Existing Folder' });
    }

    if (!FolderParentPath.includes(user.username)) {
      return res.status(401).json({ success: false, message: 'Folders Must Be Created Under Your Own Ownership Only!' });
    }

    const subfolder = await Subfolder.create({
      name: NewFolderName,
      files: [],
      path: ParentPath,
      owner: user._id,
    });

    await levelCheck.updateOne({ $push: { subfolders: subfolder } });

    return res.status(201).json({ success: true, message: 'Folder Created Successfully' });
  } catch (brr) {
    console.error(brr);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};

exports.DeleteFolder = async (req, res) => {
  const { FolderPath } = req.body;

  if (!(FolderPath)) {
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

    const NormalizedPath = new RegExp(utils.escapeRegExp(utils.pathNormalize(FolderPath)));

    const subfoldersToDelete = await Subfolder.find({ owner: user._id, path: { $regex: NormalizedPath } }).select('_id');
    const subfilesToDelete = await File.find({ owner: user._id, path: { $regex: NormalizedPath } }).select('_id');

    // Extract IDs from the result
    const subfolderIds = subfoldersToDelete.map((subfolder) => subfolder._id);
    const subfileIds = subfilesToDelete.map((subfile) => subfile._id);

    // Delete the documents using the IDs
    const deletedSubfolders = await Subfolder.deleteMany({ _id: { $in: subfolderIds } });
    const deletedSubfiles = await File.deleteMany({ _id: { $in: subfileIds } });

    const mainFolder = await Folder.findById(user.OwnedFolder);

    await mainFolder.updateOne({ $pullAll: { subfolders: subfolderIds } });

    return res.status(200).json({ success: true, message: 'Folder recursively Deleted Sucessfully' });
  } catch (brr) {
    next(brr);
  }
};

exports.isOwned = async (req, res, next) => {
  const token = req.cookies.access_token;
  const isLoggedIn = await UserController.isLoggedInF(token);

  if (!isLoggedIn) {
    res.locals.isOwned = false;
    next();
    return;
  }

  const decoded = jwt.verify(token, process.env.TOKEN_KEY);
  const user = await User.findById(decoded.userId);

  if (!req.path.includes(user.username)) {
    res.locals.isOwned = false;
    next();
    return;
  }

  res.locals.isOwned = true;
  next();
};
