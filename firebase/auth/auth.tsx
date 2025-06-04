// firebase/auth/auth.tsx
import React, { useState, useEffect, createContext, useContext } from "react";
import nookies from "nookies";
import firebase from "../clientApp";

interface AuthContextProps {
  user: firebase.User | null;
}

const AuthContext = createContext<AuthContextProps>({ user: null });

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);

  useEffect(() => {
    return firebase.auth().onIdTokenChanged(async (user) => {
      if (!user) {
        setUser(null);
        nookies.destroy(null, "token");
        return;
      }
      const token = await user.getIdToken();
      setUser(user);

      const payload = JSON.parse(atob(token.split('.')[1]));

      console.log("Issued at:", new Date(payload.iat * 1000).toLocaleString());
      console.log("UID:", payload.user_id);
      console.log("Email:", payload.email);

      nookies.set(null, "token", token, { path: "/" });
    });
  }, []);

  // refrescar token cada 10 minutos
  useEffect(() => {
    const handle = setInterval(async () => {
      const u = firebase.auth().currentUser;
      if (u) await u.getIdToken(true);
    }, 10 * 60 * 1000);
    return () => clearInterval(handle);
  }, []);

  return (
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
