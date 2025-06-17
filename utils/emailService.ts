import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_PASS = process.env.GMAIL_PASS || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

interface PatientEmailData {
  patientName: string;
  patientEmail: string;
  birthdate: string;
  sex: string;
  dni?: string;
  emergencyNumber?: string;
  direccion?: string;
}

export const sendPatientWelcomeEmail = async (patientData: PatientEmailData) => {
  try {
    const info = await transporter.sendMail({
      from: `Clínica Médica <${GMAIL_USER}>`,
      to: patientData.patientEmail,
      subject: 'Bienvenido a nuestra Clínica - Registro Exitoso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">🏥 Clínica Médica</h1>
          <h2 style="color: #2c3e50;">¡Bienvenido/a, ${patientData.patientName}!</h2>
          <p>Su registro en nuestra clínica ha sido exitoso.</p>
          <p><strong>Nombre:</strong> ${patientData.patientName}</p>
          <p><strong>Email:</strong> ${patientData.patientEmail}</p>
          <p><strong>Fecha de nacimiento:</strong> ${new Date(patientData.birthdate).toLocaleDateString('es-ES')}</p>
          <p><strong>Género:</strong> ${patientData.sex}</p>
          ${patientData.dni ? `<p><strong>DNI:</strong> ${patientData.dni}</p>` : ''}
          ${patientData.emergencyNumber ? `<p><strong>Teléfono de emergencia:</strong> ${patientData.emergencyNumber}</p>` : ''}
          ${patientData.direccion ? `<p><strong>Dirección:</strong> ${patientData.direccion}</p>` : ''}
          <p>Gracias por confiar en nuestros servicios médicos.</p>
        </div>
      `,
    });
    console.log('Email enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar email:', error);
    return { success: false, error: error.message };
  }
};

export const sendAppointmentConfirmationEmail = async (
  patientData: PatientEmailData,
  appointmentData: {
    date: string;
    time: string;
    consultationType: string;
    notes?: string;
  }
) => {
  try {
    const info = await transporter.sendMail({
      from: `Clínica Médica <${GMAIL_USER}>`,
      to: patientData.patientEmail,
      subject: 'Confirmación de Cita Médica',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">🏥 Clínica Médica</h1>
          <h2 style="color: #2c3e50;">✅ Cita Confirmada</h2>
          <p>Estimado/a <strong>${patientData.patientName}</strong>, su cita médica ha sido programada exitosamente.</p>
          <p><strong>Fecha:</strong> ${new Date(appointmentData.date).toLocaleDateString('es-ES')}</p>
          <p><strong>Hora:</strong> ${appointmentData.time}</p>
          <p><strong>Tipo de consulta:</strong> ${appointmentData.consultationType}</p>
          ${appointmentData.notes ? `<p><strong>Notas:</strong> ${appointmentData.notes}</p>` : ''}
          <p>Gracias por confiar en nuestros servicios médicos.</p>
        </div>
      `,
    });
    console.log('Email de confirmación enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar email de confirmación:', error);
    return { success: false, error: error.message };
  }
};

export const sendConsultationSavedEmail = async (
  patientData: PatientEmailData,
  consultationData: {
    date: string;
    symptoms: string;
    diagnosis: string;
    prescription?: string;
    consultationPrice: number;
    medications: Array<{name: string; quantity: number; price: number}>;
    total: number;
    notes?: string;
  }
) => {
  try {
    const info = await transporter.sendMail({
      from: `Clínica Médica <${GMAIL_USER}>`,
      to: patientData.patientEmail,
      subject: 'Consulta Médica Guardada - Resumen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">🏥 Clínica Médica</h1>
          <h2 style="color: #2c3e50;">✅ Consulta Guardada Exitosamente</h2>
          <p>Estimado/a <strong>${patientData.patientName}</strong>, su consulta médica ha sido registrada.</p>
          <h3>📅 Detalles de la Consulta</h3>
          <p><strong>Fecha:</strong> ${new Date(consultationData.date).toLocaleDateString('es-ES')}</p>
          <p><strong>Precio:</strong> C$${consultationData.consultationPrice.toFixed(2)}</p>
          <h3>🏥 Información Médica</h3>
          <p><strong>Síntomas:</strong> ${consultationData.symptoms}</p>
          <p><strong>Diagnóstico:</strong> ${consultationData.diagnosis}</p>
          ${consultationData.prescription ? `<p><strong>Receta:</strong> ${consultationData.prescription}</p>` : ''}
          ${consultationData.medications.length > 0 ? `
            <h3>💊 Medicamentos</h3>
            ${consultationData.medications.map(med => `<p>${med.name} - ${med.quantity} unidad(es) - C$${med.price.toFixed(2)} c/u</p>`).join('')}
          ` : ''}
          <h3>💰 Total: C$${consultationData.total.toFixed(2)}</h3>
          ${consultationData.notes ? `<p><strong>Notas:</strong> ${consultationData.notes}</p>` : ''}
          <p>Gracias por confiar en nuestros servicios médicos.</p>
        </div>
      `,
    });
    console.log('Email de consulta guardada enviado exitosamente:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Error al enviar email de consulta guardada:', error);
    return { success: false, error: error.message };
  }
}; 