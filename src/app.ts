import express from 'express';
import cors from "cors";
import setInterface from "./middlewares/interface";
import authRouter from "./routes/auth.routers";

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
var corsOptions = {
    origin: function (origin: any, callback: any) {
        callback(null, true);
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.use(setInterface);

app.use("/api/v1/auth", authRouter);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})