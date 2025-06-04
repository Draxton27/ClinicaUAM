// src/utils/auth.ts
import firebase, { auth, db } from "../clientApp";
import nookies from "nookies";
import { isEmailAllowed } from "./isEmailAllowed";
import {User} from "../models/User";

const DEFAULT_ROLES = ["base"];

/** Guarda (o actualiza) el documento del usuario con su lista de roles */
const ensureUserDoc = async (
    uid: string,
    email: string,
    roles: string[] = DEFAULT_ROLES
): Promise<void> => {
  const ref = db.collection("users").doc(uid);

  try {
    const snap = await ref.get();
    if (snap.exists) {
      console.log("[Firestore] Usuario ya existe:", uid);
      return;
    }

    const newUser: Omit<User, "id"> = {
      email,
      roles,
      createdAt: firebase.firestore.FieldValue.serverTimestamp() as any,
    };

    console.log("[Firestore] Creando documento para:", uid, newUser);
    await ref.set(newUser);
    console.log("[Firestore] Documento creado correctamente.");
  } catch (error: any) {
    console.error("[Firestore] Error al crear documento:", {
      code: error.code,
      message: error.message,
      details: error,
    });
    throw error;
  }
};

export const signInWithEmail = async (
    email: string,
    password: string
): Promise<firebase.auth.UserCredential> => {
  const userCred = await auth.signInWithEmailAndPassword(email, password);
  const token = await userCred.user!.getIdToken();
  nookies.set(undefined, "token", token, { path: "/" });
  return userCred;
};

// ---------- SIGN-UP ---------- //
export const signUpWithEmail = async (
    email: string,
    password: string
): Promise<firebase.auth.UserCredential> => {
  console.log("[signUp] Verificando si correo está permitido:", email);
  if (!(await isEmailAllowed(email))) {
    console.log("[signUp] Correo bloqueado por isEmailAllowed.");
    throw { code: "auth/not-allowed", message: "Correo no autorizado." };
  }
  console.log("[signUp] Correo permitido.");

  const userCred = await auth.createUserWithEmailAndPassword(email, password);
  await userCred.user?.getIdToken(true); // refresca token
  console.log("[signUp] Usuario creado en Auth:", userCred.user?.uid);

  // Esperar un momento por si Firebase aún propaga el estado
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Ahora creamos el doc con lista de roles
  await ensureUserDoc(userCred.user!.uid, email, DEFAULT_ROLES);

  const token = await userCred.user!.getIdToken();
  nookies.set(undefined, "token", token, { path: "/" });
  return userCred;
};

// ---------- GOOGLE ---------- //
export const signInWithGoogle = async (): Promise<firebase.auth.UserCredential> => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const userCred = await auth.signInWithPopup(provider);
  const email = userCred.user!.email!;

  if (!(await isEmailAllowed(email))) {
    await auth.signOut();
    throw { code: "auth/not-allowed", message: "Correo de Google no autorizado." };
  }

  // Solo creamos el doc si no existe
  await ensureUserDoc(userCred.user!.uid, email, DEFAULT_ROLES);

  const token = await userCred.user!.getIdToken();
  nookies.set(undefined, "token", token, { path: "/" });
  return userCred;
};

// Recuperar contraseña
export const resetPassword = async (email: string): Promise<void> => {
  await firebase.auth().sendPasswordResetEmail(email);
};
