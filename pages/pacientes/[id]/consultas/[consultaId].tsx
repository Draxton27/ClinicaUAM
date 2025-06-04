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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pacienteId || !consultaId) return;

    const fetchConsulta = async () => {
      try {
        const doc = await firebase
          .firestore()
          .collection("consultations")
          .doc(consultaId as string)
          .get();

        const data = doc.data();
        if (!data) return;

        setConsulta({
          ...data,
          date: data.date?.toDate()?.toLocaleDateString("es-NI") || "Fecha inválida",
          total: typeof data.total === "number" ? data.total : 0,
        });
      } catch (err) {
        console.error("Error al cargar la consulta:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConsulta();
  }, [pacienteId, consultaId]);

  if (loading) return <Shell><Content title="Consulta"><p>Cargando...</p></Content></Shell>;

  if (!consulta) return <Shell><Content title="Consulta"><p>No se encontró la consulta.</p></Content></Shell>;

  return (
    <Shell>
      <Content title="Detalle de la consulta">
        <div className="max-w-2xl mx-auto p-6">
          <p><strong>Fecha:</strong> {consulta.date}</p>
          <p><strong>Síntomas:</strong> {consulta.symptoms}</p>
          <p><strong>Diagnóstico:</strong> {consulta.diagnosis}</p>
          <p><strong>Receta:</strong> {consulta.prescription}</p>
          <p><strong>Precio de la consulta:</strong> C${consulta.consultationPrice?.toFixed(2)}</p>

          <h3 className="mt-4 font-bold">Medicamentos</h3>
          <ul className="list-disc list-inside">
            {consulta.medications?.map((m: any, idx: number) => (
              <li key={idx}>
                {m.name} - {m.quantity} × C${m.price} = C${(m.quantity * m.price).toFixed(2)}
              </li>
            ))}
          </ul>

          <p className="mt-4 font-bold text-lg">Total: C${consulta.total.toFixed(2)}</p>
        </div>
      </Content>
    </Shell>
  );
}
