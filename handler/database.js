import mongoose from "mongoose";

export default (CONN_STRING, logger) =>
  mongoose
    .connect(CONN_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => logger.info("[DB] Connected"))
    .catch((error) => {
      logger.error({ message: "[DB] An Error has Encountered", error });
      process.exit();
    });
