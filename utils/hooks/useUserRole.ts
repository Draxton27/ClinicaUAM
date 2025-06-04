import { auth, db } from "../../firebase/clientApp";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect, useState } from "react";

export const useUserRoles = (): string[] | undefined => {
    const [user] = useAuthState(auth);
    const [roles, setRoles] = useState<string[] | undefined>(undefined);

    useEffect(() => {
        if (!user) {
            setRoles(undefined);
            return;
        }

        const unsub = db
            .collection("users")
            .doc(user.uid)
            .onSnapshot((snap) => {
                if (!snap.exists) {
                    setRoles(undefined);
                    return;
                }

                const data = snap.data()!;
                setRoles(Array.isArray(data.roles) ? data.roles : []);
            });

        return unsub;
    }, [user]);

    return roles;
};
