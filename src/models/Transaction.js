import { formatDate } from "../helpers/helper.js";

class Transaction {
  constructor(userId, ticketId, totalPrice, isPaid) {
    this.userId = userId;
    this.ticketId = ticketId;
    this.totalPrice = totalPrice;
    this.isPaid = isPaid;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toObject() {
    return {
      userId: this.userId,
      ticketId: this.ticketId,
      totalPrice: this.totalPrice,
      isPaid: this.isPaid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const transaction = new Transaction(
      data.userId,
      data.ticketId,
      data.totalPrice,
      data.isPaid
    );
    transaction.createdAt = formatDate(data.createdAt);
    transaction.updatedAt = formatDate(data.updatedAt);
    return transaction;
  }
}

export default Transaction;
