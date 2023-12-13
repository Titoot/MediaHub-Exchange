const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: String,
  content: String,
  path: { type: String, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
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

fileSchema.pre('save', function (next) {
  this.modifiedAt = Date.now();
  next();
});

fileSchema.pre('updateOne', function (next) {
  this.modifiedAt = Date.now();
  next();
});

const subfolderSchema = new mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, required: true },
  path: { type: String, unique: true },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File', // Reference to the File model
  }],
  subfolders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subfolder',
    default: null,
  }],
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

subfolderSchema.pre('save', function (next) {
  this.modifiedAt = Date.now();
  next();
});

subfolderSchema.pre('updateOne', function (next) {
  this.modifiedAt = Date.now();
  next();
});

const Subfolder = mongoose.model('Subfolder', subfolderSchema);

const folderSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  files: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null,
  }],
  subfolders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subfolder',
    default: null,
  }],
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

folderSchema.pre('save', function (next) {
  this.modifiedAt = Date.now();
  next();
});

folderSchema.pre('updateOne', function (next) {
  this.modifiedAt = Date.now();
  next();
});

const File = mongoose.model('File', fileSchema);
const Folder = mongoose.model('Folder', folderSchema);

module.exports = { File, Folder, Subfolder };
