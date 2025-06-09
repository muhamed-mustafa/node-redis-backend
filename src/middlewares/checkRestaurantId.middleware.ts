import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { initializeRedisClient } from "../utils/client.js";
import { restaurantKeyById } from "../utils/keys.js";
import ApiResponse from "../utils/responses.js";

export const checkRestaurantIdExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { restaurantId: id } = req.params;

  if (!id) {
    new ApiResponse(res).error(
      StatusCodes.BAD_REQUEST,
      "Missing Restaurant id"
    );
    return;
  }

  const client = await initializeRedisClient();
  const result = await client.exists(restaurantKeyById(id));

  if (!result) {
    new ApiResponse(res).error(StatusCodes.NOT_FOUND, "Restaurant not found");
    return;
  }

  next();
};
