const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  content: String,
  size: { type: String, default: '-' },
  typeModel: {
    type: String,
    enum: ['Game', 'Movie', 'Series', 'Anime'],
  },
  contentDetails: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'typeModel',
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const subfolderSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File', // Reference to the File model
  }],
  subfolders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subfolder',
    default: null
  }],
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const Subfolder = mongoose.model('Subfolder', subfolderSchema);

const folderSchema = new mongoose.Schema({
  name: {type: String, unique: true},
  //Owner: { type: mongoose.Schema.Types.ObjectId, default: null },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  }],
  subfolders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subfolder',
    default: null
  }],
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

const File = mongoose.model('File', fileSchema);
const Folder = mongoose.model('Folder', folderSchema);

module.exports = { File, Folder, Subfolder };
