"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import firebase from "../../../../firebase/clientApp" // Assuming this path is correct
import Link from "next/link"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"

interface InventoryItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface SelectedMed {
  id: string
  name: string
  price: number
  quantity: number
}

interface Patient {
  name: string
  email: string
  birthdate: string
  sex: string
}

export default function NuevaConsulta() {
  const router = useRouter()
  const { id: patientId } = router.query
  const db = firebase.firestore()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [symptoms, setSymptoms] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [prescription, setPrescription] = useState("")
  const [consultationPrice, setConsultationPrice] = useState<number>(0)
  const [selectedMeds, setSelectedMeds] = useState<SelectedMed[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedMedId, setSelectedMedId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!patientId) return

    const fetchPatient = async () => {
      const doc = await db
          .collection("patients")
          .doc(patientId as string)
          .get()
      if (doc.exists) setPatient(doc.data() as Patient)
    }

    const fetchInventory = async () => {
      const snapshot = await db.collection("inventory").get()
      const items = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name,
          price: Number.parseFloat(data.price),
          quantity: Number.parseInt(data.quantity),
        }
      })
      setInventory(items)
    }

    fetchPatient()
    fetchInventory()

    // Set today's date as default
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
  }, [patientId])

  const handleAddMedication = () => {
    if (!selectedMedId || selectedQuantity < 1) return
    const med = inventory.find((item) => item.id === selectedMedId)
    if (!med || selectedQuantity > med.quantity) return

    const alreadyAdded = selectedMeds.find((m) => m.id === med.id)
    if (alreadyAdded) {
      const newQuantity = alreadyAdded.quantity + selectedQuantity
      if (newQuantity > med.quantity) return
      setSelectedMeds((prev) => prev.map((m) => (m.id === med.id ? { ...m, quantity: newQuantity } : m)))
    } else {
      setSelectedMeds((prev) => [
        ...prev,
        {
          id: med.id,
          name: med.name,
          price: med.price,
          quantity: selectedQuantity,
        },
      ])
    }

    setSelectedMedId("")
    setSelectedQuantity(1)
  }

  const handleRemoveMedication = (id: string) => {
    setSelectedMeds((prev) => prev.filter((m) => m.id !== id))
  }

  const getRemainingQuantity = (medId: string): number => {
    const invItem = inventory.find((i) => i.id === medId)
    const selected = selectedMeds.find((m) => m.id === medId)
    if (!invItem) return 0
    return invItem.quantity - (selected?.quantity || 0)
  }

  const totalMedsPrice = selectedMeds.reduce((sum, m) => sum + m.price * m.quantity, 0)
  const total = totalMedsPrice + consultationPrice

  const handleSubmit = async () => {
    if (!patientId || !selectedDate) return

    setIsSubmitting(true)

    try {
      await db.collection("consultations").add({
        patientId,
        symptoms,
        diagnosis,
        prescription,
        consultationPrice,
        medications: selectedMeds,
        total,
        date: firebase.firestore.Timestamp.fromDate(new Date(selectedDate)),
      })

      const batch = db.batch()
      selectedMeds.forEach((med) => {
        const medRef = db.collection("inventory").doc(med.id)
        const remaining = inventory.find((i) => i.id === med.id)?.quantity || 0
        const newQuantity = remaining - med.quantity
        batch.update(medRef, { quantity: newQuantity })
      })

      await batch.commit()
      router.push(`/pacientes/${patientId}/consultas`)
    } catch (error) {
      console.error("Error al guardar la consulta:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <Shell>
        <Content title="Nueva Consulta Médica">
          <div className="max-w-4xl mx-auto">
            {/* Navigation */}
            <div className="mb-4">
              <Link href={`/pacientes/${patientId}/consultas`} passHref>
                <a className="text-blue-600 hover:text-blue-800 transition-colors">← Volver al expediente</a>
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Patient Information Header */}
              {patient && (
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Información del Paciente</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Nombre:</span> {patient.name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Correo:</span> {patient.email}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Nacimiento:</span> {patient.birthdate}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Género:</span> {patient.sex}
                      </div>
                    </div>
                  </div>
              )}

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Información de la Consulta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="consultationPrice" className="block text-sm font-medium text-gray-700 mb-1">
                        Precio de la consulta
                      </label>
                      <input
                          id="consultationPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={consultationPrice}
                          onChange={(e) => setConsultationPrice(Number.parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label htmlFor="selectedDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de consulta
                      </label>
                      <input
                          id="selectedDate"
                          type="date"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Información Médica</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                        Síntomas
                      </label>
                      <textarea
                          id="symptoms"
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={symptoms}
                          onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Describa los síntomas del paciente..."
                      />
                    </div>

                    <div>
                      <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                        Diagnóstico
                      </label>
                      <textarea
                          id="diagnosis"
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Escriba el diagnóstico..."
                      />
                    </div>

                    <div>
                      <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Receta Médica
                      </label>
                      <textarea
                          id="prescription"
                          rows={3}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="Escriba las indicaciones médicas..."
                      />
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Medicamentos</h3>

                  {/* Add Medication */}
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1">
                        <label htmlFor="medicationSelect" className="block text-sm font-medium text-gray-700 mb-1">
                          Seleccionar medicamento
                        </label>
                        <select
                            id="medicationSelect"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                            value={selectedMedId}
                            onChange={(e) => setSelectedMedId(e.target.value)}
                        >
                          <option value="">Seleccionar medicamento</option>
                          {inventory.map((item) => {
                            const remaining = getRemainingQuantity(item.id)
                            if (remaining <= 0) return null
                            return (
                                <option key={item.id} value={item.id}>
                                  {item.name} - C${item.price.toFixed(2)} ({remaining} disponibles)
                                </option>
                            )
                          })}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                            id="quantity"
                            type="number"
                            min={1}
                            max={selectedMedId ? getRemainingQuantity(selectedMedId) : undefined}
                            className="block w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(Number.parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <button
                          type="button"
                          onClick={handleAddMedication}
                          disabled={!selectedMedId || selectedQuantity < 1}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Selected Medications */}
                  {selectedMeds.length > 0 && (
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h4 className="font-medium text-gray-800">Medicamentos Seleccionados</h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {selectedMeds.map((m) => (
                              <div key={m.id} className="px-4 py-3 flex justify-between items-center">
                                <div className="text-sm">
                                  <span className="font-medium">{m.name}</span>
                                  <span className="text-gray-600 ml-2">
                              {m.quantity} × C${m.price.toFixed(2)} = C${(m.price * m.quantity).toFixed(2)}
                            </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedication(m.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                                >
                                  Quitar
                                </button>
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <div>Consulta: C${consultationPrice.toFixed(2)}</div>
                      <div>Medicamentos: C${totalMedsPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">Total: C${total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
                  <Link href={`/pacientes/${patientId}/consultas`} passHref>
                    <a className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                      Cancelar
                    </a>
                  </Link>
                  <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || !selectedDate}
                      className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Consulta"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Content>
      </Shell>
  )
}
