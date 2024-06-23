import express from "express";
import { body } from "express-validator";
import requestHandler from "../handlers/request.handler.js";
import ticketsController from "../controllers/tickets.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.get("/timetables", ticketsController.getAllTimeTables);

router.get(
  "/visitor-reports",
  tokenMiddleware.auth,
  ticketsController.getVisitorReports
);

router.post(
  "/pay/:ticketId",
  [
    body("ticketName").notEmpty(),
    body("price").notEmpty(),
    body("quantity").notEmpty(),
  ],
  requestHandler.validate,
  ticketsController.payForTicketByTicketId
);

router.get(
  "/booking-code/:bookingCode",
  tokenMiddleware.auth,
  ticketsController.getTicketIdByBookingCode
);

router.post(
  "/",
  [
    body("adultCount").notEmpty(),
    body("childCount").notEmpty(),
    body("totalPrice").notEmpty(),
    body("visitDate").notEmpty(),
    body("buyerName").notEmpty().withMessage("Buyer name is required"),
    body("buyerEmail")
      .notEmpty()
      .withMessage("Buyer email is required")
      .isEmail()
      .withMessage("Buyer email is invalid"),
    body("buyerPhoneNumber")
      .notEmpty()
      .withMessage("Buyer phone number is required")
      .isMobilePhone()
      .withMessage("Buyer phone number is invalid"),
  ],
  requestHandler.validate,
  ticketsController.bookTickets
);

router.get("/", ticketsController.getAllTickets);

router.get("/:ticketId", ticketsController.getTicketByTicketId);

router.put(
  "/:ticketId",
  [body("status").notEmpty()],
  requestHandler.validate,
  ticketsController.updateTicketStatus
);

router.delete("/:ticketId", ticketsController.cancelTicket);

export default router;
