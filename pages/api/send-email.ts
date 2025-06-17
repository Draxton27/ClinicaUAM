import { NextApiRequest, NextApiResponse } from 'next';
import { sendPatientWelcomeEmail, sendAppointmentConfirmationEmail, sendConsultationSavedEmail } from '../../utils/emailService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { type, data } = req.body;
    console.log('API send-email recibida:', { type, data });

    if (!type || !data) {
      console.error('Datos faltantes:', { type, data });
      return res.status(400).json({ error: 'Tipo y datos son requeridos' });
    }

    let result;

    switch (type) {
      case 'patient_welcome':
        console.log('Enviando email de bienvenida...');
        result = await sendPatientWelcomeEmail(data);
        break;
      case 'appointment_confirmation': {
        console.log('Enviando email de confirmación de cita...');
        const { patientData, appointmentData } = data;
        result = await sendAppointmentConfirmationEmail(patientData, appointmentData);
        break;
      }
      case 'consultation_saved': {
        console.log('Enviando email de consulta guardada...');
        const { patientData: consultationPatientData, consultationData } = data;
        result = await sendConsultationSavedEmail(consultationPatientData, consultationData);
        break;
      }
      default:
        console.error('Tipo de email no válido:', type);
        return res.status(400).json({ error: 'Tipo de email no válido' });
    }

    console.log('Resultado del envío:', result);

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        messageId: result.messageId,
        message: 'Email enviado exitosamente' 
      });
    } else {
      console.error('Error en el envío:', result.error);
      return res.status(500).json({ 
        success: false, 
        error: result.error || 'Error al enviar email' 
      });
    }
  } catch (error) {
    console.error('Error en API send-email:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
} 