class Transaction {
  constructor(ticketId, totalPrice, isPaid) {
    this.ticketId = ticketId;
    this.totalPrice = totalPrice;
    this.isPaid = isPaid;
  }

  toObject() {
    return {
      ticketId: this.ticketId,
      totalPrice: this.totalPrice,
      isPaid: this.isPaid,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const transaction = new Transaction(
      data.ticketId,
      data.totalPrice,
      data.isPaid
    );
    transaction.id = doc.id;
    return transaction;
  }
}

export default Transaction;
