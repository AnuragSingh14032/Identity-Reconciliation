import { Request, Response } from "express";
import { identifyService } from "../services/identify.service";

export const identifyHandler = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    const result = await identifyService(email, phoneNumber);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
};