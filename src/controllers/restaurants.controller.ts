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
  restaurantsByRatingKey,
  weatherKeyById,
  restaurantDetailsKeyById,
  indexKey,
  bloomKey,
} from "../utils/keys.js";
import ApiResponse from "../utils/responses.js";
import type { Review } from "../schemas/review.schema.js";
import { StatusCodes } from "http-status-codes";
import type { RestaurantDetails } from "../schemas/restaurant.schema.js";

class RestaurantsController {
  static async create(req: Request, res: Response) {
    const { name, location, cuisines } = req.body;

    const client = await initializeRedisClient();
    const id = nanoid(5);
    const bloomString = `${name}:${location}`;
    const isExists = await client.bf.exists(bloomKey, bloomString);

    if (isExists) {
      new ApiResponse(res).error(
        StatusCodes.CONFLICT,
        "Restaurant already exists"
      );
      return;
    }
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name, location };

    await Promise.all([
      ...cuisines.map((cuisine: string) => {
        return Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantKeyIdByCuisine(id), cuisine),
          client.zAdd(restaurantsByRatingKey, {
            score: 0,
            value: id,
          }),
        ]);
      }),
      client.hSet(restaurantKey, hashData),
      client.bf.add(bloomKey, bloomString),
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

    const [reviewCount, _, totalStars] = await Promise.all([
      client.lPush(reviewKey, reviewId),
      client.hSet(reviewDetailsKey, reviewData),
      client.hIncrByFloat(
        restaurantKeyById(restaurantId),
        "totalStars",
        data.rating
      ),
    ]);

    const averageRating = Number(
      (Number(totalStars) / Number(reviewCount)).toFixed(1)
    );

    await Promise.all([
      client.hSet(
        restaurantKeyById(restaurantId),
        "averageRating",
        averageRating
      ),
      client.zAdd(restaurantsByRatingKey, {
        score: averageRating,
        value: restaurantId,
      }),
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

  static async getRestaurantsByRating(req: Request, res: Response) {
    const client = await initializeRedisClient();

    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;

    const restaurantsIds = await client.zRange(
      restaurantsByRatingKey,
      start,
      end,
      {
        REV: true,
      }
    );

    const restaurants = await Promise.all(
      restaurantsIds.map(async (id) =>
        client.hGet(restaurantKeyById(id), "name")
      )
    );

    new ApiResponse(res).success(restaurants, "Restaurants by rating");
  }

  static async getRestaurantWeather(
    req: Request<{ restaurantId: string }>,
    res: Response
  ) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();
    const weatherKey = weatherKeyById(restaurantId);
    const cachedWeather = await client.get(weatherKey);

    if (cachedWeather) {
      new ApiResponse(res).success(JSON.parse(cachedWeather), "Weather data");
      return;
    }

    const coordinates = await client.hGet(
      restaurantKeyById(restaurantId),
      "location"
    );

    if (!coordinates) {
      new ApiResponse(res).error(StatusCodes.NOT_FOUND, "Restaurant not found");
      return;
    }

    console.log(coordinates);

    const [lat, lng] = coordinates.split(",");
    const apiResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?units=imperial&lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`
    );

    console.log(apiResponse);

    if (apiResponse.status === StatusCodes.OK) {
      const weatherData = await apiResponse.json();
      await client.setEx(weatherKey, 3600, JSON.stringify(weatherData));
      new ApiResponse(res).success(weatherData, "Weather data");
    }
  }

  static async addRestaurantDetails(
    req: Request<{ restaurantId: string }>,
    res: Response
  ) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();

    const data = req.body as RestaurantDetails;

    const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);

    await client.json.set(restaurantDetailsKey, ".", data);

    new ApiResponse(res).success(data, "Restaurant details added successfully");
  }

  static async getRestaurantDetails(
    req: Request<{ restaurantId: string }>,
    res: Response
  ) {
    const { restaurantId } = req.params;

    const client = await initializeRedisClient();

    const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId);

    const data = await client.json.get(restaurantDetailsKey);

    new ApiResponse(res).success(data, "Restaurant details");
  }

  static async search(req: Request, res: Response) {
    const client = await initializeRedisClient();

    const { q = "" } = req.query;

    const searchResults = await client.ft.search(indexKey, `@name:*${q}*`);

    new ApiResponse(res).success(searchResults, "Search results");
  }
}

export default RestaurantsController;
