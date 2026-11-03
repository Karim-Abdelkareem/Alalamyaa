import mongoose from "mongoose";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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

