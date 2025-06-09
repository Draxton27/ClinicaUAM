import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import firebase from "../../../firebase/clientApp"

// Importamos los iconos de Lucide React
import {
    User,
    Mail,
    Calendar,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Save,
    X,
} from "lucide-react"

// Componentes personalizados
import Content from "../../../components/content/Content"
import Shell from "../../../components/shell"
import type {GetServerSidePropsContext} from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../../../firebase/auth/utils.server";

interface PatientData {
    email: string
    firstName: string
    lastName: string
    birthdate: string
    sex: string
    emergencyNumber: string
    dni: string
    direccion: string
}

interface ValidationErrors {
    [key: string]: string
}

export default function EditarPaciente() {
    const router = useRouter()
    const { id } = router.query
    const db = firebase.firestore()

    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [originalData, setOriginalData] = useState<PatientData | null>(null)

    const [patientData, setPatientData] = useState<PatientData>({
        email: "",
        firstName: "",
        lastName: "",
        birthdate: "",
        sex: "",
        emergencyNumber: "",
        dni: "",
        direccion: "",
    })

    const totalSteps = 3
    const progress = (currentStep / totalSteps) * 100

    // Cargar datos del paciente
    useEffect(() => {
        const fetchPatientData = async () => {
            if (!id) return

            try {
                const doc = await db
                    .collection("patients")
                    .doc(id as string)
                    .get()

                if (!doc.exists) {
                    toast.error("Paciente no encontrado")
                    router.push("/pacientes")
                    return
                }

                const data = doc.data()
                if (data) {
                    // Separar el nombre completo en nombre y apellido
                    const nameParts = (data.name || "").split(" ")
                    const firstName = nameParts[0] || ""
                    const lastName = nameParts.slice(1).join(" ") || ""

                    const patientInfo: PatientData = {
                        email: data.email || "",
                        firstName,
                        lastName,
                        birthdate: data.birthdate || "",
                        sex: data.sex || "",
                        emergencyNumber: data.emergencyNumber || "",
                        dni: data.dni || "",
                        direccion: data.direccion || "",
                    }

                    setPatientData(patientInfo)
                    setOriginalData(patientInfo)
                }
            } catch (error) {
                console.error("Error al cargar datos del paciente:", error)
                toast.error("Error al cargar los datos del paciente")
            } finally {
                setIsLoading(false)
            }
        }

        fetchPatientData()
    }, [id, db, router])

    // Validación en tiempo real
    const validateField = (field: string, value: string): string => {
        if (field === "email") {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            return !emailRegex.test(value) ? "Formato de correo inválido" : ""
        } else if (field === "firstName" || field === "lastName") {
            return value.length < 2 ? "Mínimo 2 caracteres" : ""
        } else if (field === "dni") {
            return value && !/^\d{3}-?\d{6}-?\d{4}[A-Za-z]?$/.test(value) ? "Formato de DNI inválido" : ""
        } else if (field === "emergencyNumber") {
            return value && !/^\d{4}-?\d{4}$/.test(value) ? "Formato: 8888-8888" : ""
        } else {
            return ""
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setPatientData((prev) => ({ ...prev, [field]: value }))

        // Validación en tiempo real
        const error = validateField(field, value)
        setErrors((prev) => ({ ...prev, [field]: error }))
    }

    const validateStep = (step: number): boolean => {
        const newErrors: ValidationErrors = {}

        if (step === 1) {
            // Campos obligatorios del paso 1
            if (!patientData.firstName) newErrors.firstName = "Campo obligatorio"
            if (!patientData.lastName) newErrors.lastName = "Campo obligatorio"
            if (!patientData.email) newErrors.email = "Campo obligatorio"
            else if (validateField("email", patientData.email)) newErrors.email = validateField("email", patientData.email)
        }

        if (step === 2) {
            // Campos obligatorios del paso 2
            if (!patientData.birthdate) newErrors.birthdate = "Campo obligatorio"
            if (!patientData.sex) newErrors.sex = "Campo obligatorio"
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

    const getCompletedFields = (): number => {
        const requiredFields = ["firstName", "lastName", "email", "birthdate", "sex"]
        return requiredFields.filter((field) => patientData[field as keyof PatientData]).length
    }

    // Verificar si hay cambios
    const hasChanges = (): boolean => {
        if (!originalData) return false
        return JSON.stringify(patientData) !== JSON.stringify(originalData)
    }

    const actualizarPaciente = async () => {
        if (!validateStep(1) || !validateStep(2)) {
            toast.error("Por favor complete todos los campos obligatorios")
            return
        }

        if (!hasChanges()) {
            toast.info("No se detectaron cambios para guardar")
            return
        }

        setIsSubmitting(true)

        try {
            // Verificar si el email cambió y ya existe en otro paciente
            if (patientData.email !== originalData?.email) {
                const emailQuery = await db.collection("patients").where("email", "==", patientData.email).get()

                const existingPatient = emailQuery.docs.find((doc) => doc.id !== id)
                if (existingPatient) {
                    toast.error("Ya existe otro paciente con este correo electrónico")
                    setIsSubmitting(false)
                    return
                }
            }

            // Actualizar datos del paciente
            await db
                .collection("patients")
                .doc(id as string)
                .update({
                    email: patientData.email,
                    name: `${patientData.firstName} ${patientData.lastName}`,
                    birthdate: patientData.birthdate,
                    sex: patientData.sex,
                    emergencyNumber: patientData.emergencyNumber,
                    dni: patientData.dni,
                    direccion: patientData.direccion,
                    updatedAt: firebase.firestore.Timestamp.now(),
                })

            // Si el email cambió, actualizar también en la colección users
            if (patientData.email !== originalData?.email) {
                const userQuery = await db.collection("users").where("email", "==", originalData?.email).get()

                if (!userQuery.empty) {
                    await db.collection("users").doc(userQuery.docs[0].id).update({
                        email: patientData.email,
                        updatedAt: firebase.firestore.Timestamp.now(),
                    })
                }
            }

            toast.success("Información del paciente actualizada exitosamente")
            setOriginalData(patientData) // Actualizar datos originales

            setTimeout(() => {
                router.push(`/pacientes/${id}/consultas`)
            }, 1500)
        } catch (err) {
            console.error(err)
            toast.error("Error al actualizar la información del paciente")
        } finally {
            setIsSubmitting(false)
        }
    }

    const cancelarEdicion = () => {
        if (hasChanges()) {
            if (window.confirm("¿Estás seguro de que quieres cancelar? Se perderán los cambios no guardados.")) {
                router.back()
            }
        } else {
            router.back()
        }
    }

    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Información Personal</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Obligatorio</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="firstName"
                        placeholder="Ingrese el nombre"
                        value={patientData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={`block w-full px-4 py-2 border ${
                            errors.firstName ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                    />
                    {errors.firstName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.firstName}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="lastName"
                        placeholder="Ingrese el apellido"
                        value={patientData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={`block w-full px-4 py-2 border ${
                            errors.lastName ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                    />
                    {errors.lastName && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.lastName}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Mail className="h-4 w-4" />
                    Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                    id="email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={patientData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`block w-full px-4 py-2 border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                />
                {errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                    </p>
                )}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Información Básica</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Obligatorio</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="birthdate" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="birthdate"
                        type="date"
                        value={patientData.birthdate}
                        onChange={(e) => handleInputChange("birthdate", e.target.value)}
                        className={`block w-full px-4 py-2 border ${
                            errors.birthdate ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                    />
                    {errors.birthdate && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.birthdate}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="sex" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        Género <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="sex"
                        value={patientData.sex}
                        onChange={(e) => handleInputChange("sex", e.target.value)}
                        className={`block w-full px-4 py-2 border ${
                            errors.sex ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-colors`}
                    >
                        <option value="">Seleccione género</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="Otro">Otro</option>
                    </select>
                    {errors.sex && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.sex}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="dni" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4" />
                    Número de Identificación (DNI)
                </label>
                <input
                    id="dni"
                    placeholder="001-260204-1006J"
                    value={patientData.dni}
                    onChange={(e) => handleInputChange("dni", e.target.value)}
                    className={`block w-full px-4 py-2 border ${
                        errors.dni ? "border-red-500" : "border-gray-300"
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                />
                {errors.dni && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.dni}
                    </p>
                )}
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Información de Contacto</h3>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Opcional</span>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="emergencyNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Phone className="h-4 w-4" />
                        Número de Emergencia
                    </label>
                    <input
                        id="emergencyNumber"
                        placeholder="8888-8888"
                        value={patientData.emergencyNumber}
                        onChange={(e) => handleInputChange("emergencyNumber", e.target.value)}
                        className={`block w-full px-4 py-2 border ${
                            errors.emergencyNumber ? "border-red-500" : "border-gray-300"
                        } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors`}
                    />
                    {errors.emergencyNumber && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.emergencyNumber}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="direccion" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <MapPin className="h-4 w-4" />
                        Dirección
                    </label>
                    <textarea
                        id="direccion"
                        placeholder="Dirección completa del paciente"
                        value={patientData.direccion}
                        onChange={(e) => handleInputChange("direccion", e.target.value)}
                        rows={3}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                </div>
            </div>

            {hasChanges() && (
                <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        Se han detectado cambios en la información. Asegúrate de guardar antes de salir.
                    </p>
                </div>
            )}

            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-sm text-green-700">Revisa la información antes de guardar los cambios.</p>
            </div>
        </div>
    )

    if (isLoading) {
        return (
            <Shell>
                <Content title="Cargando...">
                    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg border border-gray-200">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-10 bg-gray-200 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                </Content>
            </Shell>
        )
    }

    return (
        <Shell>
            <Content title="Editar información del paciente">
                <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg border border-gray-200">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Editar Información del Paciente</h2>
                        <p className="text-gray-600 mt-1">
                            Paso {currentStep} de {totalSteps} - Modifica la información del paciente
                        </p>

                        {/* Indicador de progreso */}
                        <div className="mt-4">
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

                        {/* Indicador de campos completados */}
                        <div className="flex items-center justify-center gap-2 mt-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-600">{getCompletedFields()}/5 campos obligatorios completados</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Contenido del paso actual */}
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}

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
                                            onClick={cancelarEdicion}
                                            disabled={isSubmitting}
                                            className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={actualizarPaciente}
                                            disabled={isSubmitting || !hasChanges()}
                                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSubmitting ? "Guardando..." : "Guardar cambios"}
                                        </button>
                                    </>
                                )}
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
