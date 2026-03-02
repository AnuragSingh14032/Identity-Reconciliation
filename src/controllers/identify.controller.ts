import { Request, Response } from "express";

export const identifyHandler = async (req: Request, res: Response) => {
  res.status(200).json({ message: "Endpoint working" });
};