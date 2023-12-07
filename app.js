const http = require("http");
const app = require("./index");
const utils = require("./utils");
const server = http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;


const startServer = async () => {

  //await utils.updateSteamIds();

  const fetchInterval = 24 * 60 * 60 * 1000; // 24 hours


  setInterval(async () => {
    await utils.updateSteamIds();
  }, fetchInterval);

  // server listening
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};


startServer();
