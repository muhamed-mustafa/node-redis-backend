import type { Request, Response } from "express";
import { initializeRedisClient } from "../utils/client.js";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys.js";
import ApiResponse from "../utils/responses.js";
class CuisinesController {
  static async getCuisines(_req: Request, res: Response) {
    const client = await initializeRedisClient();

    const cuisines = await client.sMembers(cuisinesKey);

    new ApiResponse(res).success(cuisines, "Cuisines");
  }

  static async getCuisine(req: Request<{ cuisine: string }>, res: Response) {
    const { cuisine } = req.params;

    const client = await initializeRedisClient();

    const restaurantIds = await client.sMembers(cuisineKey(cuisine));

    const restaurants = await Promise.all(
      restaurantIds.map(async (id) => client.hGet(restaurantKeyById(id), 'name'))
    );

    new ApiResponse(res).success(restaurants, "Cuisine Restaurants");
  }
}

export default CuisinesController;
