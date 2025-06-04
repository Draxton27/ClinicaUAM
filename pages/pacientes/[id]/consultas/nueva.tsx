import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import firebase from "../../../../firebase/clientApp";

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

export default function NuevaConsulta() {
  const router = useRouter();
  const { id: patientId } = router.query;

  const db = firebase.firestore();

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

    fetchInventory();
  }, []);

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
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Nueva consulta</h2>

      <textarea
        className="input w-full mb-2"
        placeholder="Síntomas"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
      />
      <textarea
        className="input w-full mb-2"
        placeholder="Diagnóstico"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
      />
      <textarea
        className="input w-full mb-2"
        placeholder="Receta"
        value={prescription}
        onChange={(e) => setPrescription(e.target.value)}
      />
      <input
        type="number"
        className="input w-full mb-2"
        placeholder="Precio de la consulta"
        value={consultationPrice}
        onChange={(e) => setConsultationPrice(parseFloat(e.target.value))}
      />
      <input
        type="date"
        className="input w-full mb-2"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        />

      <div className="mb-4">
        <label className="block font-bold mb-1">Medicamentos</label>
        <div className="flex space-x-2 mb-2">
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
                  {item.name} - ${item.price} ({remaining} disponibles)
                </option>
              );
            })}
          </select>
          <input
            type="number"
            min={1}
            max={
              selectedMedId ? getRemainingQuantity(selectedMedId) : undefined
            }
            className="input w-20"
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
          />
          <button
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            onClick={handleAddMedication}
          >
            Agregar
          </button>
        </div>
        <ul className="list-disc list-inside">
          {selectedMeds.map((m) => (
            <li key={m.id} className="flex justify-between">
              <span>
                {m.name} - {m.quantity} × ${m.price} = ${m.price * m.quantity}
              </span>
              <button
                className="text-red-500"
                onClick={() => handleRemoveMedication(m.id)}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-2 font-bold">Total: C${total.toFixed(2)}</p>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleSubmit}
      >
        Guardar consulta
      </button>
    </div>
  );
}
