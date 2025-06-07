import React, { useState } from "react";
import { useRouter } from "next/router";
import fondoPagina from "../images/fondopagina.jpeg";
import firebase from "../firebase/clientApp";
import Logo from "../images/logo.png";
import Image from "next/image";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { oobCode } = router.query;
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            if (typeof oobCode === "string") {
                await firebase.auth().confirmPasswordReset(oobCode, newPassword);
                setSuccess(true);

                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                setError("Código de recuperación inválido.");
            }
        } catch (err: any) {
            setError(err.message || "Error al restablecer la contraseña.");
        }

        setLoading(false);
    };

    return (
        <div
            className="relative h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${fondoPagina.src})` }}
        >
            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
                <div className="flex items-center text-white font-bold text-2xl lg:text-4xl mb-8">
                    <Image
                        src={Logo}
                        width={40}
                        height={40}
                        alt="Logo"
                        className="inline"
                    />
                    <span className="ml-2">IntegraMed</span>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
                        Restablecer contraseña
                    </h1>

                    {success ? (
                        <p className="text-green-600 text-center">
                            Contraseña actualizada correctamente. Ya puedes iniciar sesión.
                        </p>
                    ) : (
                        <form onSubmit={onReset} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Confirmar contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border px-3 py-2 rounded"
                                required
                            />
                            {error && <p className="text-red-600 text-sm">{error}</p>}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
                            >
                                {loading ? "Restableciendo..." : "Actualizar contraseña"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
