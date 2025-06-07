import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
} from "../../firebase/auth/utils.client";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setError(null);
    setInfo(null);
    setLoading(false);
  };

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.push("/pacientes");
    } catch (err: any) {
      // mensajes personalizados
      if (
          err.code === "auth/user-not-found" ||
          err.message.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        setError("Correo o contraseña incorrectos.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("El correo ya está registrado.");
      } else {
        setError(err.message || "Error en la operación.");
      }
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push("/pacientes");
    } catch (err: any) {
      setError(err.message || "Error con Google");
      setLoading(false);
    }
  };

  const onReset = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo("Revisa tu correo para restablecer la contraseña.");
    } catch (err: any) {
      setError(err.message || "No fue posible enviar el correo.");
    }
    setLoading(false);
  };

  return (
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {mode === "login"
              ? "Iniciar sesión"
              : mode === "register"
                  ? "Crear cuenta"
                  : "Recuperar contraseña"}
        </h2>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {info && <p className="text-green-600 text-sm mb-4">{info}</p>}

        {(mode === "login" || mode === "register") && (
            <form onSubmit={onEmailSubmit} className="space-y-4">
              <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded focus:outline-none"
              />

              <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full border px-3 py-2 rounded focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                      >
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                  ) : (
                      <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                      >
                        <path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zM10 13a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                  )}
                </button>
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
              >
                {loading
                    ? "Cargando..."
                    : mode === "login"
                        ? "Ingresar"
                        : "Registrar"}
              </button>
            </form>
        )}

        {mode === "reset" && (
            <div className="space-y-4">
              <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded focus:outline-none"
              />
              <button
                  onClick={onReset}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar correo"}
              </button>
            </div>
        )}

        <div className="mt-6 flex flex-col space-y-2 text-center text-gray-600">
          {mode !== "reset" && (
              <>
                <button
                    onClick={() => {
                      resetState();
                      setMode(mode === "login" ? "register" : "login");
                    }}
                    className="underline"
                >
                  {mode === "login"
                      ? "¿No tienes cuenta? Regístrate"
                      : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
                <button
                    onClick={() => {
                      resetState();
                      setMode("reset");
                    }}
                    className="underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
          )}
          {mode === "reset" && (
              <button
                  onClick={() => {
                    resetState();
                    setMode("login");
                  }}
                  className="underline"
              >
                Volver al inicio de sesión
              </button>
          )}
        </div>

        <div className="flex items-center my-6">
          <span className="flex-grow border-t"></span>
          <span className="px-2 text-gray-500">o</span>
          <span className="flex-grow border-t"></span>
        </div>

        <button
            onClick={onGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center border px-3 py-2 rounded disabled:opacity-50"
        >
          <img src="/google-logo.svg" alt="Google" className="w-5 h-5 mr-2" />
          {loading ? "Cargando..." : "Continuar con Google"}
        </button>
      </div>
  );
}