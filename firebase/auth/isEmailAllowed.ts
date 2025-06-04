import {db} from "../clientApp";

export const isEmailAllowed = async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();

    // 1) Lista blanca opcional
    const snap = await db
        .collection("allowedEmails")
        .where("email", "==", normalized)
        .limit(1)
        .get();

    // Si la colección está vacía → permitir cualquiera del dominio
    // Si tiene elementos → solo permitir si el correo está
    return snap.size === 0 || !snap.empty;
};
