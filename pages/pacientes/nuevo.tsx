import React, { useEffect, useState } from "react";
import firebase from "../../firebase/clientApp";
import { useSession } from "next-auth/react";
import { useUserRoles } from "../../utils/hooks/useUserRole";
import { useRouter } from "next/router";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function NuevoPaciente() {
    const { data: session } = useSession();
    const roles = useUserRoles();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [sex, setSex] = useState("");
    const [observations, setObservations] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [users, setUsers] = useState<
        { uid: string; email: string; isPatient: boolean }[]
    >([]);

    const db = firebase.firestore();

    // Cargar usuarios y detectar si ya son pacientes
    useEffect(() => {
        const fetchUsuarios = async () => {
            const [usersSnap, patientsSnap] = await Promise.all([
                db.collection("users").get(),
                db.collection("patients").get(),
            ]);

            const pacientesUIDs = new Set(
                patientsSnap.docs.map((doc) => doc.data().uid)
            );

            const users = usersSnap.docs.map((doc) => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    email: data.email,
                    isPatient: pacientesUIDs.has(doc.id),
                };
            });

            setUsers(users);
        };

        fetchUsuarios();
    }, []);

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        const selectedUser = users.find((u) => u.email === email);

        if (!selectedUser) {
            setError("Debe seleccionar un usuario válido.");
            return;
        }

        if (selectedUser.isPatient) {
            setError("Este usuario ya está registrado como paciente.");
            return;
        }

        if (!name || !birthdate || !sex) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        try {
            await db.collection("patients").add({
                uid: selectedUser.uid,
                email,
                name,
                birthdate,
                sex,
                observations,
                createdAt: firebase.firestore.Timestamp.now(),
            });

            toast.success("Paciente registrado exitosamente");

            setEmail("");
            setName("");
            setBirthdate("");
            setSex("");
            setObservations("");

            setUsers((prev) =>
                prev.map((u) =>
                u.uid === selectedUser.uid ? { ...u, isPatient: true } : u
                )
            );

            setTimeout(() => {
                router.push("/pacientes");
            }, 1500);

            } catch (err) {
            console.error(err);
            setError("Error al registrar paciente.");
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Registrar nuevo paciente</h2>

            {error && <p className="text-red-600 mb-2">{error}</p>}
            {success && <p className="text-green-600 mb-2">{success}</p>}

            <select
                className="input w-full mb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            >
                <option value="">Seleccione un usuario</option>
                {users.map((u) => (
                    <option key={u.uid} value={u.email} disabled={u.isPatient}>
                        {u.email} {u.isPatient ? "(ya está registrado)" : ""}
                    </option>
                ))}
            </select>

            <input
                className="input w-full mb-2"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="date"
                className="input w-full mb-2"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
            />
            <select
                className="input w-full mb-2"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
            >
                <option value="">Seleccione género</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
            </select>
            <textarea
                className="input w-full mb-2"
                placeholder="Observaciones iniciales"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
            />
            <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Guardar
            </button>
            <ToastContainer />
        </div>
    );
}
