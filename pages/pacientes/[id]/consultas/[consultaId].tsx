"use client"

import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import firebase from "../../../../firebase/clientApp" // Assuming this path is correct
import Link from "next/link"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"

type Medication = {
  name: string
  quantity: number
  price: number
}

type Consulta = {
  date: string
  consultationPrice: number
  symptoms: string
  diagnosis: string
  prescription: string
  medications: Medication[]
  total: number
}

type Paciente = {
  name: string
  email: string
  birthdate: string
  sex: string
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

        if (!consultaData) return

        setConsulta({
          ...consultaData,
          date:
              consultaData.date?.toDate()?.toLocaleDateString("es-NI", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) || "Fecha inválida",
          total: typeof consultaData.total === "number" ? consultaData.total : 0,
        } as Consulta)

        if (pacienteData) setPaciente(pacienteData as Paciente)
      } catch (err) {
        console.error("Error al cargar los datos:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pacienteId, consultaId])

  if (loading)
    return (
        <Shell>
          <Content title="Detalle de Consulta">
            <div className="max-w-3xl mx-auto space-y-4">
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

  if (!consulta)
    return (
        <Shell>
          <Content title="Detalle de Consulta">
            <div className="max-w-3xl mx-auto text-center py-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Consulta no encontrada</h3>
                <p className="text-gray-600 mb-4">No se pudo encontrar la consulta solicitada.</p>
                <Link href={`/pacientes/${pacienteId}/consultas`} passHref>
                  <a className="text-blue-600 hover:text-blue-800 transition-colors">Volver al expediente</a>
                </Link>
              </div>
            </div>
          </Content>
        </Shell>
    )

  return (
      <Shell>
        <Content title="Detalle de Consulta">
          <div className="max-w-3xl mx-auto">
            {/* Navigation */}
            <div className="mb-4">
              <Link href={`/pacientes/${pacienteId}/consultas`} passHref>
                <a className="text-blue-600 hover:text-blue-800 transition-colors">← Volver al expediente</a>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              {/* Header with date and patient info */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-800">Consulta del {consulta.date}</h2>
                  <div className="text-sm text-gray-600">
                    Paciente: <span className="font-semibold">{paciente?.name}</span>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Información del Paciente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Nombre:</span> {paciente?.name}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Correo:</span> {paciente?.email}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Fecha de nacimiento:</span> {paciente?.birthdate}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Género:</span> {paciente?.sex}
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Detalles de la Consulta</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="font-medium text-gray-600">Fecha:</span> {consulta.date}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Precio de consulta:</span> C$
                    {consulta.consultationPrice?.toFixed(2) || "0.00"}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">Síntomas:</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {consulta.symptoms || "No se registraron síntomas específicos."}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">Diagnóstico:</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {consulta.diagnosis || "No se registró diagnóstico específico."}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-1">Receta Médica:</h4>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    {consulta.prescription || "No se prescribieron medicamentos específicos."}
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Medicamentos</h3>
                {consulta.medications?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Medicamento</th>
                          <th className="text-center py-2 px-3 font-medium text-gray-700">Cantidad</th>
                          <th className="text-center py-2 px-3 font-medium text-gray-700">Precio</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">Subtotal</th>
                        </tr>
                        </thead>
                        <tbody>
                        {consulta.medications.map((m: Medication, idx: number) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="py-2 px-3">{m.name}</td>
                              <td className="py-2 px-3 text-center">{m.quantity}</td>
                              <td className="py-2 px-3 text-center">C${m.price.toFixed(2)}</td>
                              <td className="py-2 px-3 text-right font-medium">C${(m.quantity * m.price).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No se agregaron medicamentos a esta consulta.</p>
                )}
              </div>

              {/* Total */}
              <div className="p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Total de la Consulta:</h3>
                  <span className="text-xl font-bold text-gray-800">C${consulta.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Content>
      </Shell>
  )
}
