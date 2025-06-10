import express from "express";
import RestaurantsController from "../controllers/restaurants.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { RestaurantSchema } from "../schemas/restaurant.schema.js";
import { checkRestaurantIdExists } from "../middlewares/checkRestaurantId.middleware.js";
import { ReviewSchema } from "../schemas/review.schema.js";
export class RestaurantsRoutes {
  static routes() {
    const router = express.Router();

    router.post("/", validate(RestaurantSchema), RestaurantsController.create);

    router.get("/ratings", RestaurantsController.getRestaurantsByRating);

    router.get(
      "/:restaurantId",
      checkRestaurantIdExists,
      RestaurantsController.get
    );

    router.post(
      "/:restaurantId/reviews",
      validate(ReviewSchema),
      checkRestaurantIdExists,
      RestaurantsController.addReview
    );

    router.get(
      "/:restaurantId/reviews",
      checkRestaurantIdExists,
      RestaurantsController.getReviews
    );

    router.delete(
      "/:restaurantId/reviews/:reviewId",
      checkRestaurantIdExists,
      RestaurantsController.deleteReview
    );

    return router;
  }
}

export default RestaurantsRoutes.routes();
