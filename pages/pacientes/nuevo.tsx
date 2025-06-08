"use client"

import React, { useState } from "react"
import firebase from "../../firebase/clientApp" // Assuming this path is correct
import { useRouter } from "next/router"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Assuming these are custom components provided by the user's project
import Content from "../../components/content/Content"
import Shell from "../../components/shell"

export default function NuevoPaciente() {
    const router = useRouter()
    const db = firebase.firestore()

    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [birthdate, setBirthdate] = useState("")
    const [sex, setSex] = useState("")
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false) // State for loading indicator on buttons

    const validarCorreo = (correo: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(correo)
    }

    const registrarPaciente = async (redirigir: boolean) => {
        setError("")
        setIsSubmitting(true)

        if (!email || !firstName || !lastName || !birthdate || !sex) {
            setError("Todos los campos son obligatorios.")
            setIsSubmitting(false)
            return
        }

        if (!validarCorreo(email)) {
            setError("El correo no tiene un formato válido.")
            setIsSubmitting(false)
            return
        }

        try {
            let uid: string | null = null

            const userSnap = await db.collection("users").where("email", "==", email).limit(1).get()

            if (!userSnap.empty) {
                uid = userSnap.docs[0].id

                const existingPatient = await db.collection("patients").where("uid", "==", uid).limit(1).get()

                if (!existingPatient.empty) {
                    setError("Este usuario ya está registrado como paciente.")
                    setIsSubmitting(false)
                    return
                }
            } else {
                const newUser = await db.collection("users").add({
                    email,
                    createdAt: firebase.firestore.Timestamp.now(),
                })
                uid = newUser.id
            }

            const nuevoPaciente = await db.collection("patients").add({
                uid,
                email,
                name: `${firstName} ${lastName}`,
                birthdate,
                sex,
                createdAt: firebase.firestore.Timestamp.now(),
            })

            toast.success("Paciente registrado exitosamente")

            setEmail("")
            setFirstName("")
            setLastName("")
            setBirthdate("")
            setSex("")

            setTimeout(() => {
                if (redirigir) {
                    router.push(`/pacientes/${nuevoPaciente.id}/consultas/nueva`)
                } else {
                    router.push("/pacientes")
                }
            }, 1500)
        } catch (err) {
            console.error(err)
            setError("Error al registrar paciente.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Shell>
            <Content title="Registrar nuevo paciente">
                {/* Se ha añadido un div envolvente aquí para que sea un único children */}
                <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-6 text-center">
                        Complete los siguientes campos para registrar un nuevo paciente en el sistema.
                    </p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">¡Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Correo electrónico
                        </label>
                        <input
                            id="email"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            type="email"
                            placeholder="ejemplo@dominio.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={error && !validarCorreo(email) ? "true" : "false"}
                            aria-describedby="email-error"
                        />
                        {error && !validarCorreo(email) && (
                            <p className="mt-1 text-sm text-red-600" id="email-error">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre
                            </label>
                            <input
                                id="firstName"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Nombre del paciente"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido
                            </label>
                            <input
                                id="lastName"
                                className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Apellido del paciente"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha de nacimiento
                        </label>
                        <input
                            id="birthdate"
                            type="date"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">
                            Género
                        </label>
                        <select
                            id="sex"
                            className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                        >
                            <option value="">Seleccione género</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={() => registrarPaciente(false)}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                            onClick={() => registrarPaciente(true)}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Guardando y creando..." : "Guardar y crear consulta"}
                        </button>
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
