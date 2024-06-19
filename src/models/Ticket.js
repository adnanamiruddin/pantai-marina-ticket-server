import { formatDate } from "../helpers/helper.js";

class Ticket {
  constructor(
    bookingCode,
    visitDate,
    adultCount,
    childCount,
    buyerName,
    buyerPhoneNumber,
    buyerEmail,
    status
  ) {
    this.bookingCode = bookingCode;
    this.visitDate = visitDate;
    this.adultCount = adultCount;
    this.childCount = childCount;
    this.buyerName = buyerName;
    this.buyerPhoneNumber = buyerPhoneNumber;
    this.buyerEmail = buyerEmail;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toObject() {
    return {
      bookingCode: this.bookingCode,
      visitDate: this.visitDate,
      adultCount: this.adultCount,
      childCount: this.childCount,
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
      data.buyerName,
      data.buyerPhoneNumber,
      data.buyerEmail,
      data.status
    );
    ticket.createdAt = formatDate(data.createdAt);
    ticket.updatedAt = formatDate(data.updatedAt);
    return ticket;
  }
}

export default Ticket;
