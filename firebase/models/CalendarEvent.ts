export interface CalendarEvent {
    idReserva: number;
    nombreEstudiante: string;
    cif: string;
    correo: string;
    asuntoReserva: string;
    cantidadPersonas: number;
    fechaEntrada: string;   // ISO datetime, e.g. "2025-06-15T09:00:00"
    fechaSalida: string;    // ISO datetime
    utilizaPizarra: boolean;
    utilizaProyector: boolean;
    utilizaComputadora: boolean;
    extras?: string;
    asistencia: "PENDIENTE" | "ASISTENCIA" | "INASISTENCIA";
}
