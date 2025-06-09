"use client"

import { useRouter } from "next/router"
import { CalendarDays, FileText, ChevronRight, Stethoscope, Receipt, AlertTriangle } from "lucide-react"
import React from "react"

type Consulta = {
    id: string
    diagnosis: string
    date: string
    total: number
    // Campos adicionales opcionales
    symptoms?: string
    treatment?: string
    followUp?: boolean
    notes?: string
}

type ConsultationCardProps = {
    consulta: Consulta
    patientId: string
}

import { parse, isValid } from "date-fns";
import { es } from "date-fns/locale";

// Función para obtener el tiempo relativo (hace cuánto fue)
function getRelativeTime(dateString: string): string {
    try {
        const now = new Date();

        // Parseamos con el formato "d 'de' MMMM 'de' yyyy" en español
        const consultDate = parse(
            dateString,
            "d 'de' MMMM 'de' yyyy",
            new Date(),
            { locale: es }
        );

        if (!isValid(consultDate)) {
            return "Fecha inválida";
        }

        const diffInMs = now.getTime() - consultDate.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return "Hoy";
        if (diffInDays === 1) return "Ayer";
        if (diffInDays < 7) return `Hace ${diffInDays} días`;
        if (diffInDays < 30) {
            const w = Math.floor(diffInDays / 7);
            return `Hace ${w} semana${w > 1 ? "s" : ""}`;
        }
        if (diffInDays < 365) {
            const m = Math.floor(diffInDays / 30);
            return `Hace ${m} mes${m > 1 ? "es" : ""}`;
        }
        const y = Math.floor(diffInDays / 365);
        return `Hace ${y} año${y > 1 ? "s" : ""}`;
    } catch (error) {
        console.error("Error al calcular tiempo relativo:", error);
        return "Fecha inválida";
    }
}


export default function ConsultationCard({ consulta, patientId }: ConsultationCardProps) {
    const router = useRouter()

    const relativeTime = getRelativeTime(consulta.date)


    const handleCardClick = () => {
        router.push(`/pacientes/${patientId}/consultas/${consulta.id}`)
    }

    return (
        <div
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 cursor-pointer group overflow-hidden"
            onClick={handleCardClick}
        >
            {/* Barra superior azul para consultas completadas */}
            <div className="h-1 w-full bg-blue-100"></div>

            <div className="p-5">
                {/* Cabecera con fecha */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900">{consulta.date}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{relativeTime}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Diagnóstico principal */}
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-semibold text-gray-700">Diagnóstico</h3>
                    </div>
                    <p
                        className="text-gray-900 text-sm leading-relaxed line-clamp-3 group-hover:text-blue-600 transition-colors"
                        title={consulta.diagnosis}
                    >
                        {consulta.diagnosis}
                    </p>
                </div>

                {/* Síntomas (si están disponibles) */}
                {consulta.symptoms && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600">Síntomas reportados</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2" title={consulta.symptoms}>
                            {consulta.symptoms}
                        </p>
                    </div>
                )}

                {/* Tratamiento (si está disponible) */}
                {consulta.treatment && (
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Receipt className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-gray-600">Tratamiento</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2" title={consulta.treatment}>
                            {consulta.treatment}
                        </p>
                    </div>
                )}

                {/* Footer con costo y indicadores */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        {/* Costo de la consulta */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-600">Total:</span>
                            <span className="text-sm font-bold text-green-700">
                C${consulta.total.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
              </span>
                        </div>

                        {/* Indicador de seguimiento */}
                        {consulta.followUp && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Seguimiento
              </span>
                        )}
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                        <span>Ver expediente</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
