import "../styles/globals.css";
import { AppProps } from "next/app";
import React from "react";
import { AuthProvider } from "../firebase/auth/auth";
import { SessionProvider } from "next-auth/react";

function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
    </SessionProvider>
  );
}

export default App;
