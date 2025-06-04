import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import firebase from "../../../firebase/clientApp";

export default function EditarProducto() {
  const db = firebase.firestore();
  const router = useRouter();
  const { id } = router.query;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchProduct = async () => {
      try {
        const doc = await db.collection("inventory").doc(id).get();
        if (!doc.exists) {
          setError("Producto no encontrado.");
          return;
        }
        const data = doc.data();
        setName(data?.name || "");
        setQuantity(data?.quantity || 0);
        setPrice(data?.price || 0);
      } catch (err) {
        console.error(err);
        setError("Error al cargar el producto.");
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdate = async () => {
    if (!name || quantity < 0 || price < 0) {
      setError("Todos los campos son obligatorios y válidos.");
      return;
    }

    try {
      await db.collection("inventory").doc(String(id)).update({
        name,
        quantity,
        price,
        updatedAt: firebase.firestore.Timestamp.now(),
      });

      router.push("/inventario");
    } catch (err) {
      console.error(err);
      setError("Error al actualizar el producto.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Editar producto</h2>

      {error && <p className="text-red-600 mb-2">{error}</p>}

      <input
        className="input w-full mb-2"
        placeholder="Nombre del producto"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input w-full mb-2"
        type="number"
        placeholder="Cantidad"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <input
        className="input w-full mb-2"
        type="number"
        placeholder="Precio"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
      />
      <button
        onClick={handleUpdate}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Actualizar
      </button>
    </div>
  );
}
