const http = require('http');
const app = require('./index');

const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

const startServer = async () => {
  // server listening
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  module.exports = server;
};

startServer();
