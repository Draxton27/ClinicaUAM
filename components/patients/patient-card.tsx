"use client"

import React, { useState } from "react"
import { useRouter } from "next/router"
import { MoreHorizontal } from "lucide-react"

type Paciente = {
    id: string
    name: string
    email: string
    birthdate: string
    sex: string
}

// Custom Dropdown Menu component using useState and Tailwind CSS
function PatientActionsDropdown({ patientId }: { patientId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 h-8 w-8 p-0"
                    id={`options-menu-${patientId}`}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`options-menu-${patientId}`}
                >
                    <div className="py-1" role="none">
                        <button
                            onClick={() => {
                                router.push(`/pacientes/${patientId}/consultas`)
                                setIsOpen(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                        >
                            Ver detalles
                        </button>
                        <button
                            onClick={() => {
                                router.push(`/pacientes/${patientId}/consultas/nueva`)
                                setIsOpen(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                        >
                            Nueva consulta
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PatientCard({ paciente }: { paciente: Paciente }) {
    const router = useRouter()

    return (
        <div className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 flex flex-col justify-between h-full">
            <div className="flex-grow">
                <h3
                    className="text-xl font-semibold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => router.push(`/pacientes/${paciente.id}/consultas`)}
                >
                    {paciente.name}
                </h3>
                <p className="text-gray-600 text-sm mb-1">
                    <span className="font-medium">Correo:</span> {paciente.email}
                </p>
                <p className="text-gray-600 text-sm mb-1">
                    <span className="font-medium">Nacimiento:</span> {paciente.birthdate}
                </p>
                <p className="text-gray-600 text-sm mb-4">
                    <span className="font-medium">Género:</span> {paciente.sex}
                </p>
            </div>
            <div className="flex justify-end">
                <PatientActionsDropdown patientId={paciente.id} />
            </div>
        </div>
    )
}
