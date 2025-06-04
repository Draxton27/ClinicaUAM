// firebase/asistencias/useAsistencias.ts

import firebase from "../clientApp";
import { CalendarEvent } from "../models/CalendarEvent";
import { toTimestamp } from "../../utils/toTimestamp";
const db = firebase.firestore();

export interface CalendarEventWithDocId extends CalendarEvent {
    docId: string;
}

export async function getReservasByMonthPaginated(
    year: number,
    month: number, // 0-indexed: enero = 0
    pageSize = 30,
    lastDoc: firebase.firestore.DocumentSnapshot | null = null
) {

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    let query = db
        .collection("reservas")
        .where("fecha_entrada", ">=", toTimestamp(start))
        .where("fecha_entrada", "<", toTimestamp(end))
        .orderBy("fecha_entrada")
        .limit(pageSize);

    if (lastDoc) {
        query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const reservas: CalendarEventWithDocId[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;

        return {
            docId: doc.id, // clave única para cada fila
            idReserva: data.id_reserva,
            nombreEstudiante: data.Nombre || "",
            cif: data.cif || "",
            correo: data.correo || "",
            asuntoReserva: data.asunto_reserva || "",
            cantidadPersonas: data.cantidad_personas || 0,
            // Convertir Timestamp → ISO string
            fechaEntrada: data.fecha_entrada.toDate().toISOString(),
            fechaSalida: data.fecha_salida.toDate().toISOString(),
            utilizaPizarra: data.utiliza_pizarra || false,
            utilizaProyector: data.utiliza_proyector || false,
            utilizaComputadora: data.utiliza_computadora || false,
            extras: data.extras || "",
            asistencia: data.asistencia as "PENDIENTE" | "ASISTENCIA" | "INASISTENCIA",
        };
    });

    console.log("Reservas obtenidas:", reservas);
    return {
        reservas,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
}

export async function actualizarAsistenciaReserva(
    idReserva: number,
    nuevoEstado: "PENDIENTE" | "ASISTENCIA" | "INASISTENCIA"
) {
    const snapshot = await db
        .collection("reservas")
        .where("id_reserva", "==", idReserva)
        .limit(1)
        .get();

    if (snapshot.empty) {
        throw new Error("Reserva no encontrada");
    }

    const docId = snapshot.docs[0].id;
    await db.collection("reservas").doc(docId).update({
        asistencia: nuevoEstado,
    });

    return true;
}
