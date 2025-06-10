import React from "react";
import Link from "next/link";
import Image from "next/image";
import hero from "../../images/hero.png";
import fondoPagina from "../../images/fondopagina.jpeg";
import Logo from "../../images/logo.png";

export default function Splash() {
  return (
    <div className="flex flex-col min-h-screen">
      <div
        className="flex-1 relative bg-cover bg-center"
        style={{
          backgroundImage: `url(${fondoPagina.src})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

        <div className="relative z-10 container mx-auto p-6 text-white flex flex-col min-h-screen">
          <div className="flex items-center justify-between">
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

          <div className="pt-24 md:pt-12 px-6 flex flex-wrap flex-col md:flex-row items-center flex-1">
            <div className="flex flex-col w-full xl:w-2/5 justify-center lg:items-start text-center md:text-left">
              <h1 className="my-4 text-4xl md:text-6xl text-white font-extrabold leading-tight">
                Bienvenido al Sistema IntegraMed
              </h1>
              <p className="text-lg md:text-2xl text-gray-200 mb-6">
                La solución integral que conecta y simplifica la gestión clínica
              </p>
            </div>
          </div>

          <footer className="mt-auto pt-16 pb-6 text-sm text-center text-white">
            &copy; {new Date().getFullYear()} Universidad Americana - Biblioteca UAM
          </footer>
        </div>
      </div>
    </div>
  );

}
