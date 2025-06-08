"use client"

import React, { useRouter } from "next/router"
import { CalendarDays, DollarSign, FileText } from "lucide-react"

type Consulta = {
    id: string
    diagnosis: string
    date: string
    total: number
}

type ConsultationCardProps = {
    consulta: Consulta
    patientId: string
}

export default function ConsultationCard({ consulta, patientId }: ConsultationCardProps) {
    const router = useRouter()

    return (
        <div
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5 border border-gray-200 cursor-pointer flex flex-col"
            onClick={() => router.push(`/pacientes/${patientId}/consultas/${consulta.id}`)}
        >
            <div className="flex items-center text-gray-500 text-sm mb-3">
                <CalendarDays className="h-4 w-4 mr-2" />
                <span className="font-medium">{consulta.date}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Diagnóstico:
            </h3>
            <p className="text-gray-700 text-sm flex-grow mb-3 line-clamp-3" title={consulta.diagnosis}>
                {consulta.diagnosis}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center text-gray-700 font-semibold">
                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                    Total:
                </div>
                <span className="text-lg font-bold text-green-700">C${consulta.total.toFixed(2)}</span>
            </div>
        </div>
    )
}
