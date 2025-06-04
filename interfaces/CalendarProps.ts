import type { Locale } from 'date-fns';
import type { CalendarEvent } from '../firebase/models/CalendarEvent';

export interface CalendarProps {
    /** Eventos a mostrar en el calendario */
    events?: CalendarEvent[];
    /** Fecha inicial */
    initialDate?: Date;
    /** Callback al seleccionar un día */
    onDateSelect?: (date: Date) => void;
    /** Locale de date-fns para formatear meses/días */
    locale?: Locale;
}
