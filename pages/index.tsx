import React, { useEffect, useState } from "react";
import Shell from "../components/shell";
import Content from "../components/content/Content";
import { GetServerSidePropsContext } from "next";
import nookies from "nookies";
import firebase from "../firebase/clientApp";
import Link from "next/link";
import { useRouter } from "next/router";

type Paciente = {
  id: string;
  name: string;
  email: string;
  birthdate: string;
  sex: string;
};

type SortConfig = {
  key: keyof Paciente;
  direction: "asc" | "desc";
} | null;

export default function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const snapshot = await firebase.firestore().collection("patients").get();
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || "",
            email: d.email || "",
            birthdate: d.birthdate || "",
            sex: d.sex || "",
          };
        });
        setPacientes(data);
      } catch (err) {
        console.error("Error al obtener pacientes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPacientes();
  }, []);

  const sortedAndFiltered = () => {
    let filtered = pacientes.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSort = (key: keyof Paciente) => {
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
      <Content title="Pacientes registrados">
        <>
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-1/3"
            />
            <Link href="/pacientes/nuevo">
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Registrar nuevo paciente
              </a>
            </Link>
          </div>

          {loading ? (
            <p>Cargando pacientes...</p>
          ) : sortedAndFiltered().length === 0 ? (
            <p>No hay pacientes registrados.</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left cursor-pointer">
                  <th className="p-2 border" onClick={() => handleSort("name")}>
                    Nombre {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-2 border" onClick={() => handleSort("email")}>
                    Correo {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-2 border" onClick={() => handleSort("birthdate")}>
                    Fecha de nacimiento (yyyy/dd/mm){" "}
                    {sortConfig?.key === "birthdate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="p-2 border" onClick={() => handleSort("sex")}>
                    Género {sortConfig?.key === "sex" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered().map((p) => (
                  <tr
                    key={p.id}
                    className="border-t cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/pacientes/${p.id}/consultas`)}
                  >
                    <td className="p-2 border">{p.name}</td>
                    <td className="p-2 border">{p.email}</td>
                    <td className="p-2 border">{p.birthdate}</td>
                    <td className="p-2 border">{p.sex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      </Content>
    </Shell>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { userIsLoggedIn } = await import("../firebase/auth/utils.server");
  const cookies = nookies.get(ctx);
  const authenticated = await userIsLoggedIn(cookies);

  if (!authenticated) {
    ctx.res.writeHead(302, { Location: "/login" });
    ctx.res.end();
    return { props: {} };
  }

  return {
    props: {},
  };
}
