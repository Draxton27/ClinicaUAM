"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import nookies from "nookies"
import firebase from "../../firebase/clientApp" // Assuming this path is correct
import { userIsLoggedIn } from "../../firebase/auth/utils.server" // Assuming this path is correct
import type { GetServerSidePropsContext } from "next" // Import GetServerSidePropsContext

// Lucide React icons for sorting
import { ArrowUpDown } from "lucide-react"

// Custom components
import Shell from "../../components/shell"
import Content from "../../components/content/Content"
import PatientCard from "../../components/patients/patient-card" // Import the new PatientCard component

type Paciente = {
  id: string
  name: string
  email: string
  birthdate: string
  sex: string
}

type SortConfig = {
  key: keyof Paciente
  direction: "asc" | "desc"
} | null

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const snapshot = await firebase.firestore().collection("patients").get()
        const data = snapshot.docs.map((doc) => {
          const d = doc.data()
          return {
            id: doc.id,
            name: d.name || "",
            email: d.email || "",
            birthdate: d.birthdate || "",
            sex: d.sex || "",
          }
        })
        setPacientes(data)
      } catch (err) {
        console.error("Error al obtener pacientes:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPacientes()
  }, [])

  const sortedAndFiltered = () => {
    let filtered = pacientes.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

    if (sortConfig !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        if (typeof aVal === "string" && typeof bVal === "string") {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }

  const handleSort = (key: keyof Paciente) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      } else {
        return {
          key,
          direction: "asc",
        }
      }
    })
  }

  const getSortIndicator = (key: keyof Paciente) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓"
    }
    return ""
  }

  return (
      <Shell>
        <Content title="Pacientes registrados">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 max-w-sm"
              />
              <Link href="/pacientes/nuevo" passHref>
                <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto">
                  Registrar nuevo paciente
                </a>
              </Link>
            </div>

            {/* Controles de ordenación para la vista de tarjetas */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-gray-700 font-medium mr-2">Ordenar por:</span>
              <button
                  onClick={() => handleSort("name")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-gray-100 px-3 py-1.5 border border-gray-300 text-gray-700"
              >
                Nombre {getSortIndicator("name")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
              <button
                  onClick={() => handleSort("email")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-gray-100 px-3 py-1.5 border border-gray-300 text-gray-700"
              >
                Correo {getSortIndicator("email")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
              <button
                  onClick={() => handleSort("birthdate")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-gray-100 px-3 py-1.5 border border-gray-300 text-gray-700"
              >
                Nacimiento {getSortIndicator("birthdate")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
              <button
                  onClick={() => handleSort("sex")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-gray-100 px-3 py-1.5 border border-gray-300 text-gray-700"
              >
                Género {getSortIndicator("sex")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow-md p-6 h-48 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                  ))}
                </div>
            ) : sortedAndFiltered().length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm w-full max-w-md mx-auto text-center py-8">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-800">
                      No hay pacientes registrados
                    </h3>
                    <p className="text-sm text-gray-600">Parece que aún no has añadido ningún paciente.</p>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href="/pacientes/nuevo" passHref>
                      <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                        Registrar primer paciente
                      </a>
                    </Link>
                  </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedAndFiltered().map((p) => (
                      <PatientCard key={p.id} paciente={p} />
                  ))}
                </div>
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
