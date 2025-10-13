import { Request } from "express";
import { PostAvailabilltyEunm } from "../DataBase/models/post.model";

export function getAvailabilityQuery(req: Request) {
  const userId = (req as any).user?._id; 

  return [
    { availabillty: PostAvailabilltyEunm.public },
    { availabillty: PostAvailabilltyEunm.friends, createdBy: userId }
  ];
}
