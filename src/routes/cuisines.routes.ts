import express from "express";
import CuisinesController from "../controllers/cuisines.controller.js";

export class CuisinesRoutes {
  static routes() {
    const router = express.Router();

    router.get("/", CuisinesController.getCuisines);

    router.get("/:cuisine", CuisinesController.getCuisine);
    
    return router;
  }
}

export default CuisinesRoutes.routes();
