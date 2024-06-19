import { format } from "date-fns";

export const formatDate = (date) => {
  return format(date.toDate(), "yyyy-MM-dd HH:mm:ss");
};
