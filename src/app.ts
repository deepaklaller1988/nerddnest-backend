import dotenv from "dotenv";
// dotenv.config({ path: '.env.local' });
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

console.log(process.env.NODE_ENV);

import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";

import sequelize from "./db/dbConnect";
import setInterface from "./middlewares/interface";
import logging from "./middlewares/logging";
import "./utils/redis/workers/posts.worker"

import authRouter from "./router/auth";
import fileRouter from './router/upload';
import postRouter from './router/posts';
import friendRouter from './router/connections';
import storyRouter from './router/stories';
import moment from "moment";

const PORT = process.env.PORT;
const app = express();

const connectToDb = async () => {
    const data = await sequelize.sync({ force: false })
    try {
      await sequelize.authenticate();
        console.log("Database Connected successfully.");
        const used = process.memoryUsage();
        console.log(`Memory usage: ${JSON.stringify(used)}`);
        console.log("Current Server Time", moment());
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var corsOptions = {
    origin: function (origin: any, callback: any) {
        callback(null, true);
    },
    credentials: true,
};

app.use(cors(corsOptions));

app.use(cookieParser());
app.use(setInterface);
app.use(logging);

app.use("/auth", authRouter);
app.use("/file", fileRouter);
app.use("/posts", postRouter);
app.use("/friends", friendRouter);
app.use("/story", storyRouter);

// app.use((req, res) => {
//     res.status(404).json({ message: "Route not found" });
// });

app.listen(PORT, () => {
    connectToDb();
    console.log(`Server started on port ${PORT}`);
})