import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodSchema } from "zod";

export const validate = <T>(schema: ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(StatusCodes.BAD_REQUEST).json(result.error.errors);
      return;
    }

    req.body = result.data;

    next();
  };
};
