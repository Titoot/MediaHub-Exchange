require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, './public'))

app.get('/', (req, res) => {
    var title = "Sharing Site"
    var favicon = "https://raw.githubusercontent.com/cheems/goindex-extended/master/images/favicon-x.png"
    var folders = '["Folder","Personal Drive II"]'
    var model = '{"root_type":2}'
    res.render('index', {title: title, favicon: favicon, folders: folders, model: model, spinner: removeSpinner()});
  });

function removeSpinner() {
  return '$("#list").html(`<div class="mdui-progress"><div class="mdui-progress-indeterminate"></div></div>`).remove();'
}
app.set('view engine', 'ejs');

// Logic here

module.exports = app;