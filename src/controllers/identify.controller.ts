import { Request, Response } from "express";
import { identifyService } from "../services/identify.service";

export const identifyHandler = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        error: "At least one of email or phoneNumber is required",
      });
    }

    const result = await identifyService(email, phoneNumber);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
};