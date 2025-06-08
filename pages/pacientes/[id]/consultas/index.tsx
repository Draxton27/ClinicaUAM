"use client"

import {useRouter} from "next/router"
import React, {useEffect, useState} from "react"
import firebase from "../../../../firebase/clientApp" // Assuming this path is correct
import Link from "next/link"

// Lucide React icons for patient details
import {User, Mail, Calendar, MoonIcon as Venus, SpaceIcon as Mars, CircleHelp} from "lucide-react"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"
import ConsultationCard from "../../../../components/patients/consultation-card" // Import the new ConsultationCard component

type Consulta = {
    id: string
    diagnosis: string
    date: string
    total: number
}

type Paciente = {
    name: string
    email: string
    birthdate: string
    sex: string
}

export default function ConsultasPaciente() {
    const router = useRouter()
    const {id: pacienteId} = router.query

    const [consultas, setConsultas] = useState<Consulta[]>([])
    const [paciente, setPaciente] = useState<Paciente | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!pacienteId) return

        const fetchData = async () => {
            try {
                const [consultasSnap, pacienteSnap] = await Promise.all([
                    firebase
                        .firestore()
                        .collection("consultations")
                        .where("patientId", "==", pacienteId)
                        // TODO habilitar cuando se tenga acceso para crear indice
                        //  .orderBy("date", "desc") // Order by date for a timeline feel
                        .get(),
                    firebase
                        .firestore()
                        .collection("patients")
                        .doc(pacienteId as string)
                        .get(),
                ])

                const consultasData = consultasSnap.docs.map((doc) => {
                    const d = doc.data()
                    const dateObj = d.date?.toDate?.()
                    return {
                        id: doc.id,
                        diagnosis: d.diagnosis || "Sin diagnóstico",
                        date:
                            dateObj?.toLocaleDateString("es-NI", {year: "numeric", month: "long", day: "numeric"}) ||
                            "Fecha inválida",
                        total: typeof d.total === "number" ? d.total : 0,
                    }
                })

                const pacienteData = pacienteSnap.data() as Paciente
                setConsultas(consultasData)
                setPaciente(pacienteData)
            } catch (err) {
                console.error("Error al obtener datos:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [pacienteId])

    const getSexIcon = (sex: string) => {
        switch (sex.toLowerCase()) {
            case "m":
            case "masculino":
                return <Mars className="h-5 w-5 mr-2 text-blue-500"/>
            case "f":
            case "femenino":
                return <Venus className="h-5 w-5 mr-2 text-pink-500"/>
            default:
                return <CircleHelp className="h-5 w-5 mr-2 text-gray-500"/>
        }
    }

    return (
        <Shell>
            <Content title="Expediente del Paciente">
                {/* Se ha añadido un div envolvente aquí para que sea un único children */}
                <div>
                    {loading ? (
                        <div className="space-y-6">
                            {/* Skeleton for Patient Info Card */}
                            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                                    <div className="h-5 bg-gray-200 rounded w-full"></div>
                                </div>
                            </div>
                            {/* Skeleton for Consultations Header */}
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-7 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-10 bg-gray-200 rounded w-32"></div>
                            </div>
                            {/* Skeleton for Consultation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i}
                                         className="bg-white rounded-lg shadow-sm p-5 h-40 animate-pulse border border-gray-200">
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                                        <div className="h-5 bg-gray-200 rounded w-1/3 ml-auto"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {paciente && (
                                <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">
                                        <User className="inline-block h-6 w-6 mr-3 text-blue-600"/>
                                        Información del Paciente: {paciente.name}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-gray-700">
                                        <div className="flex items-center text-base">
                                            <Mail className="h-5 w-5 mr-3 text-gray-500"/>
                                            <span className="font-semibold mr-1">Correo:</span> {paciente.email}
                                        </div>
                                        <div className="flex items-center text-base">
                                            <Calendar className="h-5 w-5 mr-3 text-gray-500"/>
                                            <span
                                                className="font-semibold mr-1">Fecha de nacimiento:</span> {paciente.birthdate}
                                        </div>
                                        <div className="flex items-center text-base">
                                            {getSexIcon(paciente.sex)}
                                            <span className="font-semibold mr-1 ml-3">Género:</span> {paciente.sex}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div
                                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Historial de Consultas</h2>
                                <Link href={`/pacientes/${pacienteId}/consultas/nueva`} passHref>
                                    <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto">
                                        Nueva consulta
                                    </a>
                                </Link>
                            </div>

                            {consultas.length === 0 ? (
                                <div
                                    className="rounded-lg border border-gray-200 bg-white shadow-sm w-full max-w-md mx-auto text-center py-8">
                                    <div className="flex flex-col space-y-1.5 p-6">
                                        <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-800">
                                            No hay consultas registradas
                                        </h3>
                                        <p className="text-sm text-gray-600">Este paciente aún no tiene consultas en su
                                            expediente.</p>
                                    </div>
                                    <div className="p-6 pt-0">
                                        <Link href={`/pacientes/${pacienteId}/consultas/nueva`} passHref>
                                            <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                                                Registrar primera consulta
                                            </a>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {consultas.map((c) => (
                                        <ConsultationCard key={c.id} consulta={c} patientId={pacienteId as string}/>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Content>
        </Shell>
    )
}
