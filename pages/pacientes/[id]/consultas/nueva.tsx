import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import firebase from "../../../../firebase/clientApp"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Lucide React icons
import {
  User,
  Calendar,
  Stethoscope,
  Pill,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Save,
  X,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  FileText,
  DollarSign,
} from "lucide-react"

// Custom components
import Shell from "../../../../components/shell"
import Content from "../../../../components/content/Content"
import type {GetServerSidePropsContext} from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../../../../firebase/auth/utils.server";

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

interface ValidationErrors {
  [key: string]: string
}

export default function NuevaConsulta() {
  const router = useRouter()
  const { id: patientId } = router.query
  const db = firebase.firestore()

  // Estados principales
  const [currentStep, setCurrentStep] = useState(1)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Estados del formulario
  const [consultationData, setConsultationData] = useState({
    symptoms: "",
    diagnosis: "",
    prescription: "",
    consultationPrice: "",
    selectedDate: "",
    notes: "",
  })

  const [selectedMeds, setSelectedMeds] = useState<SelectedMed[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedMedId, setSelectedMedId] = useState("")
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  useEffect(() => {
    if (!patientId) return

    const fetchData = async () => {
      try {
        const [patientDoc, inventorySnapshot] = await Promise.all([
          db
              .collection("patients")
              .doc(patientId as string)
              .get(),
          db.collection("inventory").get(),
        ])

        if (patientDoc.exists) {
          setPatient(patientDoc.data() as Patient)
        }

        const items = inventorySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name,
            price: Number.parseFloat(data.price) || 0,
            quantity: Number.parseInt(data.quantity) || 0,
          }
        })
        setInventory(items)

        // Establecer fecha de hoy por defecto
        const today = new Date().toISOString().split("T")[0]
        setConsultationData((prev) => ({ ...prev, selectedDate: today }))
      } catch (error) {
        console.error("Error al cargar datos:", error)
        toast.error("Error al cargar la información")
      }
    }

    fetchData()
  }, [patientId, db])

  // Validaciones
  const validateField = (field: string, value: string | number): string => {
    switch (field) {
      case "symptoms":
        return typeof value === "string" && value.trim().length < 10 ? "Mínimo 10 caracteres" : ""
      case "diagnosis":
        return typeof value === "string" && value.trim().length < 5 ? "Mínimo 5 caracteres" : ""
      case "consultationPrice":
        return typeof value === "number" && value <= 0 ? "El precio debe ser mayor a 0" : ""
      case "selectedDate":
        return !value ? "La fecha es obligatoria" : ""
      default:
        return ""
    }
  }

  const handleInputChange = (field: keyof typeof consultationData, value: string) => {
    setConsultationData((prev) => ({ ...prev, [field]: value }))

    // Validación en tiempo real
    const error = validateField(field, value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {}

    if (step === 1) {
      if (!consultationData.selectedDate) newErrors.selectedDate = "Campo obligatorio"
      if (Number.parseFloat(consultationData.consultationPrice || "0") <= 0)
        newErrors.consultationPrice = "El precio debe ser mayor a 0"
    }
    if (step === 2) {
      if (!consultationData.symptoms.trim()) newErrors.symptoms = "Campo obligatorio"
      else if (validateField("symptoms", consultationData.symptoms))
        newErrors.symptoms = validateField("symptoms", consultationData.symptoms)

      if (!consultationData.diagnosis.trim()) newErrors.diagnosis = "Campo obligatorio"
      else if (validateField("diagnosis", consultationData.diagnosis))
        newErrors.diagnosis = validateField("diagnosis", consultationData.diagnosis)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Funciones de medicamentos
  const handleAddMedication = () => {
    if (!selectedMedId || selectedQuantity < 1) {
      toast.error("Seleccione un medicamento y cantidad válida")
      return
    }

    const med = inventory.find((item) => item.id === selectedMedId)
    if (!med || selectedQuantity > getRemainingQuantity(selectedMedId)) {
      toast.error("Cantidad no disponible en inventario")
      return
    }

    const alreadyAdded = selectedMeds.find((m) => m.id === med.id)
    if (alreadyAdded) {
      const newQuantity = alreadyAdded.quantity + selectedQuantity
      if (newQuantity > med.quantity) {
        toast.error("Cantidad excede el inventario disponible")
        return
      }
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
    toast.success("Medicamento agregado")
  }

  const handleRemoveMedication = (id: string) => {
    setSelectedMeds((prev) => prev.filter((m) => m.id !== id))
    toast.info("Medicamento removido")
  }

  const updateMedicationQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    const med = inventory.find((item) => item.id === id)
    if (!med || newQuantity > med.quantity) {
      toast.error("Cantidad no disponible")
      return
    }

    setSelectedMeds((prev) => prev.map((m) => (m.id === id ? { ...m, quantity: newQuantity } : m)))
  }

  const getRemainingQuantity = (medId: string): number => {
    const invItem = inventory.find((i) => i.id === medId)
    const selected = selectedMeds.find((m) => m.id === medId)
    if (!invItem) return 0
    return invItem.quantity - (selected?.quantity || 0)
  }

  // Cálculos
  const priceNum = Number.parseFloat(consultationData.consultationPrice || "0")
  const totalMedsPrice = selectedMeds.reduce((sum, m) => sum + m.price * m.quantity, 0)
  const total = totalMedsPrice + priceNum

  const getCompletedFields = () => {
    const req = ["selectedDate", "consultationPrice", "symptoms", "diagnosis"]
    return req.filter((f) => {
      const val = consultationData[f as keyof typeof consultationData]
      return typeof val === "string"
          ? val.trim().length > 0 && (f !== "consultationPrice" || priceNum > 0)
          : !!val
    }).length
  }

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

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }
    setIsSubmitting(true)
    try {
      await db.collection("consultations").add({
        patientId,
        symptoms: consultationData.symptoms,
        diagnosis: consultationData.diagnosis,
        prescription: consultationData.prescription,
        consultationPrice: priceNum,          // <-- número limpio
        medications: selectedMeds,
        total,
        notes: consultationData.notes,
        date: firebase.firestore.Timestamp.fromDate(new Date(consultationData.selectedDate)),
        createdAt: firebase.firestore.Timestamp.now(),
      })
      // Actualizar inventario y redirigir (sin cambios)...
      toast.success("Consulta guardada exitosamente")
      setTimeout(() => {
        router.push(`/pacientes/${patientId}/consultas`)
      }, 1500)
    } catch (error) {
      console.error("Error al guardar la consulta:", error)
      toast.error("Error al guardar la consulta")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Renderizado de pasos
  const renderStep1 = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Información Básica</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Obligatorio</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="selectedDate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Fecha de consulta <span className="text-red-500">*</span>
            </label>
            <input
                id="selectedDate"
                type="date"
                value={consultationData.selectedDate}
                onChange={(e) => handleInputChange("selectedDate", e.target.value)}
                className={`block w-full px-4 py-2 border ${
                    errors.selectedDate ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
            />
            {errors.selectedDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.selectedDate}
                </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="consultationPrice" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <DollarSign className="h-4 w-4"/>
              Precio de consulta <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500 text-sm">C$</span>
              {/* Precio de consulta */}
              <input
                  id="consultationPrice"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={consultationData.consultationPrice}
                  onChange={(e) => {
                    let raw = e.target.value
                    // 1) Quitar cualquier caracter que no sea dígito
                    raw = raw.replace(/\D/g, "")
                    // 2) Eliminar ceros iniciales solo si quedan más dígitos
                    raw = raw.replace(/^0+(?=\d)/, "")
                    handleInputChange("consultationPrice", raw)
                  }}
                  className={`block w-full pl-8 pr-4 py-2 border ${
                      errors.consultationPrice ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                  placeholder="1.00"
              />
            </div>
            {errors.consultationPrice && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3"/>
                  {errors.consultationPrice}
                </p>
            )}
          </div>
        </div>
      </div>
  )

  const renderStep2 = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="h-5 w-5 text-blue-600"/>
          <h3 className="text-lg font-semibold">Información Médica</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Obligatorio</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="symptoms" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4"/>
              Síntomas <span className="text-red-500">*</span>
            </label>
            <textarea
                id="symptoms"
                rows={4}
                value={consultationData.symptoms}
                onChange={(e) => handleInputChange("symptoms", e.target.value)}
                className={`block w-full px-4 py-2 border ${
                    errors.symptoms ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                placeholder="Describa los síntomas reportados por el paciente..."
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{consultationData.symptoms.length} caracteres</span>
              <span>Mínimo 10 caracteres</span>
            </div>
            {errors.symptoms && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.symptoms}
                </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="diagnosis" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Stethoscope className="h-4 w-4" />
              Diagnóstico <span className="text-red-500">*</span>
            </label>
            <textarea
                id="diagnosis"
                rows={4}
                value={consultationData.diagnosis}
                onChange={(e) => handleInputChange("diagnosis", e.target.value)}
                className={`block w-full px-4 py-2 border ${
                    errors.diagnosis ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                placeholder="Escriba el diagnóstico médico..."
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{consultationData.diagnosis.length} caracteres</span>
              <span>Mínimo 5 caracteres</span>
            </div>
            {errors.diagnosis && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.diagnosis}
                </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="prescription" className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Receipt className="h-4 w-4" />
              Receta Médica
            </label>
            <textarea
                id="prescription"
                rows={3}
                value={consultationData.prescription}
                onChange={(e) => handleInputChange("prescription", e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                placeholder="Escriba las indicaciones médicas y tratamiento..."
            />
          </div>
        </div>
      </div>
  )

  const renderStep3 = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Pill className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Medicamentos</h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Opcional</span>
        </div>

        {/* Agregar medicamento */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Agregar Medicamento</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-2">
              <label htmlFor="medicationSelect" className="text-sm font-medium text-gray-700">
                Medicamento
              </label>
              <select
                  id="medicationSelect"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
              >
                <option value="">Seleccionar medicamento</option>
                {inventory
                    .filter((item) => getRemainingQuantity(item.id) > 0)
                    .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} - C${item.price.toFixed(2)} ({getRemainingQuantity(item.id)} disponibles)
                        </option>
                    ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Cantidad
              </label>
              {/* Cantidad de medicamento */}
              <input
                  id="quantity"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={selectedQuantity.toString()}
                  onChange={(e) => {
                    // Solo dígitos, luego parseo a número y mínimo 1
                    const raw = e.target.value.replace(/\D/g, "")
                    const num = Number(raw)
                    setSelectedQuantity(num >= 1 ? num : 1)
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <button
                type="button"
                onClick={handleAddMedication}
                disabled={!selectedMedId || selectedQuantity < 1}
                className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </button>
          </div>
        </div>

        {/* Medicamentos seleccionados */}
        {selectedMeds.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-800">Medicamentos Seleccionados ({selectedMeds.length})</h4>
              </div>
              <div className="divide-y divide-gray-200">
                {selectedMeds.map((med) => (
                    <div key={med.id} className="px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{med.name}</h5>
                          <p className="text-sm text-gray-600">
                            C${med.price.toFixed(2)} × {med.quantity} = C${(med.price * med.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                              onClick={() => updateMedicationQuantity(med.id, med.quantity - 1)}
                              disabled={med.quantity <= 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{med.quantity}</span>
                          <button
                              onClick={() => updateMedicationQuantity(med.id, med.quantity + 1)}
                              disabled={med.quantity >= (inventory.find((i) => i.id === med.id)?.quantity || 0)}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                              onClick={() => handleRemoveMedication(med.id)}
                              className="ml-2 p-1 text-red-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {selectedMeds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No se han agregado medicamentos</p>
              <p className="text-sm">Los medicamentos son opcionales para la consulta</p>
            </div>
        )}
      </div>
  )

  const renderStep4 = () => (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Resumen de la Consulta</h3>
        </div>

        {/* Resumen de información */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Información de la Consulta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Fecha:</span>{" "}
              {new Date(consultationData.selectedDate).toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div>
              <span className="font-medium text-gray-600">Precio consulta:</span> C$
              {consultationData.consultationPrice}
            </div>
          </div>
        </div>

        {/* Resumen médico */}
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Síntomas</h5>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{consultationData.symptoms}</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Diagnóstico</h5>
            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{consultationData.diagnosis}</p>
          </div>
          {consultationData.prescription && (
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Receta Médica</h5>
                <p className="text-sm text-gray-600 bg-white p-3 rounded border">{consultationData.prescription}</p>
              </div>
          )}
        </div>

        {/* Resumen de medicamentos */}
        {selectedMeds.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Medicamentos ({selectedMeds.length})</h5>
              <div className="bg-white border rounded-lg divide-y divide-gray-200">
                {selectedMeds.map((med) => (
                    <div key={med.id} className="px-3 py-2 flex justify-between text-sm">
                      <span>{med.name}</span>
                      <span>
                  {med.quantity} × C${med.price.toFixed(2)} = C${(med.price * med.quantity).toFixed(2)}
                </span>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* Total */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-700">
              <div>Consulta: C${consultationData.consultationPrice}</div>
              <div>Medicamentos: C${totalMedsPrice.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-800">Total: C${total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Notas adicionales */}
        <div className="space-y-2">
          <label htmlFor="notes" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="h-4 w-4" />
            Notas Adicionales
          </label>
          <textarea
              id="notes"
              rows={3}
              value={consultationData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Notas adicionales sobre la consulta (opcional)..."
          />
        </div>
      </div>
  )

  return (
      <Shell>
        <Content title="Nueva Consulta Médica">
          <div className="max-w-4xl mx-auto">
            {/* Navegación */}
            <div className="mb-6">
              <button
                  onClick={() => router.back()}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al expediente
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {/* Información del paciente */}
              {patient && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Información del Paciente</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Nombre:</span>
                        <span className="text-gray-900">{patient.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Edad:</span>
                        <span className="text-gray-900">{calculateAge(patient.birthdate)} años</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Género:</span>
                        <span className="text-gray-900">{patient.sex}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Correo:</span>
                        <span className="text-gray-900 truncate">{patient.email}</span>
                      </div>
                    </div>
                  </div>
              )}

              {/* Indicador de progreso */}
              <div className="p-6 border-b border-gray-200">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Nueva Consulta Médica</h2>
                  <p className="text-gray-600 mt-1">
                    Paso {currentStep} de {totalSteps} - Complete la información de la consulta
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">{getCompletedFields()}/4 campos obligatorios completados</span>
                </div>
              </div>

              {/* Contenido del formulario */}
              <div className="p-6">
                <div className="space-y-6">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}

                  <hr className="my-6 border-gray-200" />

                  {/* Botones de navegación */}
                  <div className="flex justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md transition-colors ${
                            currentStep === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Anterior
                    </button>

                    <div className="flex gap-2">
                      {currentStep < totalSteps ? (
                          <button
                              onClick={nextStep}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            Siguiente
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </button>
                      ) : (
                          <>
                            <button
                                onClick={() => router.back()}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {isSubmitting ? "Guardando..." : "Guardar Consulta"}
                            </button>
                          </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
          </div>
        </Content>
      </Shell>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const cookies = nookies.get(ctx);
  const authenticated = await userIsLoggedIn(cookies);

  if (!authenticated) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: {}, // aquí tus props reales si las tuvieras
  };
}
