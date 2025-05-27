import mongoose from "mongoose";

export default () => {
  mongoose
    .connect(process.env.DBURL_PROD)
    .then(() => {
      console.log("Database Connected");
    })
    .catch((err) => {
      console.log(err);
    });
};
