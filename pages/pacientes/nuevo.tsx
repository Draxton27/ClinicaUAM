import React, { useState } from "react";
import firebase from "../../firebase/clientApp";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Content from "../../components/content/Content";
import Shell from "../../components/shell";

export default function NuevoPaciente() {
  const router = useRouter();
  const db = firebase.firestore();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [error, setError] = useState("");

  const validarCorreo = (correo: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const registrarPaciente = async (redirigir: boolean) => {
    setError("");

    if (!email || !firstName || !lastName || !birthdate || !sex) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (!validarCorreo(email)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    try {
      let uid: string | null = null;

      const userSnap = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();

      if (!userSnap.empty) {
        uid = userSnap.docs[0].id;

        const existingPatient = await db
          .collection("patients")
          .where("uid", "==", uid)
          .limit(1)
          .get();

        if (!existingPatient.empty) {
          setError("Este usuario ya está registrado como paciente.");
          return;
        }
      } else {
        const newUser = await db.collection("users").add({
          email,
          createdAt: firebase.firestore.Timestamp.now(),
        });
        uid = newUser.id;
      }

      const nuevoPaciente = await db.collection("patients").add({
        uid,
        email,
        name: `${firstName} ${lastName}`,
        birthdate,
        sex,
        createdAt: firebase.firestore.Timestamp.now(),
      });

      toast.success("Paciente registrado exitosamente");

      setEmail("");
      setFirstName("");
      setLastName("");
      setBirthdate("");
      setSex("");

      setTimeout(() => {
        if (redirigir) {
          router.push(`/pacientes/${nuevoPaciente.id}/consultas/nueva`);
        } else {
          router.push("/pacientes");
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Error al registrar paciente.");
    }
  };

  return (
    <Shell>
        <Content title="Registrar nuevo paciente">
            <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md">

            {error && <p className="text-red-600 mb-3">{error}</p>}

            <input
                className="input w-full mb-3 border border-gray-300 px-3 py-2 rounded"
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <div className="flex gap-4 mb-3">
                <input
                className="input w-full border border-gray-300 px-3 py-2 rounded"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                className="input w-full border border-gray-300 px-3 py-2 rounded"
                placeholder="Apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                />
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input
                type="date"
                className="input w-full mb-3"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                />

            <select
                className="input w-full mb-4 border border-gray-300 px-3 py-2 rounded"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
            >
                <option value="">Seleccione género</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
            </select>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                onClick={() => registrarPaciente(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                Guardar
                </button>
                <button
                onClick={() => registrarPaciente(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                Guardar y crear consulta
                </button>
            </div>

            <ToastContainer />
            </div>
        </Content>
    </Shell>
  );
}
