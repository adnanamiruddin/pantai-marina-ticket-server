import { UsersTable } from "../config/config.js";
import {
  getDocs,
  doc,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import responseHandler from "../handlers/response.handler.js";
import jsonwebtoken from "jsonwebtoken";
import User from "../models/User.js";

const signUp = async (req, res) => {
  try {
    const { userUID, firstName, lastName } = req.body;

    const user = new User(userUID, firstName, lastName);
    // Save additional user data
    const docRef = await addDoc(UsersTable, user.toObject());

    user.password = undefined;
    const token = jsonwebtoken.sign(
      { data: docRef.id },
      process.env.SECRET_TOKEN,
      { expiresIn: "24h" }
    );

    responseHandler.created(res, {
      id: docRef.id,
      ...user,
      token,
      message:
        "User added successfully. Please complete your profile information.",
    });
  } catch (error) {
    responseHandler.error(res);
  }
};

const signIn = async (req, res) => {
  try {
    const { userUID } = req.body;

    const querySnapshot = await getDocs(
      query(UsersTable, where("userUID", "==", userUID))
    );
    if (querySnapshot.size === 0) return responseHandler.unauthorize(res);

    const user = querySnapshot.docs[0].data();
    user.password = undefined;
    const token = jsonwebtoken.sign(
      { data: querySnapshot.docs[0].id },
      process.env.SECRET_TOKEN,
      { expiresIn: "24h" }
    );

    responseHandler.created(res, {
      id: querySnapshot.docs[0].id,
      ...user,
      token,
    });
  } catch (error) {
    responseHandler.error(res);
  }
};

const getProfile = async (req, res) => {
  try {
    const docSnap = await getDoc(doc(UsersTable, req.user.id));
    if (!docSnap.exists()) return responseHandler.notFound(res);

    responseHandler.ok(res, User.getProfile(docSnap));
  } catch (error) {
    responseHandler.error(res);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const dataReq = req.body;

    const docRef = doc(UsersTable, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return responseHandler.notFound(res);

    await updateDoc(docRef, dataReq);

    responseHandler.ok(res);
  } catch (error) {
    responseHandler.error(res);
  }
};

export default {
  signUp,
  signIn,
  getProfile,
  updateProfile,
};
