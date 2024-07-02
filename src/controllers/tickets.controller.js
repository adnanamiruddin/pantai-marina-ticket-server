import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  TicketsTable,
  TimetablesTable,
  TransactionsTable,
} from "../config/config.js";
import responseHandler from "../handlers/response.handler.js";
import Ticket from "../models/Ticket.js";
import Transaction from "../models/Transaction.js";
import Timetable from "../models/Timetable.js";
import { toZonedTime } from "date-fns-tz";
import { addMinutes, isBefore } from "date-fns";

export const getAllTimeTables = async (req, res) => {
  try {
    const timetables = [];
    const timetablesSnapshot = await getDocs(TimetablesTable);
    timetablesSnapshot.forEach((doc) => {
      timetables.push(Timetable.toFormattedObject(doc));
    });

    return responseHandler.ok(res, timetables);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getVisitorReports = async (req, res) => {
  try {
    const timetables = [];
    const timetablesSnapshot = await getDocs(TimetablesTable);
    for (const doc of timetablesSnapshot.docs) {
      const timetable = Timetable.toFormattedObject(doc);

      let adultCount = 0;
      let childCount = 0;
      let totalVisitors = adultCount + childCount;
      const ticketsSnapshot = await getDocs(
        query(TicketsTable, where("visitDate", "==", timetable.visitDate))
      );
      ticketsSnapshot.forEach((ticket) => {
        const ticketData = ticket.data();
        adultCount += ticketData.adultCount;
        childCount += ticketData.childCount;
        totalVisitors += ticketData.adultCount + ticketData.childCount;
      });
      timetable.adultCount = adultCount;
      timetable.childCount = childCount;
      timetable.totalVisitors = totalVisitors;

      timetables.push(timetable);
    }

    return responseHandler.ok(res, timetables);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getTicketIdByBookingCode = async (req, res) => {
  try {
    const { bookingCode } = req.params;

    const ticketRef = query(
      TicketsTable,
      where("bookingCode", "==", bookingCode)
    );
    const ticketSnap = await getDocs(ticketRef);
    if (ticketSnap.empty)
      return responseHandler.badRequest(res, "Tiket tidak ditemukan");

    responseHandler.ok(res, ticketSnap.docs[0].id);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const cancelTicket = async (req, res) => {
  try {
    const { ticketId: id } = req.params;

    const ticketRef = doc(TicketsTable, id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    const ticket = Ticket.toFormattedObject(ticketSnap);
    if (ticket.status === "cancelled")
      return responseHandler.badRequest(res, "Tiket sudah dibatalkan");
    if (ticket.status === "confirmed")
      return responseHandler.badRequest(
        res,
        "Tidak dapat membatalkan tiket yang sudah dikonfirmasi"
      );

    const timetableRef = query(
      TimetablesTable,
      where("visitDate", "==", ticket.visitDate)
    );
    const timetableSnap = await getDocs(timetableRef);
    if (timetableSnap.empty) return responseHandler.notFound(res);

    await updateDoc(timetableSnap.docs[0].ref, {
      quota:
        timetableSnap.docs[0].data().quota +
        ticket.adultCount +
        ticket.childCount,
      updatedAt: new Date(),
    });
    await updateDoc(ticketRef, { status: "cancelled", updatedAt: new Date() });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getPaidTickets = async (req, res) => {
  try {
    const tickets = [];
    const ticketsSnapshot = await getDocs(
      query(TicketsTable, where("status", "==", "paid"))
    );
    for (const doc of ticketsSnapshot.docs) {
      const ticket = Ticket.toFormattedObject(doc);

      const transactionRef = query(
        TransactionsTable,
        where("ticketId", "==", doc.id)
      );
      const transactionSnap = await getDocs(transactionRef);
      if (!transactionSnap.empty) {
        const transaction = Transaction.toFormattedObject(
          transactionSnap.docs[0]
        );
        ticket.transaction = transaction;
      }

      tickets.push(ticket);
    }

    return responseHandler.ok(res, tickets);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const payForTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { proofOfPaymentURL } = req.body;

    const ticketRef = doc(TicketsTable, ticketId);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    const transactionRef = query(
      TransactionsTable,
      where("ticketId", "==", ticketId)
    );
    const transactionSnap = await getDocs(transactionRef);
    if (transactionSnap.empty) return responseHandler.notFound(res);

    await updateDoc(ticketRef, {
      status: "paid",
      updatedAt: new Date(),
    });
    await updateDoc(transactionSnap.docs[0].ref, {
      proofOfPaymentURL,
    });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const confirmTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticketRef = doc(TicketsTable, ticketId);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    const ticket = Ticket.toFormattedObject(ticketSnap);
    if (ticket.status === "confirmed")
      return responseHandler.badRequest(res, "Tiket sudah dikonfirmasi");
    if (ticket.status === "pending")
      return responseHandler.badRequest(res, "Tiket belum dibayar");
    if (ticket.status === "cancelled")
      return responseHandler.badRequest(res, "Tiket sudah dibatalkan");

    const transactionRef = query(
      TransactionsTable,
      where("ticketId", "==", ticketId)
    );
    const transactionSnap = await getDocs(transactionRef);
    if (transactionSnap.empty) return responseHandler.notFound(res);

    await updateDoc(ticketRef, {
      status: "confirmed",
      updatedAt: new Date(),
    });
    await updateDoc(transactionSnap.docs[0].ref, { isPaid: true });

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getPendingTicketsOverHalfHour = async (req, res) => {
  try {
    const tickets = [];
    const ticketsSnapshot = await getDocs(
      query(TicketsTable, where("status", "==", "pending"))
    );
    for (const doc of ticketsSnapshot.docs) {
      const ticket = Ticket.toFormattedObject(doc);

      const timeZone = "Asia/Makassar";
      const now = new Date();
      const zonedDate = toZonedTime(now, timeZone);

      const ticketExpirationTime = addMinutes(new Date(ticket.createdAt), 30);
      const zonedTicketExpirationTime = toZonedTime(
        ticketExpirationTime,
        timeZone
      );

      if (isBefore(zonedTicketExpirationTime, zonedDate)) {
        const transactionRef = query(
          TransactionsTable,
          where("ticketId", "==", doc.id)
        );
        const transactionSnap = await getDocs(transactionRef);
        if (!transactionSnap.empty) {
          const transaction = Transaction.toFormattedObject(
            transactionSnap.docs[0]
          );
          ticket.transaction = transaction;
        }

        tickets.push(ticket);
      }
    }

    return responseHandler.ok(res, tickets);
  } catch (error) {
    responseHandler.error(res);
  }
};

//
export const bookTickets = async (req, res) => {
  try {
    const {
      adultCount,
      childCount,
      carCount,
      motorcycleCount,
      totalPrice,
      visitDate,
      buyerName,
      buyerEmail,
      buyerPhoneNumber,
    } = req.body;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const bookingCode = `MRN-${day}${month}${year}-${randomPart}`;
    const totalTicketCount = adultCount + childCount;

    const timetableSnapshot = await getDocs(
      query(TimetablesTable, where("visitDate", "==", visitDate))
    );
    const isTimetableRowDataExist = !timetableSnapshot.empty;

    if (!isTimetableRowDataExist) {
      const timetable = new Timetable(visitDate, 50 - totalTicketCount);
      await addDoc(TimetablesTable, timetable.toObject());

      const ticket = new Ticket(
        bookingCode,
        visitDate,
        adultCount,
        childCount,
        carCount,
        motorcycleCount,
        buyerName,
        buyerPhoneNumber,
        buyerEmail,
        "pending"
      );
      const newTicket = await addDoc(TicketsTable, ticket.toObject());

      const transaction = new Transaction(newTicket.id, totalPrice, false);
      await addDoc(TransactionsTable, transaction.toObject());

      return responseHandler.ok(res, {
        id: newTicket.id,
      });
    } else {
      const timetableSelected = timetableSnapshot.docs[0];

      const isQuotaAvailable =
        timetableSelected.data().quota >= totalTicketCount;

      if (isQuotaAvailable) {
        const ticket = new Ticket(
          bookingCode,
          visitDate,
          adultCount,
          childCount,
          carCount,
          motorcycleCount,
          buyerName,
          buyerPhoneNumber,
          buyerEmail,
          "pending"
        );
        const newTicket = await addDoc(TicketsTable, ticket.toObject());

        const transaction = new Transaction(newTicket.id, totalPrice, false);
        await addDoc(TransactionsTable, transaction.toObject());

        // Update timetable quota
        await updateDoc(doc(TimetablesTable, timetableSelected.id), {
          quota: timetableSelected.data().quota - totalTicketCount,
          updatedAt: new Date(),
        });

        return responseHandler.ok(res, {
          id: newTicket.id,
        });
      } else {
        return responseHandler.badRequest(
          res,
          "Kuota pada tanggal ini sudah penuh"
        );
      }
    }
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const tickets = [];
    const ticketsSnapshot = await getDocs(TicketsTable);
    for (const doc of ticketsSnapshot.docs) {
      const ticket = Ticket.toFormattedObject(doc);

      const transactionRef = query(
        TransactionsTable,
        where("ticketId", "==", doc.id)
      );
      const transactionSnap = await getDocs(transactionRef);
      if (!transactionSnap.empty) {
        const transaction = Transaction.toFormattedObject(
          transactionSnap.docs[0]
        );
        ticket.transaction = transaction;
      }

      tickets.push(ticket);
    }

    return responseHandler.ok(res, tickets);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const getTicketByTicketId = async (req, res) => {
  try {
    const { ticketId: id } = req.params;

    const ticketRef = doc(TicketsTable, id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    const ticket = Ticket.toFormattedObject(ticketSnap);

    const transactionRef = query(
      TransactionsTable,
      where("ticketId", "==", id)
    );
    const transactionSnap = await getDocs(transactionRef);
    if (!transactionSnap.empty) {
      const transaction = Transaction.toFormattedObject(
        transactionSnap.docs[0]
      );
      ticket.transaction = transaction;
    }

    responseHandler.ok(res, ticket);
  } catch (error) {
    responseHandler.error(res);
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { ticketId: id } = req.params;

    const ticketRef = doc(TicketsTable, id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    const ticket = Ticket.toFormattedObject(ticketSnap);
    if (ticket.status !== "cancelled")
      return responseHandler.badRequest(
        res,
        "Tiket tidak dapat dihapus. Silakan batalkan tiket terlebih dahulu."
      );

    const transactionRef = query(
      TransactionsTable,
      where("ticketId", "==", id)
    );
    const transactionSnap = await getDocs(transactionRef);

    await deleteDoc(ticketRef);
    await deleteDoc(transactionSnap.docs[0].ref);

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};
