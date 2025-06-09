"use client"

import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import firebase from "../../../../firebase/clientApp"
import { toast } from "react-toastify"

// Lucide React icons
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Users,
  Stethoscope,
  FileText,
  Pill,
  Receipt,
  DollarSign,
  Clock,
  Printer,
  Share2,
  AlertCircle,
  CreditCard,
} from "lucide-react"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"

type Medication = {
  id: string
  name: string
  quantity: number
  price: number
}

type Consulta = {
  id: string
  date: string
  consultationPrice: number
  symptoms: string
  diagnosis: string
  prescription: string
  medications: Medication[]
  total: number
  notes?: string
  createdAt?: string
}

type Paciente = {
  name: string
  email: string
  birthdate: string
  sex: string
  dni?: string
  emergencyNumber?: string
}

export default function DetalleConsulta() {
  const router = useRouter()
  const { id: pacienteId, consultaId } = router.query

  const [consulta, setConsulta] = useState<Consulta | null>(null)
  const [paciente, setPaciente] = useState<Paciente | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pacienteId || !consultaId) return

    const fetchData = async () => {
      try {
        const [consultaDoc, pacienteDoc] = await Promise.all([
          firebase
              .firestore()
              .collection("consultations")
              .doc(consultaId as string)
              .get(),
          firebase
              .firestore()
              .collection("patients")
              .doc(pacienteId as string)
              .get(),
        ])

        const consultaData = consultaDoc.data()
        const pacienteData = pacienteDoc.data()

        if (!consultaData) {
          toast.error("Consulta no encontrada")
          return
        }

        setConsulta({
          id: consultaDoc.id,
          ...consultaData,
          date:
              consultaData.date?.toDate()?.toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              }) || "Fecha inválida",
          total: typeof consultaData.total === "number" ? consultaData.total : 0,
        } as Consulta)

        if (pacienteData) setPaciente(pacienteData as Paciente)
      } catch (err) {
        console.error("Error al cargar los datos:", err)
        toast.error("Error al cargar la información de la consulta")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pacienteId, consultaId])

  // Función para calcular edad
  const calculateAge = (birthdate: string): number => {
    const today = new Date()
    const birthDate = new Date(birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  // Función para formatear fecha
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString("es-ES", options)
  }

  // Función para imprimir
  const handlePrint = () => {
    window.print()
  }

  // Función para compartir
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Consulta médica - ${paciente?.name}`,
          text: `Consulta del ${consulta?.date}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error al compartir:", error)
      }
    } else {
      // Fallback: copiar URL al clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success("Enlace copiado al portapapeles")
    }
  }

  // Determinar el género para mostrar el color apropiado
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

  if (loading) {
    return (
        <Shell>
          <Content title="Cargando consulta...">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Skeleton loading */}
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </Content>
        </Shell>
    )
  }

  if (!consulta) {
    return (
        <Shell>
          <Content title="Consulta no encontrada">
            <div className="max-w-md mx-auto text-center py-12">
              <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Consulta no encontrada</h3>
                <p className="text-gray-600 mb-6">No se pudo encontrar la consulta solicitada.</p>
                <button
                    onClick={() => router.push(`/pacientes/${pacienteId}/consultas`)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al expediente
                </button>
              </div>
            </div>
          </Content>
        </Shell>
    )
  }

  const genderInfo = paciente ? getGenderInfo(paciente.sex) : null

  return (
      <Shell>
        <Content title="Detalle de Consulta">
          <div className="max-w-4xl mx-auto">
            {/* Navegación y acciones */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <button
                  onClick={() => router.push(`/pacientes/${pacienteId}/consultas`)}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al expediente
              </button>

              <div className="flex gap-2">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </button>
                <button
                    onClick={handleShare}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Header de la consulta */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        Consulta Médica
                      </h1>
                      <p className="text-lg text-gray-700 mt-1">{consulta.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total de la consulta</div>
                      <div className="text-2xl font-bold text-green-700">C${consulta.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del paciente */}
              {paciente && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {genderInfo && <div className={`h-2 w-full ${genderInfo.bgColor}`}></div>}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-800">Información del Paciente</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 min-w-[80px]">Nombre:</span>
                            <span className="text-gray-900">{paciente.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-600 min-w-[80px]">Correo:</span>
                            <span className="text-gray-900 truncate">{paciente.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-600 min-w-[80px]">Nacimiento:</span>
                            <span className="text-gray-900">{formatDate(paciente.birthdate)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-600 min-w-[80px]">Género:</span>
                            {genderInfo && (
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${genderInfo.bgColor} ${genderInfo.textColor} ${genderInfo.borderColor} border`}
                                >
                            {genderInfo.label}
                          </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-600 min-w-[80px]">Edad:</span>
                            <span className="text-gray-900">{calculateAge(paciente.birthdate)} años</span>
                          </div>
                          {paciente.dni && (
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-gray-400" />
                                <span className="font-medium text-gray-600 min-w-[80px]">DNI:</span>
                                <span className="text-gray-900">{paciente.dni}</span>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {/* Información médica */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Stethoscope className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Información Médica</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Síntomas */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-700">Síntomas Reportados</h3>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-800 leading-relaxed">
                          {consulta.symptoms || "No se registraron síntomas específicos."}
                        </p>
                      </div>
                    </div>

                    {/* Diagnóstico */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-700">Diagnóstico</h3>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-gray-800 leading-relaxed">
                          {consulta.diagnosis || "No se registró diagnóstico específico."}
                        </p>
                      </div>
                    </div>

                    {/* Receta médica */}
                    {consulta.prescription && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Receipt className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold text-gray-700">Receta Médica</h3>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-gray-800 leading-relaxed">{consulta.prescription}</p>
                          </div>
                        </div>
                    )}

                    {/* Notas adicionales */}
                    {consulta.notes && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-gray-700">Notas Adicionales</h3>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-gray-800 leading-relaxed">{consulta.notes}</p>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medicamentos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Pill className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      Medicamentos {consulta.medications?.length ? `(${consulta.medications.length})` : ""}
                    </h2>
                  </div>

                  {consulta.medications?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Medicamento</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                            <th className="text-center py-3 px-4 font-semibold text-gray-700">Precio Unitario</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Subtotal</th>
                          </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                          {consulta.medications.map((med: Medication, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <Pill className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-gray-900">{med.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {med.quantity}
                              </span>
                                </td>
                                <td className="py-3 px-4 text-center text-gray-700">C${med.price.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-semibold text-gray-900">
                                  C${(med.quantity * med.price).toFixed(2)}
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No se prescribieron medicamentos</p>
                        <p className="text-sm">Esta consulta no incluye medicamentos.</p>
                      </div>
                  )}
                </div>
              </div>

              {/* Resumen financiero */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-800">Resumen Financiero</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Precio de consulta:</span>
                      <span className="font-medium text-gray-900">
                      C${consulta.consultationPrice?.toFixed(2) || "0.00"}
                    </span>
                    </div>

                    {consulta.medications?.length > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Medicamentos:</span>
                          <span className="font-medium text-gray-900">
                        C$
                            {consulta.medications.reduce((sum, med) => sum + med.quantity * med.price, 0).toFixed(2)}
                      </span>
                        </div>
                    )}

                    <hr className="border-gray-200" />

                    <div className="flex justify-between items-center py-3">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-green-700">C${consulta.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Content>
      </Shell>
  )
}
