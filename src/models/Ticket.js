import { formatDate } from "../helpers/helper.js";
import { toZonedTime } from "date-fns-tz";

class Ticket {
  constructor(
    bookingCode,
    visitDate,
    adultCount,
    childCount,
    carCount,
    motorcycleCount,
    buyerName,
    buyerPhoneNumber,
    buyerEmail,
    status
  ) {
    const timeZone = "Asia/Makassar";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    //
    this.bookingCode = bookingCode;
    this.visitDate = visitDate;
    this.adultCount = adultCount;
    this.childCount = childCount;
    this.carCount = carCount;
    this.motorcycleCount = motorcycleCount;
    this.buyerName = buyerName;
    this.buyerPhoneNumber = buyerPhoneNumber;
    this.buyerEmail = buyerEmail;
    this.status = status; // pending, paid, confirmed, cancelled
    this.createdAt = zonedDate;
    this.updatedAt = zonedDate;
  }

  toObject() {
    return {
      bookingCode: this.bookingCode,
      visitDate: this.visitDate,
      adultCount: this.adultCount,
      childCount: this.childCount,
      carCount: this.carCount,
      motorcycleCount: this.motorcycleCount,
      buyerName: this.buyerName,
      buyerPhoneNumber: this.buyerPhoneNumber,
      buyerEmail: this.buyerEmail,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const ticket = new Ticket(
      data.bookingCode,
      data.visitDate,
      data.adultCount,
      data.childCount,
      data.carCount,
      data.motorcycleCount,
      data.buyerName,
      data.buyerPhoneNumber,
      data.buyerEmail,
      data.status
    );
    ticket.id = doc.id;
    ticket.createdAt = formatDate(data.createdAt);
    ticket.updatedAt = formatDate(data.updatedAt);
    return ticket;
  }
}

export default Ticket;
