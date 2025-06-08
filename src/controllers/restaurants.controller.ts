import type { Request, Response } from "express";
class RestaurantsController {
  static async create(req: Request, res: Response) {
    res.send("create");
  }
}

export default RestaurantsController;
