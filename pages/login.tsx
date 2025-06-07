// pages/login.tsx
import React from "react";
import AuthForm from "../components/auth/Auth";
import { GetServerSidePropsContext } from "next";
import nookies from "nookies";
import fondoPagina from "../images/fondopagina.jpeg";
import Logo from "../images/logo.png";
import Image from "next/image";

export default function Login() {
    return (
        <div
            className="relative h-screen bg-cover bg-center"
            style={{
                backgroundImage: `url(${fondoPagina.src})`,
            }}
        >
            {/* Capa de difuminado + oscurecimiento */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

            {/* Contenido principal */}
            <div className="relative z-10 flex min-h-screen flex-col justify-center items-center">
                {/* Logo */}
                <div className="flex items-center h-[50px]">
                    <Image
                    src={Logo}	
                    alt="Logo IntegraMed"
                    layout="intrinsic"
                    height={200}
                    width={300}
                    className="object-contain"
                    />
                </div>

                {/* Formulario */}
                <AuthForm />
            </div>
        </div>
    );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const cookies = nookies.get(ctx);
    const { userIsLoggedIn } = await import("../firebase/auth/utils.server");

    if (await userIsLoggedIn(cookies)) {
        ctx.res.writeHead(302, { Location: "/" });
        ctx.res.end();
    }

    return { props: {} };
}
