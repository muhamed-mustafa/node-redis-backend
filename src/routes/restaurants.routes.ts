import express from "express";
import RestaurantsController from "../controllers/restaurants.controller.js";
import { validate} from "../middlewares/validate.middleware.js";
import { RestaurantSchema } from "../schemas/restaurant.schema.js";
export class RestaurantsRoutes {
  static routes() {
      const router = express.Router();
      
    router.post("/", validate(RestaurantSchema), RestaurantsController.create);
    
    return router;
  }
}

export default RestaurantsRoutes.routes();
