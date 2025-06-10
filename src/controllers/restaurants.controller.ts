import type { Request, Response } from "express";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantKeyById,
  reviewDetailsKeyById,
  reviewKeyById,
  restaurantKeyIdByCuisine,
} from "../utils/keys.js";
import ApiResponse from "../utils/responses.js";
import type { Review } from "../schemas/review.schema.js";
import { StatusCodes } from "http-status-codes";
class RestaurantsController {
  static async create(req: Request, res: Response) {
    const { name, location, cuisines } = req.body;

    const client = await initializeRedisClient();
    const id = nanoid(5);
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name, location };

    await Promise.all([
      ...cuisines.map((cuisine: string) => {
        return Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantKeyIdByCuisine(id), cuisine),
        ]);
      }),
      client.hSet(restaurantKey, hashData),
    ]);

    new ApiResponse(res).success(hashData, "Restaurant created successfully");
  }

  static async get(req: Request<{ restaurantId: string }>, res: Response) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();

    const restaurantKey = restaurantKeyById(restaurantId!);

    const [viewCount, restaurant, cuisines] = await Promise.all([
      client.hIncrBy(restaurantKey, "viewCount", 1),
      client.hmGet(restaurantKey, ["id", "name"]),
      client.SMEMBERS(restaurantKeyIdByCuisine(restaurantId!)),
    ]);

    new ApiResponse(res).success(
      { ...restaurant, viewCount, cuisines },
      "Restaurant details"
    );
  }

  static async addReview(
    req: Request<{ restaurantId: string }>,
    res: Response
  ) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();
    const reviewId = nanoid(5);

    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);

    const data = req.body as Review;
    const reviewData = {
      id: reviewId,
      ...data,
      timestamp: Date.now(),
      restaurantId,
    };

    await Promise.all([
      client.lPush(reviewKey, reviewId),
      client.hSet(reviewDetailsKey, reviewData),
    ]);

    new ApiResponse(res).success(reviewData, "Review added successfully");
  }

  static async getReviews(
    req: Request<{ restaurantId: string }>,
    res: Response
  ) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();

    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;

    const reviewKey = reviewKeyById(restaurantId);
    const reviewIds = await client.lRange(reviewKey, start, end);

    console.log(reviewIds);
    const reviews = await Promise.all(
      reviewIds.map(async (id) => client.hGetAll(reviewDetailsKeyById(id)))
    );

    new ApiResponse(res).success(reviews, "Reviews");
  }

  static async deleteReview(
    req: Request<{ restaurantId: string; reviewId: string }>,
    res: Response
  ) {
    const { restaurantId, reviewId } = req.params;

    const client = await initializeRedisClient();

    const reviewKey = reviewKeyById(restaurantId);
    const reviewDetailsKey = reviewDetailsKeyById(reviewId);

    const [removeResult, deleteResult] = await Promise.all([
      client.lRem(reviewKey, 0, reviewId),
      client.del(reviewDetailsKey),
    ]);

    if (removeResult === 0 && deleteResult === 0) {
      new ApiResponse(res).error(StatusCodes.NOT_FOUND, "Review not found");
      return;
    }

    new ApiResponse(res).success(reviewId, "Review deleted successfully");
  }


}

export default RestaurantsController;
