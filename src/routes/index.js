import express from "express";
import usersRoute from "./users.route.js";
import ticketsRoute from "./tickets.route.js";

const router = express.Router();

router.use("/users", usersRoute);
router.use("/tickets", ticketsRoute);

export default router;
