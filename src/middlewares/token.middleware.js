import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import { doc, getDoc } from "firebase/firestore";
import { UsersTable } from "../config/config.js";

const tokenDecode = (req) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (bearerHeader) {
      const token = bearerHeader.split(" ")[1];
      return jsonwebtoken.verify(token, process.env.SECRET_TOKEN);
    }
    return false;
  } catch (error) {
    return false;
  }
};

const auth = async (req, res, next) => {
  const tokenDecoded = tokenDecode(req);
  if (!tokenDecoded) return responseHandler.unauthorize(res);

  const user = await getDoc(doc(UsersTable, tokenDecoded.data));
  if (!user.exists()) return responseHandler.unauthorize(res);

  req.user = {
    id: user.id,
    data: user.data(),
  };
  req.user.data.password = undefined;
  next();
};

export default { auth };
