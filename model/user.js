const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new mongoose.Schema({
  username: { type: String, maxLength: 20, unique: true },
  password: { type: String, default: null },
  OwnedFolder: { type: Schema.Types.ObjectId, default: null },
});

const User = mongoose.model('user', userSchema);

module.exports = { User };
