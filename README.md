# Sistema de Clínica Médica - Next.js + Firebase

Sistema completo para gestión de pacientes, citas y consultas médicas con notificaciones por email.

## Tecnologías

- **Framework**: [Next.js](https://nextjs.org/) con [React](https://reactjs.org)
- **Base de datos**: [Firebase Firestore](https://firebase.google.com/)
- **Autenticación**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Email**: [Nodemailer](https://nodemailer.com/) con Gmail
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Hosting**: [Vercel](https://vercel.com/)

## Características

- ✅ Gestión completa de pacientes
- ✅ Programación de citas médicas
- ✅ Registro de consultas médicas
- ✅ Inventario de medicamentos
- ✅ Notificaciones por email automáticas
- ✅ Interfaz moderna y responsive

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Firebase Admin (para server-side)
FIREBASE_CLIENT_EMAIL=tu_client_email
FIREBASE_PRIVATE_KEY="tu_private_key"

# Email (Gmail)
GMAIL_USER=tu_correo@gmail.com
GMAIL_PASS=tu_contraseña_de_aplicacion
```

### 2. Configuración de Gmail

Para enviar emails automáticos:

1. **Activa la verificación en 2 pasos** en tu cuenta de Google
2. **Genera una contraseña de aplicación**:
   - Ve a [myaccount.google.com](https://myaccount.google.com/)
   - Seguridad → Contraseñas de aplicación
   - Selecciona "Otra" y ponle un nombre como "Clínica NextJS"
   - Copia la contraseña de 16 caracteres
3. **Agrega las credenciales** a tu `.env.local`

### 3. Firebase Setup

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilita Firestore Database
3. Habilita Authentication (opcional, para futuras funcionalidades)
4. Copia las credenciales a tu `.env.local`

## Instalación

```bash
npm install
npm run dev
```

## Funcionalidades de Email

El sistema envía automáticamente emails en estos casos:

1. **Registro de paciente**: Email de bienvenida con datos del registro
2. **Confirmación de cita**: Detalles de la cita programada
3. **Consulta guardada**: Resumen completo de la consulta médica

## Estructura del Proyecto

```
├── components/          # Componentes React
├── pages/              # Páginas de Next.js
│   ├── api/           # API routes
│   ├── pacientes/     # Gestión de pacientes
│   └── inventario/    # Gestión de inventario
├── utils/             # Utilidades
│   └── emailService.ts # Servicio de email
├── firebase/          # Configuración de Firebase
└── types/             # Tipos TypeScript
```

## Despliegue

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Agrega las variables de entorno en la configuración de Vercel
3. ¡Listo! Tu clínica estará online

## Notas Importantes

- Los emails se envían desde tu cuenta de Gmail
- Gmail tiene límites de envío (500 emails/día para cuentas normales)
- Para producción, considera usar un servicio de email transaccional como SendGrid o Mailgun 