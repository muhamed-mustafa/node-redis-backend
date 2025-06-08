import type {
  ErrorRequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import ApiResponse from "../utils/responses.js";
import { StatusCodes } from "http-status-codes";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  new ApiResponse(res).error(StatusCodes.INTERNAL_SERVER_ERROR, err.message);
};
