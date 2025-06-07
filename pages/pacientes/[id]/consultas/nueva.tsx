import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import firebase from "../../../../firebase/clientApp";
import Shell from "../../../../components/shell";
import Content from "../../../../components/content/Content";

interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface SelectedMed {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Patient {
  name: string;
  email: string;
  birthdate: string;
  sex: string;
}

export default function NuevaConsulta() {
  const router = useRouter();
  const { id: patientId } = router.query;
  const db = firebase.firestore();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [consultationPrice, setConsultationPrice] = useState<number>(0);
  const [selectedMeds, setSelectedMeds] = useState<SelectedMed[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!patientId) return;

    const fetchPatient = async () => {
      const doc = await db.collection("patients").doc(patientId as string).get();
      if (doc.exists) setPatient(doc.data() as Patient);
    };

    const fetchInventory = async () => {
      const snapshot = await db.collection("inventory").get();
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          price: parseFloat(data.price),
          quantity: parseInt(data.quantity),
        };
      });
      setInventory(items);
    };

    fetchPatient();
    fetchInventory();
  }, [patientId]);

  const handleAddMedication = () => {
    if (!selectedMedId || selectedQuantity < 1) return;
    const med = inventory.find((item) => item.id === selectedMedId);
    if (!med || selectedQuantity > med.quantity) return;

    const alreadyAdded = selectedMeds.find((m) => m.id === med.id);
    if (alreadyAdded) {
      const newQuantity = alreadyAdded.quantity + selectedQuantity;
      if (newQuantity > med.quantity) return;
      setSelectedMeds((prev) =>
        prev.map((m) =>
          m.id === med.id ? { ...m, quantity: newQuantity } : m
        )
      );
    } else {
      setSelectedMeds((prev) => [
        ...prev,
        {
          id: med.id,
          name: med.name,
          price: med.price,
          quantity: selectedQuantity,
        },
      ]);
    }

    setSelectedMedId("");
    setSelectedQuantity(1);
  };

  const handleRemoveMedication = (id: string) => {
    setSelectedMeds((prev) => prev.filter((m) => m.id !== id));
  };

  const getRemainingQuantity = (medId: string): number => {
    const invItem = inventory.find((i) => i.id === medId);
    const selected = selectedMeds.find((m) => m.id === medId);
    if (!invItem) return 0;
    return invItem.quantity - (selected?.quantity || 0);
  };

  const totalMedsPrice = selectedMeds.reduce(
    (sum, m) => sum + m.price * m.quantity,
    0
  );
  const total = totalMedsPrice + consultationPrice;

  const handleSubmit = async () => {
    if (!patientId || !selectedDate) return;

    await db.collection("consultations").add({
      patientId,
      symptoms,
      diagnosis,
      prescription,
      consultationPrice,
      medications: selectedMeds,
      total,
      date: firebase.firestore.Timestamp.fromDate(new Date(selectedDate)),
    });

    const batch = db.batch();
    selectedMeds.forEach((med) => {
      const medRef = db.collection("inventory").doc(med.id);
      const remaining = inventory.find((i) => i.id === med.id)?.quantity || 0;
      const newQuantity = remaining - med.quantity;
      batch.update(medRef, { quantity: newQuantity });
    });

    await batch.commit();
    router.push(`/pacientes/${patientId}/consultas`);
  };

  return (
    <Shell>
      <Content title="Nueva consulta médica">
      <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl space-y-6">

        {patient && (
          <div className="border rounded-lg p-4 bg-gray-50 text-sm">
            <p><strong>Paciente:</strong> {patient.name}</p>
            <p><strong>Correo:</strong> {patient.email}</p>
            <p><strong>Fecha de nacimiento:</strong> {patient.birthdate}</p>
            <p><strong>Género:</strong> {patient.sex}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas</label>
            <textarea
              className="input w-full"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
            <textarea
              className="input w-full"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Receta</label>
            <textarea
              className="input w-full"
              value={prescription}
              onChange={(e) => setPrescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio de la consulta</label>
            <input
              type="number"
              className="input w-full"
              value={consultationPrice}
              onChange={(e) => setConsultationPrice(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de consulta</label>
            <input
              type="date"
              className="input w-full"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Medicamentos</h3>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <select
              className="input"
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
            >
              <option value="">Seleccionar medicamento</option>
              {inventory.map((item) => {
                const remaining = getRemainingQuantity(item.id);
                if (remaining <= 0) return null;
                return (
                  <option key={item.id} value={item.id}>
                    {item.name} - C${item.price} ({remaining} disponibles)
                  </option>
                );
              })}
            </select>
            <input
              type="number"
              min={1}
              max={selectedMedId ? getRemainingQuantity(selectedMedId) : undefined}
              className="input w-20"
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
            />
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={handleAddMedication}
            >
              Agregar
            </button>
          </div>
          {selectedMeds.length > 0 && (
            <ul className="space-y-1 text-sm">
              {selectedMeds.map((m) => (
                <li key={m.id} className="flex justify-between items-center border-b pb-1">
                  <span>
                    {m.name} - {m.quantity} × C${m.price} = C${(m.price * m.quantity).toFixed(2)}
                  </span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleRemoveMedication(m.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-right font-bold text-lg text-gray-700">
          Total: C${total.toFixed(2)}
        </div>

        <div className="flex justify-end">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            onClick={handleSubmit}
          >
            Guardar consulta
          </button>
        </div>
      </div>
      </Content>
    </Shell>
  );
}
