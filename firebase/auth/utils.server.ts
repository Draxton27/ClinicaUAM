// firebase/auth/utils.server.ts
import firebaseAdmin from "../adminApp";

export async function userIsLoggedIn(
    cookies: Record<string,string>
): Promise<boolean> {
    try {
        await firebaseAdmin.auth().verifyIdToken(cookies.token);
        return true;
    } catch {
        return false;
    }
}
