const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: String,
  content: String
});

const folderSchema = new mongoose.Schema({
  name: String,
  files: [fileSchema],
  subfolders: { type: mongoose.Schema.Types.Mixed, default: [] }
});

module.exports = mongoose.model('Folder', folderSchema);