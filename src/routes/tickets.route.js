import express from "express";
import { body } from "express-validator";
import requestHandler from "../handlers/request.handler.js";
import ticketsController from "../controllers/tickets.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.post(
  "/",
  [
    body("adultCount").notEmpty(),
    body("childCount").notEmpty(),
    body("totalPrice").notEmpty(),
    body("visitDate").notEmpty(),
  ],
  requestHandler.validate,
  tokenMiddleware.auth,
  ticketsController.bookTickets
);

router.get("/timetables", ticketsController.getAllTimeTables);

router.post(
  "/pay/:ticketId",
  [
    body("ticketName").notEmpty(),
    body("price").notEmpty(),
    body("quantity").notEmpty(),
  ],
  requestHandler.validate,
  tokenMiddleware.auth,
  ticketsController.payForTicketByTicketId
);

router.put(
  "/:ticketId",
  [body("status").notEmpty()],
  requestHandler.validate,
  tokenMiddleware.auth,
  ticketsController.updateTicketStatus
);

router.delete(
  "/:ticketId",
  tokenMiddleware.auth,
  ticketsController.deleteUserTicket
);

router.get(
  "/user-tickets",
  tokenMiddleware.auth,
  ticketsController.getUserTickets
);

router.get(
  "/visitor-reports",
  tokenMiddleware.auth,
  ticketsController.getVisitorReports
);

export default router;
