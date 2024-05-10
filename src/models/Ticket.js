import { formatDate } from "../helpers/helper.js";

class Ticket {
  constructor(bookingCode, visitDate, adultCount, childCount, status) {
    this.bookingCode = bookingCode;
    this.visitDate = visitDate;
    this.adultCount = adultCount;
    this.childCount = childCount;
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
      data.status
    );
    ticket.createdAt = formatDate(data.createdAt);
    ticket.updatedAt = formatDate(data.updatedAt);
    return ticket;
  }

  // static generateBookingCode() {
  //     const today = new Date();
  //     const day = today.getDate().toString().padStart(2, '0');
  //     const month = (today.getMonth() + 1).toString().padStart(2, '0');
  //     const year = today.getFullYear().toString().slice(-2);
  //     const datePart = `${day}${month}${year}`;

  //     const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  //     return `PS-${datePart}-${randomPart}`;
  // }
}

export default Ticket;
