import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import firebase from "../../../../firebase/clientApp"
import Link from "next/link"

// Lucide React icons
import {
    Mail,
    Calendar,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    PlusCircle,
    Clock,
    CalendarDays,
    Edit,
    Users,
} from "lucide-react"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"
import ConsultationCard from "../../../../components/patients/consultation-card"
import type {GetServerSidePropsContext} from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../../../../firebase/auth/utils.server";

type Consulta = {
    id: string
    diagnosis: string
    date: string
    total: number
    time?: string
    status?: "completed" | "pending" | "cancelled"
    symptoms?: string
    treatment?: string
    followUp?: boolean
    priority?: "low" | "medium" | "high"
}

type Paciente = {
    name: string
    email: string
    birthdate: string
    sex: string
    emergencyNumber?: string
    dni?: string
    direccion?: string
    lastVisit?: string
    consultCount?: number
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

export default function ConsultasPaciente() {
    const router = useRouter()
    const { id: pacienteId } = router.query

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
                        .orderBy("date", "desc")
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
                            dateObj?.toLocaleDateString("es-NI", { year: "numeric", month: "long", day: "numeric" }) ||
                            "Fecha inválida",
                        total: typeof d.total === "number" ? d.total : 0,
                        time: d.time || null,
                        status: d.status || "completed",
                        symptoms: d.symptoms || null,
                        treatment: d.treatment || null,
                        followUp: d.followUp || false,
                        priority: d.priority || null,
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

    // Determinar el género para mostrar el icono y color apropiados
    const getGenderInfo = (sex: string) => {
        const sexLower = sex?.toLowerCase() || ""

        if (sexLower === "m" || sexLower === "masculino") {
            return {
                label: "Masculino",
                bgColor: "bg-blue-50",
                textColor: "text-blue-700",
                borderColor: "border-blue-200",
            }
        } else if (sexLower === "f" || sexLower === "femenino") {
            return {
                label: "Femenino",
                bgColor: "bg-pink-50",
                textColor: "text-pink-700",
                borderColor: "border-pink-200",
            }
        } else {
            return {
                label: "Otro",
                bgColor: "bg-purple-50",
                textColor: "text-purple-700",
                borderColor: "border-purple-200",
            }
        }
    }

    return (
        <Shell>
            <Content title="Expediente del Paciente">
                <div>
                    {loading ? (
                        <div className="space-y-6">
                            {/* Skeleton for Patient Info Card */}
                            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                                <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
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
                                    <div key={i} className="bg-white rounded-lg shadow-sm p-5 h-40 animate-pulse border border-gray-200">
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
                                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
                                    {/* Barra superior de color según género */}
                                    <div className={`h-2 w-full ${getGenderInfo(paciente.sex).bgColor}`}></div>

                                    <div className="p-6">
                                        {/* Cabecera con nombre y acciones */}
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-2xl font-bold text-gray-800">{paciente.name}</h2>
                                            <Link href={`/pacientes/${pacienteId}/editar`} passHref>
                                                <a className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Editar
                                                </a>
                                            </Link>
                                        </div>

                                        {/* Información principal del paciente */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div className="flex flex-col space-y-3">
                                                {/* Edad y género */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                            <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGenderInfo(paciente.sex).bgColor} ${getGenderInfo(paciente.sex).textColor} ${getGenderInfo(paciente.sex).borderColor} border`}
                            >
                              <Users className="h-3 w-3 mr-1" />
                                {getGenderInfo(paciente.sex).label}
                            </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 ml-2">
                              <Calendar className="h-3 w-3 mr-1" />
                                                            {calculateAge(paciente.birthdate)} años
                            </span>
                                                    </div>
                                                </div>

                                                {/* Correo electrónico */}
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <Mail className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{paciente.email}</span>
                                                </div>

                                                {/* Fecha de nacimiento */}
                                                <div className="flex items-center text-gray-600 text-sm">
                                                    <CalendarDays className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                    <span>{formatDate(paciente.birthdate)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col space-y-3">
                                                {/* DNI si está disponible */}
                                                {paciente.dni && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <CreditCard className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span>DNI: {paciente.dni}</span>
                                                    </div>
                                                )}

                                                {/* Teléfono de emergencia si está disponible */}
                                                {paciente.emergencyNumber && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span>Emergencia: {paciente.emergencyNumber}</span>
                                                    </div>
                                                )}

                                                {/* Última visita si está disponible */}
                                                {paciente.lastVisit && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span>Última visita: {formatDate(paciente.lastVisit)}</span>
                                                    </div>
                                                )}

                                                {/* Contador de consultas si está disponible */}
                                                {paciente.consultCount !== undefined && (
                                                    <div className="flex items-center text-gray-600 text-sm">
                                                        <FileText className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span>
                              {paciente.consultCount} consulta{paciente.consultCount !== 1 ? "s" : ""}
                            </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dirección si está disponible */}
                                        {paciente.direccion && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <div className="flex items-start text-gray-600 text-sm">
                                                    <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                                    <span>{paciente.direccion}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                    Historial de Consultas
                                    {consultas.length > 0 && (
                                        <span className="ml-2 text-sm font-medium text-gray-500">({consultas.length})</span>
                                    )}
                                </h2>
                                <Link href={`/pacientes/${pacienteId}/consultas/nueva`} passHref>
                                    <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto">
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Nueva consulta
                                    </a>
                                </Link>
                            </div>

                            {consultas.length === 0 ? (
                                <div className="rounded-lg border border-gray-200 bg-white shadow-sm w-full max-w-md mx-auto text-center py-8">
                                    <div className="flex flex-col space-y-1.5 p-6">
                                        <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-800">
                                            No hay consultas registradas
                                        </h3>
                                        <p className="text-sm text-gray-600">Este paciente aún no tiene consultas en su expediente.</p>
                                    </div>
                                    <div className="p-6 pt-0">
                                        <Link href={`/pacientes/${pacienteId}/consultas/nueva`} passHref>
                                            <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Registrar primera consulta
                                            </a>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {consultas.map((c) => (
                                        <ConsultationCard key={c.id} consulta={c} patientId={pacienteId as string} />
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

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
    const cookies = nookies.get(ctx)
    const authenticated = await userIsLoggedIn(cookies)

    if (!authenticated) {
        ctx.res.writeHead(302, { Location: "/login" })
        ctx.res.end()
        return { props: {} }
    }

    return {
        props: {},
    }
}
