import express from "express";
import { body } from "express-validator";
import * as ticketsController from "../controllers/tickets.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.get("/timetables", ticketsController.getAllTimeTables);

router.get(
  "/visitor-reports",
  tokenMiddleware.auth,
  ticketsController.getVisitorReports
);

router.get(
  "/booking-code/:bookingCode",
  tokenMiddleware.auth,
  ticketsController.getTicketIdByBookingCode
);

router.put(
  "/cancel/:ticketId",
  tokenMiddleware.auth,
  ticketsController.cancelTicket
);

router.get(
  "/paid-tickets",
  tokenMiddleware.auth,
  ticketsController.getPaidTickets
);

router.put(
  "/pay/:ticketId",
  [body("proofOfPaymentURL").notEmpty()],
  ticketsController.payForTicket
);

router.put(
  "/confirm/:ticketId",
  tokenMiddleware.auth,
  ticketsController.confirmTicket
);

router.get(
  "/pending-tickets",
  tokenMiddleware.auth,
  ticketsController.getPendingTicketsOverOneHour
);

//
router.post(
  "/",
  [
    body("adultCount").notEmpty(),
    body("childCount").notEmpty(),
    body("carCount").notEmpty(),
    body("motorcycleCount").notEmpty(),
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

router.delete("/:ticketId", ticketsController.deleteTicket);

export default router;
