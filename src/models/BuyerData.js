class BuyerData {
  constructor(name, phone, email) {
    this.name = name;
    this.phone = phone;
    this.email = email;
  }

  toObject() {
    return {
      name: this.name,
      phone: this.phone,
      email: this.email,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const buyerData = new BuyerData(data.name, data.phone, data.email);
    return buyerData;
  }
}

export default BuyerData;
