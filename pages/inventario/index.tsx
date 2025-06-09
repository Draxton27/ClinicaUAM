import React, { useEffect, useState } from "react"
import firebase from "../../firebase/clientApp" // Assuming this path is correct
import Shell from "../../components/shell"
import Content from "../../components/content/Content"
import Link from "next/link"
import { toast, ToastContainer } from "react-toastify"
import ModalConfirm from "../../components/ModalConfirm"
import type {GetServerSidePropsContext} from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../../firebase/auth/utils.server";

type Item = {
  id: string
  name: string
  quantity: number
  price: number
}

type SortConfig = {
  key: keyof Item
  direction: "asc" | "desc"
} | null

export default function Inventario() {
  const db = firebase.firestore()
  const [items, setItems] = useState<Item[]>([])
  const [editedItems, setEditedItems] = useState<Record<string, Partial<Item>>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [editingRow, setEditingRow] = useState<string | null>(null)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snapshot = await db.collection("inventory").get()
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[]
        setItems(data)
      } catch (err) {
        console.error("Error al obtener productos:", err)
        toast.error("Error al cargar el inventario")
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id)
    setShowConfirm(true)
  }

  const handleConfirmedDelete = async () => {
    if (!pendingDeleteId) return
    try {
      await db.collection("inventory").doc(pendingDeleteId).delete()
      setItems((prev) => prev.filter((item) => item.id !== pendingDeleteId))
      toast.success("Producto eliminado exitosamente")
    } catch (err) {
      toast.error("Error al eliminar el producto")
    } finally {
      setShowConfirm(false)
      setPendingDeleteId(null)
    }
  }

  const handleChange = (id: string, field: keyof Item, value: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "price" || field === "quantity" ? Number(value) : value,
      },
    }))
  }

  const handleSave = async (id: string) => {
    const changes = editedItems[id]
    if (!changes) return

    try {
      await db.collection("inventory").doc(id).update(changes)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
      toast.success("Producto actualizado")
      setEditedItems((prev) => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
      setEditingRow(null)
    } catch (err) {
      toast.error("Error al guardar los cambios")
    }
  }

  const handleCancelEdit = (id: string) => {
    setEditedItems((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
    setEditingRow(null)
  }

  const startEditing = (id: string) => {
    setEditingRow(id)
    // Initialize edited item if not already present
    if (!editedItems[id]) {
      const item = items.find((i) => i.id === id)
      if (item) {
        setEditedItems((prev) => ({
          ...prev,
          [id]: {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          },
        }))
      }
    }
  }

  const sortedAndFilteredItems = () => {
    let filtered = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

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

  const handleSort = (key: keyof Item) => {
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

  const getSortIndicator = (key: keyof Item) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === "asc" ? "↑" : "↓"
    }
    return ""
  }

  return (
      <Shell>
        <Content title="Inventario">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-auto">
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <Link href="/inventario/nuevo" passHref>
                <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full sm:w-auto">
                  Nuevo producto
                </a>
              </Link>
            </div>

            {loading ? (
                <div className="space-y-4">
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
                </div>
            ) : sortedAndFilteredItems().length === 0 ? (
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm w-full max-w-md mx-auto text-center py-8">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-800">
                      No hay productos en inventario
                    </h3>
                    <p className="text-sm text-gray-600">Añade productos para comenzar a gestionar tu inventario.</p>
                  </div>
                  <div className="p-6 pt-0">
                    <Link href="/inventario/nuevo" passHref>
                      <a className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
                        Añadir primer producto
                      </a>
                    </Link>
                  </div>
                </div>
            ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="min-w-full table-auto border-collapse">
                    <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                          onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">Nombre {getSortIndicator("name")}</div>
                      </th>
                      <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                          onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center">Cantidad {getSortIndicator("quantity")}</div>
                      </th>
                      <th
                          className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer"
                          onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center">Precio {getSortIndicator("price")}</div>
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedAndFilteredItems().map((item) => {
                      const isEditing = editingRow === item.id
                      const changes = editedItems[item.id] || {}
                      return (
                          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {isEditing ? (
                                  <input
                                      type="text"
                                      value={changes.name ?? item.name}
                                      onChange={(e) => handleChange(item.id, "name", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                              ) : (
                                  item.name
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {isEditing ? (
                                  <input
                                      type="number"
                                      value={changes.quantity ?? item.quantity}
                                      onChange={(e) => handleChange(item.id, "quantity", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                              ) : (
                                  item.quantity
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {isEditing ? (
                                  <input
                                      type="number"
                                      step="0.01"
                                      value={changes.price ?? item.price}
                                      onChange={(e) => handleChange(item.id, "price", e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                              ) : (
                                  `C$${item.price.toFixed(2)}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                              {isEditing ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-8 px-3 py-1"
                                        onClick={() => handleCancelEdit(item.id)}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-8 px-3 py-1"
                                        onClick={() => handleSave(item.id)}
                                    >
                                      Guardar
                                    </button>
                                  </div>
                              ) : (
                                  <div className="flex justify-end gap-2">
                                    <button
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-8 px-3 py-1"
                                        onClick={() => startEditing(item.id)}
                                    >
                                      Editar
                                    </button>
                                    <button
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-red-300 bg-white text-red-700 hover:bg-red-50 h-8 px-3 py-1"
                                        onClick={() => confirmDelete(item.id)}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                              )}
                            </td>
                          </tr>
                      )
                    })}
                    </tbody>
                  </table>
                </div>
            )}

            {showConfirm && (
                <ModalConfirm
                    title="Confirmar eliminación"
                    message="¿Estás seguro de que deseas eliminar este producto?"
                    onConfirm={handleConfirmedDelete}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <ToastContainer position="bottom-right" autoClose={3000} />
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

