import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

class ApiResponse {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
  }

  success(data: any, message: string = "Success") {
    return this.res.status(StatusCodes.OK).json({
      success: true,
      message,
      data,
    });
  }

  error(status: number = StatusCodes.BAD_REQUEST, error: string = "Error") {
    return this.res.status(status).json({
      success: false,
      error,
    });
  }
}

export default ApiResponse;
