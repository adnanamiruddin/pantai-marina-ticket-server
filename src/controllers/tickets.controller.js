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
import Midtrans from "midtrans-client";

const bookTickets = async (req, res) => {
  try {
    const { id } = req.user;
    const { adultCount, childCount, totalPrice, visitDate } = req.body;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const randomPart = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const bookingCode = `PM-${day}${month}${year}-${randomPart}`;
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
        "pending"
      );
      const newTicket = await addDoc(TicketsTable, ticket.toObject());

      const transaction = new Transaction(id, newTicket.id, totalPrice, false);
      await addDoc(TransactionsTable, transaction.toObject());

      return responseHandler.ok(res);
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
          "pending"
        );
        const newTicket = await addDoc(TicketsTable, ticket.toObject());

        const transaction = new Transaction(
          id,
          newTicket.id,
          totalPrice,
          false
        );
        await addDoc(TransactionsTable, transaction.toObject());

        // Update timetable quota
        await updateDoc(doc(TimetablesTable, timetableSelected.id), {
          quota: timetableSelected.data().quota - totalTicketCount,
        });

        return responseHandler.ok(res);
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

const getAllTimeTables = async (req, res) => {
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

const payForTicketByTicketId = async (req, res) => {
  try {
    const { ticketId: id } = req.params;
    const { ticketName, price, quantity } = req.body;

    let snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: process.env.PAYMENT_SECRET,
      clientKey: process.env.PAYMENT_CLIENT,
    });

    let parameter = {
      // item_details: {
      //   name: ticketName,
      //   price,
      //   quantity,
      // },
      transaction_details: {
        order_id: id,
        gross_amount: price,
      },
    };

    const token = await snap.createTransactionToken(parameter);
    responseHandler.ok(res, token);
  } catch (error) {
    responseHandler.error(res);
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId: id } = req.params;
    const { status } = req.body;

    const ticketRef = doc(TicketsTable, id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    await updateDoc(ticketRef, { status });

    if (status == "paid") {
      const transactionRef = query(
        TransactionsTable,
        where("ticketId", "==", id)
      );
      const transactionSnap = await getDocs(transactionRef);
      if (transactionSnap.empty) return responseHandler.notFound(res);

      await updateDoc(transactionSnap.docs[0].ref, { isPaid: true });
    }

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

const deleteUserTicket = async (req, res) => {
  try {
    const { ticketId: id } = req.params;

    const ticketRef = doc(TicketsTable, id);
    const ticketSnap = await getDoc(ticketRef);
    if (!ticketSnap.exists()) return responseHandler.notFound(res);

    await deleteDoc(ticketRef);

    const transactionRef = query(
      TransactionsTable,
      where("ticketId", "==", id)
    );
    const transactionSnap = await getDocs(transactionRef);
    if (transactionSnap.empty) return responseHandler.notFound(res);

    await deleteDoc(transactionSnap.docs[0].ref);

    // Update timetable quota
    const ticket = ticketSnap.data();
    const totalTicketCount = ticket.adultCount + ticket.childCount;
    const timetableSnapshot = await getDocs(
      query(TimetablesTable, where("visitDate", "==", ticket.visitDate))
    );
    const timetableSelected = timetableSnapshot.docs[0];

    await updateDoc(doc(TimetablesTable, timetableSelected.id), {
      quota: timetableSelected.data().quota + totalTicketCount,
    });

    responseHandler.ok(res);
  } catch (error) {
    console.log(error);
    responseHandler.error(res);
  }
};

const getUserTickets = async (req, res) => {
  try {
    const { id } = req.user;
    const tickets = [];

    const transactionsSnapshot = await getDocs(
      query(TransactionsTable, where("userId", "==", id))
    );

    for (const transaction of transactionsSnapshot.docs) {
      const formattedTransaction = Transaction.toFormattedObject(transaction);

      const ticketSnapshot = await getDoc(
        doc(TicketsTable, transaction.data().ticketId)
      );
      const formattedTicket = Ticket.toFormattedObject(ticketSnapshot);

      const ticket = {
        ticketId: ticketSnapshot.id,
        ...formattedTicket,
        transaction: {
          transactionId: transaction.id,
          ...formattedTransaction,
        },
      };
      tickets.push(ticket);
    }

    return responseHandler.ok(res, tickets);
  } catch (error) {
    responseHandler.error(res);
  }
};

const getVisitorReports = async (req, res) => {
  try {
    const timetables = [];
    const timetablesSnapshot = await getDocs(TimetablesTable);
    for (const doc of timetablesSnapshot.docs) {
      const timetable = Timetable.toFormattedObject(doc);

      // const tickets = [];
      // const ticketsSnapshot = await getDocs(
      //   query(TicketsTable, where("visitDate", "==", timetable.visitDate))
      // );
      // ticketsSnapshot.forEach((ticket) => {
      //   tickets.push(Ticket.toFormattedObject(ticket));
      // });
      // timetable.tickets = tickets;

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
    console.log(error);
    responseHandler.error(res);
  }
};

// const getAllTickets = async (req, res) => {
//   try {
//     const tickets = [];
//     const ticketsSnapshot = await getDocs(TicketsTable);
//     ticketsSnapshot.forEach((doc) => {
//       tickets.push(doc.data());
//     });

//     return responseHandler.ok(res, tickets);
//   } catch (error) {
//     responseHandler.error(res);
//   }
// };

export default {
  bookTickets,
  getAllTimeTables,
  updateTicketStatus,
  payForTicketByTicketId,
  deleteUserTicket,
  getUserTickets,
  getVisitorReports,
};
