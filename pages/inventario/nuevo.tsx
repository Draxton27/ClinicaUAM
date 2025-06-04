import React, { useState } from "react";
import firebase from "../../firebase/clientApp";
import { useRouter } from "next/router";

export default function NuevoProducto() {
  const db = firebase.firestore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!name || quantity < 0 || price < 0) {
      setError("Todos los campos son obligatorios y válidos.");
      return;
    }

    try {
      await db.collection("inventory").add({
        name,
        quantity,
        price,
        createdAt: firebase.firestore.Timestamp.now(),
      });

      router.push("/inventario");
    } catch (err) {
      console.error(err);
      setError("Error al guardar el producto.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Nuevo producto</h2>

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
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Guardar
      </button>
    </div>
  );
}
