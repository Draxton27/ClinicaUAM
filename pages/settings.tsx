import React from "react";
import Shell from "../components/shell";
import { GetServerSidePropsContext } from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../firebase/auth/utils.server";


export default function Settings() {
  return (
    <Shell>
      <></>
    </Shell>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);
  const authenticated = await userIsLoggedIn(cookies);

  if (!authenticated) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {}, // aquí tus props reales si las tuvieras
  };
}
