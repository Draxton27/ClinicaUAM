import {useState, useEffect, useCallback} from "react";
import firebase from "../clientApp"; // Importamos el namespaced SDK v8
import { CalendarEvent } from "../models/CalendarEvent";
import {toTimestamp} from "../../utils/toTimestamp";

const db = firebase.firestore();

export interface ReservationsContextValue {
    reservas: CalendarEvent[];
    loading: boolean;
    startDate: Date;
    endDate: Date;
    setStartDate: (d: Date) => void;
    setEndDate: (d: Date) => void;
    nextPage: () => void;
    prevPage: () => void;
    addReservation: (evt: CalendarEvent) => Promise<void>;
    updateReservation: (evt: CalendarEvent) => Promise<void>;
    deleteReservation: (eventId: number) => Promise<void>;
}

export function useReservationsLogic(
    initialStartDate?: Date,
    initialEndDate?: Date
): ReservationsContextValue {
    const [reservas, setReservas] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const defaultStart = initialStartDate
        ? initialStartDate
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = initialEndDate
        ? initialEndDate
        : new Date(now.getFullYear(), now.getMonth() + 2);

    const [startDate, setStartDate] = useState<Date>(defaultStart);
    const [endDate, setEndDate] = useState<Date>(defaultEnd);

    // --- Paginación: último documento visible y stack de primeros documentos ---
    const [lastVisibleDoc, setLastVisibleDoc] =
        useState<firebase.firestore.QueryDocumentSnapshot | null>(null);
    const [firstDocsStack, setFirstDocsStack] = useState<
        firebase.firestore.QueryDocumentSnapshot[]
    >([]);

    // --- Función para “cargar página” (initial, next, prev) ---
    const loadPage = useCallback(
        async (direction: "initial" | "next" | "prev" = "initial") => {
            setLoading(true);
            try {
                let ref = db
                    .collection("reservas")
                    .where("asistencia", "in", ["PENDIENTE", "ASISTENCIA"])
                    .where("fecha_entrada", ">=", toTimestamp(startDate))
                    .where("fecha_entrada", "<", toTimestamp(endDate))
                    .orderBy("fecha_entrada", "asc")

                if (direction === "next" && lastVisibleDoc) {
                    ref = ref.startAfter(lastVisibleDoc);
                } else if (direction === "prev" && firstDocsStack.length > 1) {
                    // Para retroceder, sacamos la última página del historial
                    const history = [...firstDocsStack];
                    history.pop();
                    setFirstDocsStack(history);
                }

                const snapshot = await ref.get();

                if (!snapshot.empty) {
                    const firstDoc = snapshot.docs[0];
                    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

                    if (direction === "initial") {
                        setFirstDocsStack([firstDoc]);
                    } else if (direction === "next") {
                        setFirstDocsStack((prev) => [...prev, firstDoc]);
                    }

                    setLastVisibleDoc(lastDoc);

                    // Mapear a CalendarEvent[]
                    const arr: CalendarEvent[] = snapshot.docs.map((snapDoc) => {
                        const data = snapDoc.data();
                        return {
                            idReserva: data.id_reserva,
                            nombreEstudiante: data.Nombre || "",
                            cif: data.cif || "",
                            correo: data.correo || "",
                            asuntoReserva: data.asunto_reserva || "",
                            cantidadPersonas: data.cantidad_personas || 0,
                            fechaEntrada: data.fecha_entrada.toDate().toISOString(),
                            fechaSalida: data.fecha_salida.toDate().toISOString(),
                            utilizaPizarra: data.utiliza_pizarra || false,
                            utilizaProyector: data.utiliza_proyector || false,
                            utilizaComputadora: data.utiliza_computadora || false,
                            extras: (() => {
                                const extrasArr: string[] = [];
                                if (data.utiliza_pizarra) extrasArr.push("Pizarra");
                                if (data.utiliza_proyector) extrasArr.push("Proyector");
                                if (data.utiliza_computadora) extrasArr.push("Computadora");
                                return extrasArr.length ? extrasArr.join(", ") : undefined;
                            })(),
                            asistencia: data.asistencia || "PENDIENTE",
                        };
                    });
                    console.log(arr)
                    setReservas(arr);
                } else {
                    setReservas([]);
                }
            } catch (err) {
                console.error("Error cargando reservas:", err);
                setReservas([]);
            } finally {
                setLoading(false);
            }
        },
        [startDate, endDate, lastVisibleDoc, firstDocsStack]
    );

    // Carga inicial / cuando cambian startDate/endDate
    useEffect(() => {
        loadPage("initial");
    }, [startDate, endDate]);

    // Funciones para paginación
    const nextPage = useCallback(() => {
        if (!loading && lastVisibleDoc) {
            loadPage("next");
        }
    }, [lastVisibleDoc, loading]);

    const prevPage = useCallback(() => {
        if (!loading && firstDocsStack.length > 1) {
            loadPage("prev");
        }
    }, [firstDocsStack, loading]);

    // --- checkAvailability(evt): verifica capacidad y equipos ocupados ---
    const checkAvailability = useCallback(
        async (evt: CalendarEvent): Promise<Record<string, string>> => {
            const availabilityErrors: Record<string, string> = {};

            const entradaDate = new Date(evt.fechaEntrada);
            const salidaDate = new Date(evt.fechaSalida);

            const toTimestampLocal = (d: Date) => firebase.firestore.Timestamp.fromDate(d);

            const snapshot = await db
                .collection("reservas")
                .where("fecha_entrada", "<", toTimestampLocal(salidaDate))
                .get();

            let totalPersonasEnRango = 0;
            let pizarraOcupada = false;
            let proyectorOcupado = false;
            let computadoraOcupada = false;

            snapshot.docs.forEach((doc) => {
                const data = doc.data();
                const salida = data.fecha_salida.toDate();

                if (
                    salida > entradaDate &&
                    (!evt.idReserva || data.id_reserva !== evt.idReserva)
                ) {
                    totalPersonasEnRango += data.cantidad_personas ?? 0;
                    if (data.utiliza_pizarra) pizarraOcupada = true;
                    if (data.utiliza_proyector) proyectorOcupado = true;
                    if (data.utiliza_computadora) computadoraOcupada = true;
                }
            });

            const capacidadMaxima = 16;
            if (totalPersonasEnRango + evt.cantidadPersonas > capacidadMaxima) {
                availabilityErrors.cantidadPersonas = `La cantidad de personas excede la capacidad máxima (${capacidadMaxima}). Actualmente hay ${totalPersonasEnRango} espacios disponibles.`;
            }

            if (evt.utilizaPizarra && pizarraOcupada) {
                availabilityErrors.utilizaPizarra = "La pizarra no está disponible en ese horario.";
            }
            if (evt.utilizaProyector && proyectorOcupado) {
                availabilityErrors.utilizaProyector = "El proyector no está disponible en ese horario.";
            }
            if (evt.utilizaComputadora && computadoraOcupada) {
                availabilityErrors.utilizaComputadora = "La computadora no está disponible en ese horario.";
            }

            return availabilityErrors;
        },
        []
    );

    // --- CRUD con manejo de errores y refresco de página inicial ---
    const addReservation = useCallback(
        async (evt: CalendarEvent) => {

            // 1) Verificar disponibilidad
            const availabilityErrors = await checkAvailability(evt);
            if (Object.keys(availabilityErrors).length > 0) {
                // Lanzamos un error con la info de validación
                throw new Error(JSON.stringify(availabilityErrors));
            }

            // 2) Si tod bien, creamos la reserva en Firestore
            try {
                const nuevoId = Date.now();
                await db.collection("reservas").add({
                    id_reserva: nuevoId,
                    Nombre: evt.nombreEstudiante,
                    cif: evt.cif,
                    correo: evt.correo,
                    asunto_reserva: evt.asuntoReserva,
                    cantidad_personas: evt.cantidadPersonas,
                    fecha_entrada: new Date(evt.fechaEntrada),
                    fecha_salida: new Date(evt.fechaSalida),
                    utiliza_pizarra: evt.utilizaPizarra,
                    utiliza_proyector: evt.utilizaProyector,
                    utiliza_computadora: evt.utilizaComputadora,
                    asistencia: evt.asistencia,
                });
                loadPage("initial");
            } catch (err) {
                console.error("Error al agregar reserva:", err);
            }
        },
        [checkAvailability, loadPage]
    );

    const updateReservation = useCallback(
        async (evt: CalendarEvent) => {

            // 1) Verificar disponibilidad
            const availabilityErrors = await checkAvailability(evt);
            if (Object.keys(availabilityErrors).length > 0) {
                throw new Error(JSON.stringify(availabilityErrors));
            }

            // 2) Si está OK, buscamos el doc. y actualizamos
            try {
                const querySnap = await db
                    .collection("reservas")
                    .where("id_reserva", "==", evt.idReserva)
                    .get();
                if (!querySnap.empty) {
                    const docRef = querySnap.docs[0].ref;
                    await docRef.update({
                        Nombre: evt.nombreEstudiante,
                        cif: evt.cif,
                        correo: evt.correo,
                        asunto_reserva: evt.asuntoReserva,
                        cantidad_personas: evt.cantidadPersonas,
                        fecha_entrada: new Date(evt.fechaEntrada),
                        fecha_salida: new Date(evt.fechaSalida),
                        utiliza_pizarra: evt.utilizaPizarra,
                        utiliza_proyector: evt.utilizaProyector,
                        utiliza_computadora: evt.utilizaComputadora,
                        asistencia: evt.asistencia,
                    });
                    loadPage("initial");
                } else {
                    console.warn(`Reserva con ID ${evt.idReserva} no encontrada.`);
                }
            } catch (err) {
                console.error("Error al actualizar reserva:", err);
            }
        },
        [checkAvailability, loadPage]
    );

    const deleteReservation = useCallback(
        async (eventId: number) => {
            try {
                const querySnap = await db
                    .collection("reservas")
                    .where("id_reserva", "==", eventId)
                    .get();
                if (querySnap.empty) {
                    console.warn(`No se encontró reserva con ID ${eventId} para eliminar.`);
                    return;
                }
                await Promise.all(querySnap.docs.map((snap) => snap.ref.delete()));
                loadPage("initial");
            } catch (err) {
                console.error("Error al intentar eliminar reserva:", err);
            }
        },
        [loadPage]
    );

    return {
        reservas,
        loading,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        nextPage,
        prevPage,
        addReservation,
        updateReservation,
        deleteReservation,
    };
}
