'use client';

import React from "react";
import { Transition } from "@headlessui/react";
import { useState } from "react";
import Logo from "../../../images/logo.png";
import Image from "next/image";
import NavOptions from "../NavOptions";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <nav className="bg-[#007C91] sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + título */}
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

            {/* Botón móvil */}
            <div className="-mr-2 flex">
              <button
                  onClick={() => setIsOpen(!isOpen)}
                  type="button"
                  className="
                bg-[#00B3C5]
                inline-flex items-center justify-center
                p-2 rounded-md
                text-white
                hover:bg-[#005C65]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#007C91] focus:ring-white
              "
                  aria-controls="mobile-menu"
                  aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {!isOpen ? (
                    /* Icono “hamburger” */
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                ) : (
                    /* Icono “X” */
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menú desplagable móvil */}
        <Transition
            show={isOpen}
            enter="transition ease-out duration-100 transform"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75 transform"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
        >
          {() => (
              <div className="md:hidden" id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#0099A8]">
                  <NavOptions smallScreen={true} />
                </div>
              </div>
          )}
        </Transition>
      </nav>
  );
}
