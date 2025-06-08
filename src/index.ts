import express from "express";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

class Application {
  app: express.Application;

  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.app.use(express.json());
  }
  routes() {
    this.app.use(errorHandler);
  }
  start() {
    const PORT = process.env.PORT || 3000;
    const ENV = process.env.NODE_ENV || "development";
    this.app
      .listen(PORT, () => {
        console.log(
          `\x1b[36m🚀 Server is running at http://localhost:${PORT} [${ENV} mode]\x1b[0m`
        );
      })
      .on("error", (err) => {
        console.log(err);
        throw new Error(err.message);
      });
  }
}

const app = new Application();
app.start();

export default app.app;
