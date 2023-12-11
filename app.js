const http = require("http");
const app = require("./index");
const utils = require("./utils");
const server = http.createServer(app);
const fs = require('fs');

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;


const startServer = async () => {
  // server listening
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  module.exports = server
};

startServer();
