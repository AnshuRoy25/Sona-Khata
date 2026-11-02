import config from "./config/config.js";
import app from "./app.js";
import connectDB from "./config/db.js";

async function start() {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

start();