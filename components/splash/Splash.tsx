import React from "react";
import Link from "next/link";
import Image from "next/image";
import hero from "../../images/hero.png";
import fondoPagina from "../../images/fondopagina.jpeg";
import Logo from "../../images/logo.png";

export default function Splash() {
  return (
      <>
        <div
            className="relative h-screen bg-cover bg-center flex flex-col"
            style={{
              backgroundImage: `url(${fondoPagina.src})`,
            }}
        >
          {/* Capa de desenfoque + overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

          {/* Contenido principal */}
          <div className="relative z-10 w-full container mx-auto p-6 text-white">
            {/* Header */}
            <div className="w-full flex items-center justify-between">
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

              <div className="flex w-1/2 justify-end content-center">
                <Link href="/login">
                  <a>
                    <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-full shadow">
                      Registrarte
                    </button>
                  </a>
                </Link>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="container pt-24 md:pt-12 px-6 mx-auto flex flex-wrap flex-col md:flex-row items-center">
              <div className="flex flex-col w-full xl:w-2/5 justify-center lg:items-start text-center md:text-left">
                <h1 className="my-4 text-4xl md:text-6xl text-white font-extrabold leading-tight">
                  Bienvenido al Sistema IntegraMed
                </h1>
                <p className="text-lg md:text-2xl text-gray-200 mb-6">
                  La solución integral que conecta y simplifica la gestión clínica
                </p>
              </div>
              <div className="w-full xl:w-3/5 py-6 px-4 xl:px-0 xl:pl-96">
                <Image
                  src={hero}
                  alt="Hero"
                  layout="responsive"
                  objectFit="contain"
                  priority
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="w-full pt-16 pb-6 text-sm text-center text-white">
              &copy; {new Date().getFullYear()} Universidad Americana - Biblioteca UAM
            </footer>
          </div>
        </div>
      </>
  );
}
