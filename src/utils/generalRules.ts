import mongoose from "mongoose";
import z, { email } from "zod";

export const generalRules = {
    id: z.string().refine((value) => {
        return mongoose.Types.ObjectId.isValid(value)
    }, { message: "inValid user id" }),
    email: z.email(),
    password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
    otp: z.string().regex(/^[0-9]{6}$/),
    file: z.object({
        fieldname: z.string(),
        orginalname: z.string().optional(),
        encoding: z.string(),
        buffer: z.any().optional(),
        path: z.string().optional(),
        size: z.number()
    })
}