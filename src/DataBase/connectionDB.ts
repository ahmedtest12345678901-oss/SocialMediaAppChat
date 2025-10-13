import mongoose from "mongoose";

export const connectionDB = () => {
  mongoose
    .connect(process.env.URL_DB as unknown as string)
    .then(() => {
      console.log(" Successfully to connect DataBase ..............");
    })
    .catch((error) => {
      console.error(" Failed to connect to DataBase:", error);
    });
};

export default connectionDB;
