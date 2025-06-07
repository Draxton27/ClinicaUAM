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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-2 rounded w-full sm:w-1/2"
            />
            <Link href="/pacientes/nuevo">
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto text-center">
                Registrar nuevo paciente
              </a>
            </Link>
          </div>

          {loading ? (
            <p>Cargando pacientes...</p>
          ) : sortedAndFiltered().length === 0 ? (
            <p>No hay pacientes registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-left">
                    <th className="p-2 border cursor-pointer" onClick={() => handleSort("name")}>
                      Nombre {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-2 border cursor-pointer" onClick={() => handleSort("email")}>
                      Correo {sortConfig?.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-2 border cursor-pointer" onClick={() => handleSort("birthdate")}>
                      Fecha de nacimiento (yyyy/dd/mm) {sortConfig?.key === "birthdate" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-2 border cursor-pointer" onClick={() => handleSort("sex")}>
                      Género {sortConfig?.key === "sex" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAndFiltered().map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-100">
                      <td className="p-2 border cursor-pointer" onClick={() => router.push(`/pacientes/${p.id}/consultas`)}>
                        {p.name}
                      </td>
                      <td className="p-2 border cursor-pointer" onClick={() => router.push(`/pacientes/${p.id}/consultas`)}>
                        {p.email}
                      </td>
                      <td className="p-2 border cursor-pointer" onClick={() => router.push(`/pacientes/${p.id}/consultas`)}>
                        {p.birthdate}
                      </td>
                      <td className="p-2 border cursor-pointer" onClick={() => router.push(`/pacientes/${p.id}/consultas`)}>
                        {p.sex}
                      </td>
                      <td className="p-2 border space-y-2 sm:space-y-0 sm:space-x-2">
                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 w-full sm:w-auto"
                          onClick={() => router.push(`/pacientes/${p.id}/consultas/nueva`)}
                        >
                          Nueva consulta
                        </button>
                       
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
