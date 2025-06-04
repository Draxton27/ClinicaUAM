// firebase/reservations/ReservationsContext.tsx
import React, { createContext, useContext } from "react";
import { useReservationsLogic, ReservationsContextValue } from "./useReservations";

// Función que lanza un error si se usa fuera del provider
const throwFn = () => {
    throw new Error("useReservations must be used within a ReservationsProvider");
};

// Creamos el contexto incluyendo los nuevos props: startDate, endDate, nextPage, prevPage
const ReservationsContext = createContext<ReservationsContextValue>({
    reservas: [],
    loading: true,
    startDate: new Date(0),       // valor placeholder; se sobrescribirá en el Provider
    endDate: new Date(0),
    setStartDate: () => throwFn(), // placeholder
    setEndDate: () => throwFn(),
    nextPage: () => throwFn(),
    prevPage: () => throwFn(),
    addReservation: async () => throwFn(),
    updateReservation: async () => throwFn(),
    deleteReservation: async () => throwFn(),
});

// Provider que inyecta la lógica a todos los hijos
export const ReservationsProvider: React.FC = ({ children }) => {
    const logic = useReservationsLogic();
    return (
        <ReservationsContext.Provider value={logic}>
            {children}
        </ReservationsContext.Provider>
    );
};

// Hook para consumir el contexto fácilmente
export const useReservations = () => useContext(ReservationsContext);
