import React, { useState } from "react";
import firebase from "../../firebase/clientApp";
import { useRouter } from "next/router";
import Content from "../../components/content/Content";
import Shell from "../../components/shell";
import type {GetServerSidePropsContext} from "next";
import nookies from "nookies";
import {userIsLoggedIn} from "../../firebase/auth/utils.server";

export default function NuevoProducto() {
  const db = firebase.firestore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!name.trim() || quantity < 0 || price < 0) {
      setError("Todos los campos son obligatorios y deben ser válidos.");
      return;
    }

    try {
      await db.collection("inventory").add({
        name: name.trim(),
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
    <Shell>
      <Content title="Agregar Nuevo Producto">
        <div className="max-w-xl mx-auto bg-white shadow-lg rounded-xl p-6 space-y-6">

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del producto
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej. Ibuprofeno 200mg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (C$)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Guardar producto
            </button>
          </div>
        </div>
      </Content>
    </Shell>
  );
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

