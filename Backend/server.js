import config from "./src/config/server.config.js";
import server from "./src/app.js";

const start = async () => {
  server.listen(config.PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${config.PORT}`);
  });
};

start();
