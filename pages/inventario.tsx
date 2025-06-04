import React, { useEffect, useState } from "react";
import firebase from "../firebase/clientApp";
import Shell from "../components/shell";
import Content from "../components/content/Content";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import ModalConfirm from "../components/ModalConfirm";

type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type SortConfig = {
  key: keyof Item;
  direction: "asc" | "desc";
} | null;

export default function Inventario() {
  const db = firebase.firestore();
  const [items, setItems] = useState<Item[]>([]);
  const [editedItems, setEditedItems] = useState<Record<string, Partial<Item>>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const snapshot = await db.collection("inventory").get();
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];
        setItems(data);
      } catch (err) {
        console.error("Error al obtener productos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmedDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await db.collection("inventory").doc(pendingDeleteId).delete();
      setItems((prev) => prev.filter((item) => item.id !== pendingDeleteId));
      toast.success("Producto eliminado exitosamente");
    } catch (err) {
      toast.error("Error al eliminar el producto");
    } finally {
      setShowConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const handleChange = (id: string, field: keyof Item, value: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: field === "price" || field === "quantity" ? Number(value) : value,
      },
    }));
  };

  const handleSave = async (id: string) => {
    const changes = editedItems[id];
    if (!changes) return;

    try {
      await db.collection("inventory").doc(id).update(changes);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...changes } : item
        )
      );
      toast.success("Producto actualizado");
      setEditedItems((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      toast.error("Error al guardar los cambios");
    }
  };

  const sortedAndFilteredItems = () => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (typeof aVal === "string" && typeof bVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  };

  const handleSort = (key: keyof Item) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        return {
          key,
          direction: "asc",
        };
      }
    });
  };

  return (
    <Shell>
      <Content title="Inventario">
        <>
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-1/3"
            />
            <Link href="/inventario/nuevo">
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Nuevo producto
              </a>
            </Link>
          </div>

          {loading ? (
            <p>Cargando productos...</p>
          ) : sortedAndFilteredItems().length === 0 ? (
            <p>No hay productos en inventario.</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left cursor-pointer">
                  {["name", "quantity", "price"].map((key) => (
                    <th
                      key={key}
                      className="p-2 border select-none"
                      onClick={() => handleSort(key as keyof Item)}
                    >
                      {key === "name" && "Nombre"}
                      {key === "quantity" && "Cantidad"}
                      {key === "price" && "Precio"}{" "}
                      {sortConfig?.key === key && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                  ))}
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredItems().map((item) => {
                  const changes = editedItems[item.id] || {};
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={changes.name ?? item.name}
                          onChange={(e) => handleChange(item.id, "name", e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={changes.quantity ?? item.quantity}
                          onChange={(e) => handleChange(item.id, "quantity", e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={changes.price ?? item.price}
                          onChange={(e) => handleChange(item.id, "price", e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border space-x-2">
                        {editedItems[item.id] && (
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            onClick={() => handleSave(item.id)}
                          >
                            Guardar
                          </button>
                        )}
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => confirmDelete(item.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {showConfirm && (
            <ModalConfirm
              title="Confirmar eliminación"
              message="¿Estás seguro de que deseas eliminar este producto?"
              onConfirm={handleConfirmedDelete}
              onCancel={() => setShowConfirm(false)}
            />
          )}

          <ToastContainer />
        </>
      </Content>
    </Shell>
  );
}
