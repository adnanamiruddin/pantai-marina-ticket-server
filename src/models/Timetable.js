import { formatDate } from "../helpers/helper.js";

class Timetable {
  constructor(visitDate, quota) {
    this.visitDate = visitDate;
    this.quota = quota;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  toObject() {
    return {
      visitDate: this.visitDate,
      quota: this.quota,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static toFormattedObject(doc) {
    const data = doc.data();
    const timetable = new Timetable(data.visitDate, data.quota);
    timetable.id = doc.id;
    timetable.createdAt = formatDate(data.createdAt);
    timetable.updatedAt = formatDate(data.updatedAt);
    return timetable;
  }
}

export default Timetable;
