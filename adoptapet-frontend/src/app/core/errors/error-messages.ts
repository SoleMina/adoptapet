/**
 * The backend answers in English. These are the messages a user can actually see, in Spanish (Peru).
 * Unknown messages are shown as they come.
 */
const EXACT: Record<string, string> = {
  // auth / users
  'Invalid credentials': 'Usuario o contraseña incorrectos',
  'Your account is disabled': 'Tu cuenta está desactivada. Comunícate con el albergue',
  'Username is already registered': 'Ese nombre de usuario ya está registrado',
  'Email is already registered': 'Ese correo ya está registrado',
  'DNI is already registered': 'Ese DNI ya está registrado',
  'You cannot change the status of your own account':
    'No puedes cambiar el estado de tu propia cuenta',
  'Administrator accounts cannot be deactivated':
    'Las cuentas de administrador no se pueden desactivar',
  'User not found': 'Usuario no encontrado',
  'Invalid or expired JWT token': 'Tu sesión expiró. Inicia sesión de nuevo',
  // pets
  'Pet not found': 'Mascota no encontrada',
  'An active pet with the same name, species and breed already exists':
    'Ya existe una mascota activa con el mismo nombre, especie y raza',
  'Only available pets can be deactivated': 'Solo se puede desactivar una mascota disponible',
  'Only inactive pets can be activated': 'Solo se puede reactivar una mascota inactiva',
  'The pet was modified by another user. Reload it and try again':
    'Otro usuario modificó esta mascota. Recarga la ficha e inténtalo de nuevo',
  'The pet version is required': 'Recarga la ficha e inténtalo de nuevo',
  'Only JPG, PNG or WEBP images are allowed': 'Solo se permiten imágenes JPG, PNG o WEBP',
  'The pet is not available for adoption': 'Esta mascota ya no está disponible para adopción',
  'The pet is not fit for adoption right now':
    'La mascota no está apta para adopción en este momento',
  // applications
  'You already have a pending application for this pet':
    'Ya tienes una solicitud pendiente para esta mascota',
  'The pet already has an approved or completed adoption':
    'La mascota ya tiene una adopción aprobada o completada',
  'The DNI and the proof of address are required':
    'Debes adjuntar tu DNI y el comprobante de domicilio',
  'Only PDF, JPG or PNG files are allowed': 'Solo se permiten archivos PDF, JPG o PNG',
  'The file is required': 'El archivo es obligatorio',
  'This delivery window is full. Choose another one': 'Esta franja está llena. Elige otra',
  'The delivery window has already started or passed': 'La franja ya empezó o ya pasó',
  'The delivery window must be 10:00-12:00, 14:00-16:00 or 16:00-18:00':
    'La franja debe ser 10:00–12:00, 14:00–16:00 o 16:00–18:00',
  'No-show can only be marked after the delivery window ends':
    'Solo puedes marcar "no se presentó" cuando termine la franja',
  'An extra reschedule requires an observation from the administrator':
    'Para una reprogramación extra la observación es obligatoria',
  'Generate the adoption act first': 'Primero genera el acta de adopción',
  'Generate the adoption act before completing the adoption': 'Primero genera el acta de adopción',
  'Upload the signed act before completing the adoption': 'Sube el acta firmada antes de completar',
  'Contingency only applies once the normal pickup deadline has passed':
    'La contingencia solo aplica cuando venció el plazo de recojo',
  'You can only access your own applications': 'Solo puedes ver tus propias solicitudes',
  'Application not found': 'Solicitud no encontrada',
  'Document not found': 'Documento no encontrado',
  // generic
  'The record was modified by another user. Reload it and try again':
    'Otro usuario modificó este registro. Recarga e inténtalo de nuevo',
  'The record is being modified by another request. Try again':
    'Otro proceso está modificando este registro. Inténtalo de nuevo',
  'The data conflicts with an existing record': 'Ya existe un registro con esos datos',
  'You do not have permission for this operation': 'No tienes permiso para esta operación',
  'Invalid request data': 'Revisa los datos del formulario',
};

/** Messages that carry variable text after a fixed beginning. */
const PREFIX: [string, string][] = [
  [
    'The application reached the limit of',
    'Se alcanzó el límite de reprogramaciones; solo un administrador puede reprogramar',
  ],
  [
    'The pickup deadline has passed',
    'Venció el plazo de recojo: cancela con motivo o usa el cierre por contingencia',
  ],
];

/** Bean Validation messages that come inside `errors` by field. */
const FIELD: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/^must not be (blank|null|empty)$/, 'Este campo es obligatorio'],
  [/^must be a well-formed email address$/, 'Ingresa un correo válido'],
  [/^must have (\d+) digits$/, (m) => `Debe tener ${m[1]} dígitos`],
  [/^must be a past date$/, 'Debe ser una fecha pasada'],
  [
    /^size must be between (\d+) and (\d+)$/,
    (m) => `Debe tener entre ${m[1]} y ${m[2]} caracteres`,
  ],
  [
    /^only letters, numbers, dot, dash and underscore$/,
    'Solo letras, números, punto, guion y guion bajo',
  ],
  [/^must be greater than or equal to (\d+)$/, (m) => `Debe ser mayor o igual a ${m[1]}`],
  [/^must be less than or equal to (\d+)$/, (m) => `Debe ser menor o igual a ${m[1]}`],
  [/^invalid value$/, 'Valor no válido'],
];

export function translateMessage(message: string): string {
  if (EXACT[message]) {
    return EXACT[message];
  }
  const prefixed = PREFIX.find(([start]) => message.startsWith(start));
  if (prefixed) {
    return prefixed[1];
  }
  for (const [pattern, translation] of FIELD) {
    const match = message.match(pattern);
    if (match) {
      return typeof translation === 'string' ? translation : translation(match);
    }
  }
  return message;
}
