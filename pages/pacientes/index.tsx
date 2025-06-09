"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import nookies from "nookies"
import firebase from "../../firebase/clientApp"
import { userIsLoggedIn } from "../../firebase/auth/utils.server"
import type { GetServerSidePropsContext } from "next"

// Lucide React icons
import { ArrowUpDown, Search, Filter, X } from "lucide-react"

// Custom components
import Shell from "../../components/shell"
import Content from "../../components/content/Content"
import PatientCard from "../../components/patients/patient-card"

type Paciente = {
  id: string
  name: string
  email: string
  birthdate: string
  sex: string
  dni?: string
  emergencyNumber?: string
  lastVisit?: string
  consultCount?: number
  direccion?: string
}

type SortConfig = {
  key: keyof Paciente
  direction: "asc" | "desc"
} | null

type SearchFilter = {
  type: "all" | "name" | "email" | "dni"
  label: string
}

const searchFilters: SearchFilter[] = [
  { type: "all", label: "Todo" },
  { type: "name", label: "Nombre" },
  { type: "email", label: "Correo" },
  { type: "dni", label: "Cédula" },
]

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchFilter, setSearchFilter] = useState<SearchFilter["type"]>("all")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [showFilters, setShowFilters] = useState(false)

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
            dni: d.dni || "",
            emergencyNumber: d.emergencyNumber || "",
            direccion: d.direccion || "",
            // Campos adicionales que podrían estar en la base de datos
            lastVisit: d.lastVisit || "",
            consultCount: d.consultCount || 0,
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

  // Función para normalizar cédulas (remover guiones y espacios)
  const normalizeDNI = (dni: string): string => {
    return dni.replace(/[-\s]/g, "").toLowerCase()
  }

  // Función de búsqueda mejorada
  const matchesSearch = (paciente: Paciente, term: string, filterType: SearchFilter["type"]): boolean => {
    if (!term.trim()) return true

    const searchTerm = term.toLowerCase().trim()

    switch (filterType) {
      case "name":
        return paciente.name.toLowerCase().includes(searchTerm)

      case "email":
        return paciente.email.toLowerCase().includes(searchTerm)

      case "dni":
        if (!paciente.dni) return false
        const normalizedPatientDNI = normalizeDNI(paciente.dni)
        const normalizedSearchTerm = normalizeDNI(searchTerm)
        return normalizedPatientDNI.includes(normalizedSearchTerm)

      case "all":
      default:
        // Búsqueda en todos los campos
        const nameMatch = paciente.name.toLowerCase().includes(searchTerm)
        const emailMatch = paciente.email.toLowerCase().includes(searchTerm)

        // Búsqueda de cédula normalizada
        let dniMatch = false
        if (paciente.dni) {
          const normalizedPatientDNI = normalizeDNI(paciente.dni)
          const normalizedSearchTerm = normalizeDNI(searchTerm)
          dniMatch = normalizedPatientDNI.includes(normalizedSearchTerm)
        }

        return nameMatch || emailMatch || dniMatch
    }
  }

  const sortedAndFiltered = () => {
    let filtered = pacientes.filter((p) => matchesSearch(p, searchTerm, searchFilter))

    if (sortConfig !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key]
        let bVal = b[sortConfig.key]

        // Manejar valores undefined o null
        if (aVal === undefined || aVal === null) aVal = ""
        if (bVal === undefined || bVal === null) bVal = ""

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

  const clearSearch = () => {
    setSearchTerm("")
    setSearchFilter("all")
  }

  const getSearchPlaceholder = () => {
    switch (searchFilter) {
      case "name":
        return "Buscar por nombre..."
      case "email":
        return "Buscar por correo electrónico..."
      case "dni":
        return "Buscar por cédula (ej: 001260204 o 001-260204-1006J)..."
      default:
        return "Buscar por nombre, correo o cédula..."
    }
  }

  const filteredResults = sortedAndFiltered()
  const hasActiveSearch = searchTerm.trim() !== "" || searchFilter !== "all"

  return (
      <Shell>
        <Content title="Pacientes registrados">
          <div>
            {/* Barra de búsqueda y filtros */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Campo de búsqueda */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                      type="text"
                      placeholder={getSearchPlaceholder()}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-10 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {hasActiveSearch && (
                      <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                  )}
                </div>

                {/* Botón de filtros y nuevo paciente */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 px-3 py-2 border ${
                          showFilters || searchFilter !== "all"
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {searchFilter !== "all" && (
                        <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">1</span>
                    )}
                  </button>

                  <Link href="/pacientes/nuevo" passHref>
                    <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 flex-1 sm:flex-none">
                      Registrar nuevo paciente
                    </a>
                  </Link>
                </div>
              </div>

              {/* Filtros de búsqueda */}
              {showFilters && (
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-700 font-medium mr-2 self-center">Buscar en:</span>
                    {searchFilters.map((filter) => (
                        <button
                            key={filter.type}
                            onClick={() => setSearchFilter(filter.type)}
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors px-3 py-1.5 ${
                                searchFilter === filter.type
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          {filter.label}
                        </button>
                    ))}
                  </div>
              )}

              {/* Indicador de resultados de búsqueda */}
              {hasActiveSearch && (
                  <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
                <span>
                  {filteredResults.length === 0
                      ? "No se encontraron pacientes"
                      : `${filteredResults.length} paciente${filteredResults.length !== 1 ? "s" : ""} encontrado${
                          filteredResults.length !== 1 ? "s" : ""
                      }`}
                  {searchFilter !== "all" && ` en ${searchFilters.find((f) => f.type === searchFilter)?.label}`}
                </span>
                    <button onClick={clearSearch} className="text-blue-600 hover:text-blue-800 font-medium">
                      Limpiar búsqueda
                    </button>
                  </div>
              )}
            </div>

            {/* Controles de ordenación */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-gray-700 font-medium mr-2 self-center">Ordenar por:</span>
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
                Edad {getSortIndicator("birthdate")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
              <button
                  onClick={() => handleSort("sex")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-gray-100 px-3 py-1.5 border border-gray-300 text-gray-700"
              >
                Género {getSortIndicator("sex")} <ArrowUpDown className="ml-2 h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Contenido principal */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow-md p-6 h-64 animate-pulse">
                        <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                      </div>
                  ))}
                </div>
            ) : filteredResults.length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm w-full max-w-md mx-auto text-center py-8">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-800">
                      {hasActiveSearch ? "No se encontraron pacientes" : "No hay pacientes registrados"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {hasActiveSearch
                          ? "Intenta ajustar los términos de búsqueda o filtros."
                          : "Parece que aún no has añadido ningún paciente."}
                    </p>
                  </div>
                  <div className="p-6 pt-0">
                    {hasActiveSearch ? (
                        <button
                            onClick={clearSearch}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 mr-2"
                        >
                          Limpiar búsqueda
                        </button>
                    ) : null}
                    <Link href="/pacientes/nuevo" passHref>
                      <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                        {hasActiveSearch ? "Registrar nuevo paciente" : "Registrar primer paciente"}
                      </a>
                    </Link>
                  </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.map((p) => (
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
