/* eslint-disable react/react-in-jsx-scope */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import firebase from "../../../../firebase/clientApp";
import Link from "next/link";
import Shell from "../../../../components/shell";
import Content from "../../../../components/content/Content";

type Consulta = {
  id: string;
  diagnosis: string;
  date: string;
  total: number;
};

type Paciente = {
  name: string;
  email: string;
  birthdate: string;
  sex: string;
};

export default function ConsultasPaciente() {
  const router = useRouter();
  const { id: pacienteId } = router.query;

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId) return;

    const fetchData = async () => {
      try {
        const [consultasSnap, pacienteSnap] = await Promise.all([
          firebase
            .firestore()
            .collection("consultations")
            .where("patientId", "==", pacienteId)
            .get(),
          firebase.firestore().collection("patients").doc(pacienteId as string).get(),
        ]);

        const consultasData = consultasSnap.docs.map((doc) => {
          const d = doc.data();
          const dateObj = d.date?.toDate?.();
          return {
            id: doc.id,
            diagnosis: d.diagnosis || "",
            date: dateObj?.toLocaleDateString("es-NI") || "Fecha inválida",
            total: typeof d.total === "number" ? d.total : 0,
          };
        });

        const pacienteData = pacienteSnap.data() as Paciente;
        setConsultas(consultasData);
        setPaciente(pacienteData);
      } catch (err) {
        console.error("Error al obtener datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pacienteId]);

  return (
    <Shell>
      <Content title="Consultas del paciente">
        <div>
          {paciente && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-sm text-gray-800">
              <p><strong>Nombre:</strong> {paciente.name}</p>
              <p><strong>Correo:</strong> {paciente.email}</p>
              <p><strong>Fecha de nacimiento:</strong> {paciente.birthdate}</p>
              <p><strong>Género:</strong> {paciente.sex}</p>
            </div>
          )}

          <div className="flex justify-end mb-4">
            <Link href={`/pacientes/${pacienteId}/consultas/nueva`}>
              <a className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Nueva consulta
              </a>
            </Link>
          </div>

          {loading ? (
            <p>Cargando consultas...</p>
          ) : consultas.length === 0 ? (
            <p>No hay consultas registradas.</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Diagnóstico</th>
                  <th className="p-2 border">Fecha</th>
                  <th className="p-2 border">Total (CORD)</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c, index) => (
                  <tr
                    key={c.id}
                    className="border-t hover:bg-gray-100 cursor-pointer"
                    onClick={() => router.push(`/pacientes/${pacienteId}/consultas/${c.id}`)}
                  >
                    <td className="p-2 border">{index + 1}</td>
                    <td className="p-2 border max-w-[50px] overflow-hidden whitespace-nowrap text-ellipsis" title={c.diagnosis}>
                      {c.diagnosis}
                    </td>
                    <td className="p-2 border">{c.date}</td>
                    <td className="p-2 border">C${c.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Content>
    </Shell>
  );
}
