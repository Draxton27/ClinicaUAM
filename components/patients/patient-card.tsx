import React, { useState } from "react"
import { useRouter } from "next/router"
import {
    MoreHorizontal,
    User,
    Mail,
    Calendar,
    Users,
    ChevronRight,
    FileText,
    PlusCircle,
    Phone,
    Clock,
} from "lucide-react"

type Paciente = {
    id: string
    name: string
    email: string
    birthdate: string
    sex: string
    emergencyNumber?: string
    lastVisit?: string
    consultCount?: number
    dni?: string
}

// Función para calcular la edad a partir de la fecha de nacimiento
function calculateAge(birthdate: string): number {
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    return age
}

// Función para formatear la fecha en formato legible
function formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
}

function PatientActionsDropdown({ patientId }: { patientId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    // Cerrar el menú cuando se hace clic fuera de él
    const handleClickOutside = () => {
        if (isOpen) setIsOpen(false)
    }

    // Agregar event listener cuando el menú está abierto
    if (isOpen) {
        window.addEventListener("click", handleClickOutside, { once: true })
    }

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 hover:bg-gray-100 hover:text-gray-900 h-8 w-8 p-0"
                    id={`options-menu-${patientId}`}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsOpen(!isOpen)
                    }}
                >
                    <span className="sr-only">Abrir menú</span>
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
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
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver historial clínico
                        </button>
                        <button
                            onClick={() => {
                                router.push(`/pacientes/${patientId}/consultas/nueva`)
                                setIsOpen(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Nueva consulta
                        </button>
                        <button
                            onClick={() => {
                                router.push(`/pacientes/${patientId}/editar`)
                                setIsOpen(false)
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                            role="menuitem"
                        >
                            <User className="h-4 w-4 mr-2" />
                            Editar información
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function PatientCard({ paciente }: { paciente: Paciente }) {
    const router = useRouter()
    const age = calculateAge(paciente.birthdate)

    // Determinar el género para mostrar el icono y color apropiados
    const genderInfo = {
        M: { label: "Masculino", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
        F: { label: "Femenino", bgColor: "bg-pink-50", textColor: "text-pink-700", borderColor: "border-pink-200" },
        Otro: { label: "Otro", bgColor: "bg-purple-50", textColor: "text-purple-700", borderColor: "border-purple-200" },
    }

    const gender = paciente.sex as keyof typeof genderInfo
    const { label, bgColor, textColor, borderColor } = genderInfo[gender] || genderInfo.Otro

    const handleCardClick = () => {
        router.push(`/pacientes/${paciente.id}/consultas`)
    }

    return (
        <div
            className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 overflow-hidden group cursor-pointer"
            onClick={handleCardClick}
        >
            {/* Barra superior de color según género */}
            <div className={`h-2 w-full ${bgColor}`}></div>

            <div className="p-5">
                {/* Cabecera con nombre y acciones */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors flex items-center">
                            {paciente.name}
                            <ChevronRight className="h-5 w-5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <div className="flex items-center mt-1">
              <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor} ${borderColor} border`}
              >
                <Users className="h-3 w-3 mr-1" />
                  {label}
              </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 ml-2">
                <Calendar className="h-3 w-3 mr-1" />
                                {age} años
              </span>
                        </div>
                    </div>
                    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                        <PatientActionsDropdown patientId={paciente.id} />
                    </div>
                </div>

                {/* Información principal */}
                <div className="space-y-2 mt-4">
                    <div className="flex items-center text-gray-600 text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{paciente.email}</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(paciente.birthdate)}</span>
                    </div>

                    {paciente.emergencyNumber && (
                        <div className="flex items-center text-gray-600 text-sm">
                            <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>{paciente.emergencyNumber}</span>
                        </div>
                    )}

                    {paciente.lastVisit && (
                        <div className="flex items-center text-gray-600 text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>Última visita: {formatDate(paciente.lastVisit)}</span>
                        </div>
                    )}
                </div>

                {/* Botones de acción rápida */}
                <div className="flex mt-5 pt-4 border-t border-gray-100">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/pacientes/${paciente.id}/consultas/nueva`)
                        }}
                        className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex-1"
                    >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Nueva consulta
                    </button>

                    <div className="border-r border-gray-200 mx-2"></div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/pacientes/${paciente.id}/consultas`)
                        }}
                        className="flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors flex-1"
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver historial
                    </button>
                </div>
            </div>
        </div>
    )
}
