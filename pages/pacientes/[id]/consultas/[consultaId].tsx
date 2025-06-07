/* eslint-disable react/react-in-jsx-scope */
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import firebase from "../../../../firebase/clientApp";
import Shell from "../../../../components/shell";
import Content from "../../../../components/content/Content";

export default function DetalleConsulta() {
  const router = useRouter();
  const { id: pacienteId, consultaId } = router.query;

  const [consulta, setConsulta] = useState<any>(null);
  const [paciente, setPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId || !consultaId) return;

    const fetchData = async () => {
      try {
        const [consultaDoc, pacienteDoc] = await Promise.all([
          firebase.firestore().collection("consultations").doc(consultaId as string).get(),
          firebase.firestore().collection("patients").doc(pacienteId as string).get(),
        ]);

        const consultaData = consultaDoc.data();
        const pacienteData = pacienteDoc.data();

        if (!consultaData) return;

        setConsulta({
          ...consultaData,
          date: consultaData.date?.toDate()?.toLocaleDateString("es-NI") || "Fecha inválida",
          total: typeof consultaData.total === "number" ? consultaData.total : 0,
        });

        if (pacienteData) setPaciente(pacienteData);
      } catch (err) {
        console.error("Error al cargar los datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pacienteId, consultaId]);

  if (loading)
    return (
      <Shell>
        <Content title="Consulta">
          <p>Cargando...</p>
        </Content>
      </Shell>
    );

  if (!consulta)
    return (
      <Shell>
        <Content title="Consulta">
          <p>No se encontró la consulta.</p>
        </Content>
      </Shell>
    );

  return (
    <Shell>
      <Content title="Detalle de la consulta">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6">

          {paciente && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800">
              <p><strong>Nombre:</strong> {paciente.name}</p>
              <p><strong>Correo:</strong> {paciente.email}</p>
              <p><strong>Fecha de nacimiento:</strong> {paciente.birthdate}</p>
              <p><strong>Género:</strong> {paciente.sex}</p>
            </div>
          )}

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Información general</h2>
            <p><span className="font-medium text-gray-600">Fecha:</span> {consulta.date}</p>
            <p><span className="font-medium text-gray-600">Precio de la consulta:</span> C${consulta.consultationPrice?.toFixed(2)}</p>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Diagnóstico</h2>
            <p className="whitespace-pre-wrap break-words break-all">
              <span className="font-medium text-gray-600">Síntomas:</span>{" "}
              <span className="inline-block">{consulta.symptoms || "-"}</span>
            </p>
            <p className="whitespace-pre-wrap break-words break-all">
              <span className="font-medium text-gray-600">Diagnóstico:</span>{" "}
              <span className="inline-block">{consulta.diagnosis || "-"}</span>
            </p>

            <p className="whitespace-pre-wrap break-words break-all">
              <span className="font-medium text-gray-600">Receta:</span>{" "}
              <span className="inline-block">{consulta.prescription || "-"}</span>
            </p>
          </div>

          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Medicamentos</h2>
            {consulta.medications?.length ? (
              <ul className="divide-y divide-gray-200">
                {consulta.medications.map((m: any, idx: number) => (
                  <li key={idx} className="py-2 flex justify-between text-sm text-gray-700">
                    <span>{m.name} - {m.quantity} × C${m.price}</span>
                    <span className="font-semibold">C${(m.quantity * m.price).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No se agregaron medicamentos.</p>
            )}
          </div>

          <div className="text-right text-lg font-bold text-gray-800">
            Total: C${consulta.total.toFixed(2)}
          </div>
        </div>
      </Content>
    </Shell>
  );
}
