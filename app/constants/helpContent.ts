import type { HelpMap } from '~/types/help'

export const helpContentMap: HelpMap = {
  // =================== PUBLIC / MARKETING ===================
  '/': {
    title: 'Bienvenido a v9planes',
    location: 'Página de inicio',
    description: 'v9planes es la herramienta profesional para crear planes de seguridad y salud en construcción conforme al RD 1627/1997.',
    tips: [
      'Desde aquí puedes conocer nuestras funcionalidades, ver precios o iniciar sesión.',
      'Si ya tienes cuenta, haz clic en "Acceder" para gestionar tus obras.',
      'Navega por las secciones de funcionalidades para ver todo lo que puedes hacer.'
    ],
    actions: [
      { label: 'Iniciar sesión', icon: 'i-heroicons-arrow-right-end-on-rectangle' },
      { label: 'Ver funcionalidades', icon: 'i-heroicons-bolt' }
    ]
  },
  '/home': {
    title: 'Inicio',
    location: 'Página de inicio',
    description: 'Punto de entrada principal a v9planes.',
    tips: [
      'Explora las funcionalidades antes de registrarte.',
      'Consulta los casos de éxito para ver cómo otros profesionales usan la plataforma.'
    ]
  },
  '/pricing': {
    title: 'Precios',
    location: 'Página de precios',
    description: 'Consulta los planes de precios, incluyendo el pago por impresión de plan y suscripciones QR opcionales.',
    tips: [
      'Crear un plan es gratuito. Solo pagas cuando quieres imprimirlo en PDF.',
      'La suscripción QR te permite recibir incidencias de la obra de forma digital.'
    ]
  },
  '/funcionalidades': {
    title: 'Funcionalidades',
    location: 'Funcionalidades',
    description: 'Descubre todo lo que puedes hacer con v9planes.',
    tips: [
      'Navega por las subcategorías para conocer cada funcionalidad en detalle.'
    ]
  },
  '/funcionalidades/planes': {
    title: 'Planes de Seguridad',
    location: 'Funcionalidades > Planes',
    description: 'Crea planes de seguridad y salud profesionales en minutos.',
    tips: [
      'El editor te guía paso a paso por obra, plan, contratista, promotor y técnicos.',
      'Puedes guardar borradores gratuitamente y pagar solo al imprimir.'
    ]
  },
  '/funcionalidades/incidencias': {
    title: 'Gestión de Incidencias',
    location: 'Funcionalidades > Incidencias',
    description: 'Recibe reportes de incidencias desde la obra mediante códigos QR.',
    tips: [
      'Los trabajadores escanean el QR y reportan incidencias sin necesidad de cuenta.',
      'Recibes notificaciones en tiempo real con fotos y ubicación.'
    ]
  },
  '/funcionalidades/codigos-qr': {
    title: 'Códigos QR',
    location: 'Funcionalidades > Códigos QR',
    description: 'Genera códigos QR para acceso público a tus planes y reportes de incidencias.',
    tips: [
      'Cada plan puede tener su propio QR de descarga y QR de incidencias.',
      'Puedes regenerar, deshabilitar o compartir los QR desde el dashboard del plan.'
    ]
  },
  '/funcionalidades/presupuestos': {
    title: 'Presupuestos',
    location: 'Funcionalidades > Presupuestos',
    description: 'Gestiona el presupuesto de seguridad y salud de tu obra.',
    tips: [
      'Añade partidas, conceptos y materiales de seguridad.',
      'El sistema calcula totales y porcentajes automáticamente.'
    ]
  },
  '/funcionalidades/riesgos': {
    title: 'Evaluación de Riesgos',
    location: 'Funcionalidades > Riesgos',
    description: 'Identifica y gestiona los riesgos laborales de la obra.',
    tips: [
      'Relaciona cada riesgo con las medidas preventivas correspondientes.',
      'El plan final incluirá la evaluación de riesgos de forma estructurada.'
    ]
  },
  '/funcionalidades/normativa': {
    title: 'Normativa',
    location: 'Funcionalidades > Normativa',
    description: 'Información sobre la normativa aplicable a los planes de seguridad.',
    tips: [
      'Consulta el Real Decreto 1627/1997 y otras normativas de referencia.',
      'Todos nuestros planes están diseñados para cumplir con la legislación vigente.'
    ]
  },
  '/funcionalidades/plantillas': {
    title: 'Plantillas',
    location: 'Funcionalidades > Plantillas',
    description: 'Utiliza plantillas prediseñadas para acelerar la creación de planes.',
    tips: [
      'Puedes crear tus propias plantillas personalizadas.',
      'Las plantillas incluyen variables dinámicas como {{nom_obra}}.'
    ]
  },
  '/about': {
    title: 'Sobre nosotros',
    location: 'Acerca de',
    description: 'Conoce más sobre v9planes y nuestro equipo.',
    tips: ['Si tienes dudas, también puedes visitar la página de contacto o soporte.']
  },
  '/contact': {
    title: 'Contacto',
    location: 'Contacto',
    description: 'Ponte en contacto con el equipo de v9planes.',
    tips: ['Para soporte técnico urgente, indica claramente el asunto y tu cuenta de usuario.']
  },
  '/support': {
    title: 'Soporte',
    location: 'Soporte',
    description: 'Centro de ayuda y recursos para usuarios de v9planes.',
    tips: ['Revisa la documentación y preguntas frecuentes antes de escribirnos.']
  },
  '/blog': {
    title: 'Blog',
    location: 'Blog',
    description: 'Noticias, consejos y actualizaciones sobre seguridad en construcción.',
    tips: ['Mantente al día con las últimas novedades del sector y de la plataforma.']
  },
  '/casos-de-exito': {
    title: 'Casos de Éxito',
    location: 'Casos de éxito',
    description: 'Descubre cómo otros profesionales usan v9planes.',
    tips: ['Inspírate con proyectos reales y optimiza tu flujo de trabajo.']
  },
  '/recursos': {
    title: 'Recursos',
    location: 'Recursos',
    description: 'Materiales descargables y herramientas útiles para tu trabajo.',
    tips: ['Descarga plantillas, checklists y documentación de referencia.']
  },

  // =================== AUTH ===================
  '/login': {
    title: 'Iniciar Sesión',
    location: 'Autenticación',
    description: 'Accede a tu cuenta de v9planes para gestionar tus planes de seguridad.',
    tips: [
      'Puedes iniciar sesión con email y contraseña, Google o GitHub.',
      'Si olvidaste tu contraseña, utiliza el enlace "¿Olvidaste tu contraseña?".'
    ]
  },
  '/register': {
    title: 'Crear Cuenta',
    location: 'Registro',
    description: 'Regístrate gratis en v9planes y empieza a crear planes de seguridad.',
    tips: [
      'El registro es gratuito y no requiere tarjeta de crédito.',
      'Verifica tu email para activar todas las funcionalidades de la cuenta.'
    ]
  },
  '/signup': {
    title: 'Registro',
    location: 'Registro',
    description: 'Formulario de alta para nuevos usuarios.',
    tips: ['Completa tus datos y verifica tu correo electrónico para continuar.']
  },
  '/forgot-password': {
    title: 'Recuperar Contraseña',
    location: 'Autenticación',
    description: 'Solicita un enlace para restablecer tu contraseña.',
    tips: [
      'Recibirás un email con un enlace temporal válido por 1 hora.',
      'Si no encuentras el email, revisa la carpeta de spam o correo no deseado.'
    ]
  },
  '/reset-password': {
    title: 'Restablecer Contraseña',
    location: 'Autenticación',
    description: 'Introduce tu nueva contraseña para recuperar el acceso a tu cuenta.',
    tips: [
      'Elige una contraseña segura de al menos 8 caracteres.',
      'El enlace de recuperación expira pasada una hora por seguridad.'
    ]
  },
  '/verify-email': {
    title: 'Verificar Email',
    location: 'Autenticación',
    description: 'Confirma tu dirección de correo electrónico para activar tu cuenta.',
    tips: [
      'Haz clic en el enlace que recibiste por email.',
      'Si el enlace expiró, solicita uno nuevo desde la página de inicio de sesión.'
    ]
  },
  '/accept-invite': {
    title: 'Aceptar Invitación',
    location: 'Colaboración',
    description: 'Acepta una invitación para colaborar en un plan de seguridad.',
    tips: [
      'Revisa el nombre de la obra y el rol que se te ha asignado antes de aceptar.',
      'Si no tienes cuenta, se te guiará para crear una automáticamente.'
    ]
  },
  '/qr-join': {
    title: 'Unirse por QR',
    location: 'Colaboración',
    description: 'Accede a una obra escaneando un código QR de invitación.',
    tips: ['Asegúrate de que el QR es válido y no ha expirado.']
  },

  // =================== PROTECTED - APP LAYOUT ===================
  '/protected/logged': {
    title: 'Mis Obras',
    location: 'Dashboard principal',
    description: 'Panel principal desde el que gestionas tus obras y partidas.',
    tips: [
      'Desde aquí puedes crear nuevos planes de seguridad o editar los existentes.',
      'Haz clic en una obra para acceder a su dashboard y continuar trabajando.',
      'Los conceptos/partidas son reutilizables entre diferentes planes.'
    ],
    actions: [
      { label: 'Crear nueva obra', icon: 'i-heroicons-plus' },
      { label: 'Gestionar partidas', icon: 'i-heroicons-circle-stack' }
    ]
  },
  '/protected/usuarios/[[id]]/usuario': {
    title: 'Perfil de Usuario',
    location: 'Usuario',
    description: 'Visualiza la información pública y privada de tu perfil.',
    tips: [
      'Para editar tus datos personales, accede a Settings > Perfil.',
      'Desde aquí también puedes ver tu historial de actividad.'
    ]
  },
  '/protected/usuarios/[[id]]/settings': {
    title: 'Configuración de Usuario',
    location: 'Usuario > Settings',
    description: 'Centro de configuración avanzada de tu cuenta. Desde aquí gestionas plantillas de memorias, tablas maestras, partidas por defecto, configuración de app, presupuesto y códigos QR.',
    tips: [
      'Navega entre las pestañas para acceder a cada área de configuración.',
      'La ayuda contextual cambia automáticamente según la pestaña activa.',
      'Algunos ajustes (como tablas maestras o presupuesto) se reutilizan automáticamente en tus nuevos planes.'
    ]
  },
  '/protected/usuarios/[[id]]/settings#memorias': {
    title: 'Administración de Memorias',
    location: 'Usuario > Settings > Memorias',
    description: 'Gestiona las plantillas de memorias para tus planes de seguridad. Puedes crear, editar y eliminar plantillas con variables dinámicas que se reemplazan automáticamente al generar el PDF.',
    tips: [
      'Usa el botón correspondiente para crear una nueva plantilla desde cero.',
      'Las plantillas utilizan variables como {{nom_obra}}, {{dir_obra}}, {{nom_contratista}}, etc.',
      'Al editar una plantilla existente, los cambios se aplican a los próximos planes que la usen.',
      'Asegúrate de que la sintaxis de las variables sea correcta para evitar errores en la generación del documento.'
    ],
    actions: [
      { label: 'Crear plantilla', description: 'Añade una nueva plantilla de memoria', icon: 'i-heroicons-plus' },
      { label: 'Editar plantilla', description: 'Modifica el contenido y variables', icon: 'i-heroicons-pencil' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#detallesgraficos': {
    title: 'Detalles Gráficos de Usuario',
    location: 'Usuario > Settings > Detalles Gráficos',
    description: 'Administra las imágenes, planos y esquemas de tu biblioteca personal. Estos detalles gráficos pueden incluirse posteriormente en los planes de seguridad.',
    tips: [
      'Sube imágenes de alta resolución para que se vean correctamente en el PDF final.',
      'Organiza tus gráficos por categorías o proyectos para encontrarlos más rápido.',
      'Las imágenes que añadas aquí estarán disponibles en cualquier plan que edites.'
    ]
  },
  '/protected/usuarios/[[id]]/settings#mastertable': {
    title: 'Tablas Maestras',
    location: 'Usuario > Settings > Tablas Maestras',
    description: 'Configura tus tablas maestras personalizadas: capítulos, riesgos, probabilidad, gravedad, EPIs, productos químicos, máquinas, protecciones colectivas y medios auxiliares.',
    tips: [
      'Selecciona el tipo de tabla que quieres editar desde el desplegable superior.',
      'Cada tabla tiene valores por defecto del administrador y tus propios valores personalizados.',
      'Usa "Restablecer por defecto" para volver a los valores iniciales del sistema.',
      'Usa "Copiar de valores por defecto" para traer los valores del admin a tu lista personal.'
    ],
    actions: [
      { label: 'Seleccionar tabla', description: 'Cambia entre tipos de tabla maestra', icon: 'i-heroicons-table-cells' },
      { label: 'Restablecer por defecto', description: 'Recupera los valores originales', icon: 'i-heroicons-arrow-path' },
      { label: 'Copiar de valores por defecto', description: 'Duplica los valores del administrador', icon: 'i-heroicons-document-duplicate' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#appsettings': {
    title: 'Configuración de la Aplicación',
    location: 'Usuario > Settings > Configuración de App',
    description: 'Ajusta el comportamiento global de v9planes respecto a la persistencia de datos y la carga automática de valores por defecto en tus planes.',
    tips: [
      'Persistir capítulos por plan: guarda capítulos específicos para cada obra en lugar de usar los globales.',
      'Persistir partidas por plan: guarda partidas específicas para cada obra.',
      'Persistir presupuesto por plan: guarda presupuesto específico para cada obra.',
      'Cargar automáticamente valores por defecto del usuario: prioriza tus valores personalizados sobre los del administrador cuando un plan no tiene datos propios.'
    ],
    actions: [
      { label: 'Guardar configuración', description: 'Aplica los cambios de comportamiento', icon: 'i-heroicons-check' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#presupuestosettings': {
    title: 'Configuración de Presupuesto',
    location: 'Usuario > Settings > Configuración de Presupuesto',
    description: 'Gestiona tus conceptos de presupuesto personalizados y los valores por defecto del administrador. Estos conceptos se usarán en tus planes cuando no haya un presupuesto específico definido.',
    tips: [
      'Los conceptos incluyen concepto, tipo, unidades, precio unitario, amortización y total.',
      'Puedes restablecer tu lista personalizada a los valores por defecto del administrador.',
      'Si eres administrador, también puedes editar los valores por defecto globales desde aquí.',
      'Activa "Persistir presupuesto por plan" para que cada plan tenga su propio presupuesto independiente.'
    ],
    actions: [
      { label: 'Añadir concepto', description: 'Crea un nuevo concepto de presupuesto', icon: 'i-heroicons-plus' },
      { label: 'Restablecer', description: 'Vuelve a los valores por defecto', icon: 'i-heroicons-arrow-path' },
      { label: 'Guardar configuración', description: 'Guarda los ajustes de persistencia', icon: 'i-heroicons-check' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#defaultpartidas': {
    title: 'Mis Partidas por Defecto',
    location: 'Usuario > Settings > Mis Partidas por Defecto',
    description: 'Define las partidas que aparecerán por defecto en tus nuevos planes de seguridad. Puedes organizarlas, editarlas y establecer su orden de aparición.',
    tips: [
      'Las partidas por defecto ahorran tiempo al crear nuevos planes.',
      'Puedes reorganizar el orden arrastrando las partidas (si la interfaz lo permite).',
      'Recuerda guardar los cambios para que se apliquen a los próximos planes que crees.'
    ],
    actions: [
      { label: 'Añadir partida', description: 'Incluye una nueva partida por defecto', icon: 'i-heroicons-plus' },
      { label: 'Guardar cambios', description: 'Persiste la lista de partidas', icon: 'i-heroicons-check' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#qrs': {
    title: 'Configuración QR',
    location: 'Usuario > Settings > QR',
    description: 'Ajusta los parámetros globales para la generación de códigos QR en tus planes: URL base, generación automática y período de validez.',
    tips: [
      'URL base: define el dominio que se usará en los enlaces públicos de tus planes.',
      'Generación automática: cada plan nuevo tendrá su QR desde el momento de la creación.',
      'Período de expiración: elige cuánto tiempo permanecerá activo el enlace público (30, 90, 180 días...).',
      'Los códigos QR se insertan automáticamente en el PDF del plan para facilitar el acceso público.'
    ],
    actions: [
      { label: 'Guardar configuración QR', description: 'Aplica la URL base y la expiración', icon: 'i-heroicons-check' },
      { label: 'Restablecer', description: 'Recupera los valores guardados', icon: 'i-heroicons-arrow-path' }
    ]
  },
  '/protected/usuarios/[[id]]/settings#admin-tools': {
    title: 'Herramientas de Administrador',
    location: 'Usuario > Settings > Admin',
    description: 'Herramientas exclusivas para administradores del sistema. Desde aquí puedes ejecutar tareas de mantenimiento y actualización masiva de datos.',
    tips: [
      'Rellenar nombres de capítulos: actualiza masivamente los conceptos que no tienen asignado un capitulo_title.',
      'Esta acción modifica registros en la base de datos; úsala con precaución.',
      'Asegúrate de tener una copia de seguridad antes de ejecutar operaciones masivas.'
    ],
    actions: [
      { label: 'Rellenar Nombres de Capítulos', description: 'Actualización masiva de conceptos', icon: 'i-heroicons-database-arrow-down' }
    ]
  },
  '/protected/usuarios/payments': {
    title: 'Historial de Pagos',
    location: 'Pagos',
    description: 'Consulta todos tus pagos e invoices asociados a los planes de seguridad.',
    tips: [
      'Los pagos pendientes aparecen resaltados en rojo; puedes hacer clic en ellos para pagar.',
      'Desde la pestaña "Invoices" puedes descargar tus facturas en PDF.',
      'Utiliza los filtros de ordenación para encontrar pagos rápidamente.'
    ],
    actions: [
      { label: 'Pagar pendiente', icon: 'i-lucide-credit-card' },
      { label: 'Descargar invoice', icon: 'i-lucide-download' }
    ]
  },
  '/protected/payment': {
    title: 'Pago del Plan',
    location: 'Pago',
    description: 'Proceso de pago seguro mediante Stripe para desbloquear la impresión de tu plan.',
    tips: [
      'Serás redirigido a Stripe Checkout de forma segura.',
      'Una vez completado el pago, podrás volver e imprimir tu plan las veces que necesites.'
    ]
  },
  '/protected/colaborador': {
    title: 'Panel de Colaborador',
    location: 'Colaborador',
    description: 'Vista simplificada para usuarios con rol de colaborador o control.',
    tips: [
      'Como colaborador, tienes acceso limitado a las obras en las que participas.',
      'Consulta las incidencias reportadas y colabora en la gestión del plan.'
    ]
  },
  '/protected/admin/defaults': {
    title: 'Configuración por Defecto',
    location: 'Administración',
    description: 'Panel de administración para gestionar valores por defecto del sistema.',
    tips: [
      'Solo los administradores tienen acceso a esta sección.',
      'Los cambios aquí afectan a la configuración global de la plataforma.'
    ]
  },
  '/protected/admin/pricing': {
    title: 'Configuración de Precios',
    location: 'Administración',
    description: 'Gestiona los precios de impresión y suscripciones para los usuarios.',
    tips: [
      'Ajusta el precio por plan (PSS) que ven los usuarios en el checkout.',
      'Los cambios se aplican a los nuevos pagos inmediatamente.'
    ]
  },

  // =================== PROTECTED - PLAN LAYOUT ===================
  '/protected/planes/[[id]]/dashboard': {
    title: 'Dashboard del Plan',
    location: 'Plan > Dashboard',
    description: 'Visión general del estado de tu plan de seguridad, métricas clave y acciones rápidas.',
    tips: [
      'Revisa el porcentaje de completitud de cada sección antes de imprimir.',
      'Genera o regenera los códigos QR para acceso público e incidencias.',
      'Desde aquí puedes ir directamente a cualquier sección del plan.'
    ],
    actions: [
      { label: 'Editar obra', icon: 'i-heroicons-building-office-2' },
      { label: 'Imprimir plan', icon: 'i-heroicons-printer' },
      { label: 'Ver incidencias', icon: 'i-heroicons-qr-code' }
    ]
  },
  '/protected/planes/[[id]]/obra': {
    title: 'Datos de la Obra',
    location: 'Plan > Obra',
    description: 'Completa la información general de la obra: nombre, dirección, características técnicas y presupuesto.',
    tips: [
      'Estos datos son fundamentales porque se utilizan en la plantilla del PDF final.',
      'Selecciona la plantilla adecuada desde el desplegable superior antes de guardar.',
      'Si el plan ya fue pagado, los datos de la obra se bloquean para evitar modificaciones.'
    ]
  },
  '/protected/planes/[[id]]/plan': {
    title: 'Datos del Plan',
    location: 'Plan > Plan',
    description: 'Configura los aspectos específicos del plan de seguridad: trabajadores, duración, extintores, instalaciones.',
    tips: [
      'Indica el número estimado de trabajadores y la duración en meses.',
      'Especifica los medios preventivos disponibles: extintores, duchas, vestuarios, etc.'
    ]
  },
  '/protected/planes/[[id]]/contratista': {
    title: 'Datos del Contratista',
    location: 'Plan > Contratista',
    description: 'Registra la información del contratista ejecutor de la obra y del recurso preventivo.',
    tips: [
      'Incluye el CIF, dirección fiscal y datos de contacto del contratista.',
      'El recurso preventivo es una figura clave en el plan de seguridad.'
    ]
  },
  '/protected/planes/[[id]]/promotor': {
    title: 'Datos del Promotor',
    location: 'Plan > Promotor',
    description: 'Introduce los datos del promotor o propietario de la obra.',
    tips: [
      'El promotor es quien encarga la obra y aparecerá en la documentación final.',
      'Asegúrate de que el CIF y la dirección fiscal sean correctos.'
    ]
  },
  '/protected/planes/[[id]]/tecnicos': {
    title: 'Técnicos de la Obra',
    location: 'Plan > Técnicos',
    description: 'Añade los técnicos que intervienen en la obra: coordinadores, redactores, directores.',
    tips: [
      'Indica nombre, titulación, cargo, CIF y datos de contacto de cada técnico.',
      'Puedes añadir tantos técnicos como sean necesarios para la obra.'
    ]
  },
  '/protected/planes/[[id]]/colaboradores': {
    title: 'Colaboradores',
    location: 'Plan > Colaboradores',
    description: 'Gestiona quién tiene acceso a este plan y cómo se unieron.',
    tips: [
      'Invita a compañeros por email para que colaboren en el plan.',
      'Puedes ver quién accedió por invitación directa y quién por código QR.',
      'Los colaboradores con rol "control" tienen permisos limitados.'
    ]
  },
  '/protected/planes/[[id]]/partidas': {
    title: 'Partidas del Plan',
    location: 'Plan > Partidas',
    description: 'Selecciona y configura las partidas o capítulos que componen el plan de seguridad.',
    tips: [
      'Las partidas definen la estructura del documento final.',
      'Puedes personalizar la descripción de cada capítulo según las necesidades de la obra.'
    ]
  },
  '/protected/planes/[[id]]/presupuesto': {
    title: 'Presupuesto del Plan',
    location: 'Plan > Presupuesto',
    description: 'Desglose del presupuesto de seguridad y salud asignado a la obra.',
    tips: [
      'Añade conceptos, cantidades, precios unitarios y porcentajes de amortización.',
      'El total del presupuesto de seguridad se refleja automáticamente en el dashboard.'
    ]
  },
  '/protected/planes/[[id]]/impresion': {
    title: 'Impresión del Plan',
    location: 'Plan > Imprimir',
    description: 'Genera el PDF final de tu plan de seguridad una vez completado y pagado.',
    tips: [
      'Si no has pagado aún, verás el botón para proceder al pago antes de imprimir.',
      'Una vez pagado, puedes imprimir el plan tantas veces como necesites sin coste adicional.',
      'Selecciona la plantilla correcta y previsualiza antes de descargar.'
    ]
  },
  '/protected/planes/[[id]]/detalles-graficos': {
    title: 'Detalles Gráficos',
    location: 'Plan > Detalles Gráficos',
    description: 'Añade imágenes, planos y esquemas que se incluirán en el plan de seguridad.',
    tips: [
      'Sube imágenes de alta calidad para que se vean bien en el PDF.',
      'Las imágenes se insertan en la plantilla mediante variables como {{detalles_graficos}}.',
      'Puedes asociar imágenes a capítulos específicos del plan.'
    ]
  },
  '/protected/planes/[[id]]/issues': {
    title: 'Incidencias del Plan',
    location: 'Plan > Incidencias',
    description: 'Gestiona los reportes de incidencias recibidos desde el código QR de la obra.',
    tips: [
      'Revisa el estado de cada incidencia: pendiente, en curso, resuelta.',
      'Las incidencias incluyen fotos, ubicación y datos de contacto del reportante.',
      'Mantén informado al equipo de obra sobre las incidencias abiertas.'
    ]
  },
  '/protected/planes': {
    title: 'Mis Planes',
    location: 'Planes',
    description: 'Listado de todos tus planes de seguridad.',
    tips: ['Haz clic en cualquier plan para editarlo o ver su dashboard.']
  },

  // =================== PROTECTED - SETTINGS (tabs) ===================
  '/protected/settings': {
    title: 'Configuración General',
    location: 'Settings > General',
    description: 'Centro de configuración de tu cuenta. Desde aquí puedes gestionar tu perfil, cambiar la contraseña y configurar los códigos QR de tus planes.',
    tips: [
      'Usa las pestañas superiores para moverte entre las diferentes secciones de configuración.',
      'Los cambios en cada pestaña se guardan de forma independiente.',
      'Si necesitas ayuda sobre una sección específica, abre el panel de ayuda estando dentro de esa pestaña.'
    ],
    actions: [
      { label: 'Perfil', description: 'Edita tus datos personales y de empresa', icon: 'i-heroicons-user' },
      { label: 'Contraseña', description: 'Actualiza tu contraseña de acceso', icon: 'i-heroicons-key' },
      { label: 'Códigos QR', description: 'Configura y gestiona tus códigos QR', icon: 'i-heroicons-qr-code' }
    ]
  },
  '/protected/settings/general': {
    title: 'Configuración General',
    location: 'Settings > General',
    description: 'Punto central de configuración de v9planes. Navega por las pestañas para acceder a las opciones específicas de perfil, seguridad y códigos QR.',
    tips: [
      'La pestaña General es el punto de partida de la configuración.',
      'Cada pestaña guarda sus cambios por separado; no hay un guardado global.',
      'Si algo no funciona como esperas, prueba a recargar la página desde la pestaña correspondiente.'
    ],
    actions: [
      { label: 'Ir a Perfil', description: 'Modifica datos de contacto y empresa', icon: 'i-heroicons-user' },
      { label: 'Ir a QR', description: 'Ajusta la generación y expiración de códigos QR', icon: 'i-heroicons-qrcode' }
    ]
  },
  '/protected/settings/perfil': {
    title: 'Perfil de Usuario',
    location: 'Settings > Perfil',
    description: 'Actualiza tu información personal, datos de contacto y los de tu empresa. Estos datos pueden aparecer en las plantillas de documentos que generes.',
    tips: [
      'El email debe tener un formato válido; es también tu usuario de acceso a la plataforma.',
      'Los campos de empresa (CIF, dirección, población, CP) son opcionales pero útiles para rellenar documentos automáticamente.',
      'Pulsa "Guardar cambios" solo cuando hayas terminado; el botón se activa cuando detecta modificaciones.',
      'Si olvidaste tu contraseña, puedes usar el enlace "¿Olvidaste tu contraseña?" para restablecerla.'
    ],
    actions: [
      { label: 'Guardar cambios', description: 'Persiste los datos modificados de tu perfil', icon: 'i-heroicons-check' },
      { label: 'Restablecer', description: 'Descarta los cambios no guardados', icon: 'i-heroicons-arrow-path' },
      { label: 'Cambiar contraseña', description: 'Te lleva a la pestaña de seguridad', icon: 'i-heroicons-key' }
    ]
  },
  '/protected/settings/contrasena': {
    title: 'Cambiar Contraseña',
    location: 'Settings > Contraseña',
    description: 'Actualiza tu contraseña de acceso de forma segura. Debes proporcionar tu contraseña actual para confirmar la operación.',
    tips: [
      'La nueva contraseña debe tener al menos 8 caracteres.',
      'Asegúrate de que la nueva contraseña y la confirmación coincidan exactamente.',
      'Si tu cuenta está vinculada a Google o GitHub y nunca estableciste una contraseña, usa "Olvidé mi contraseña" para crear una.',
      'Usa una combinación de letras, números y símbolos para mayor seguridad.'
    ],
    actions: [
      { label: 'Mostrar / ocultar', description: 'Pulsa el icono del ojo para ver u ocultar cada campo', icon: 'i-heroicons-eye' },
      { label: 'Cambiar contraseña', description: 'Se activa cuando todos los campos son válidos', icon: 'i-heroicons-check' },
      { label: 'Cancelar', description: 'Limpia el formulario sin aplicar cambios', icon: 'i-heroicons-x-mark' }
    ]
  },
  '/protected/settings/qr': {
    title: 'Configuración de Códigos QR',
    location: 'Settings > Códigos QR',
    description: 'Define los ajustes globales para la generación de códigos QR en tus planes de seguridad: URL base, generación automática y período de validez.',
    tips: [
      'URL base: determina el dominio que se usará en los enlaces de los códigos QR. Usa una URL corta y fácil de compartir.',
      'Generación automática: si está activada, cada plan nuevo tendrá su código QR al crearse.',
      'Período de expiración: elige la duración según la duración típica de tus obras (30, 90, 180 días, etc.).',
      'Los cambios aquí afectan principalmente a los planes que crees a partir de ahora.'
    ],
    actions: [
      { label: 'Guardar configuración QR', description: 'Aplica los cambios de URL base y expiración', icon: 'i-heroicons-check' },
      { label: 'Restablecer', description: 'Recupera los valores guardados en el servidor', icon: 'i-heroicons-arrow-path' },
      { label: 'Ver mis códigos QR', description: 'Revisa el estado de todos tus códigos QR activos', icon: 'i-heroicons-qr-code' }
    ]
  },
  '/protected/settings/codigos-qr': {
    title: 'Mis Códigos QR',
    location: 'Settings > Mis Códigos QR',
    description: 'Vista unificada de todos los códigos QR asociados a tus planes. Consulta estadísticas de uso, fechas de expiración y gestiona el estado de cada código.',
    tips: [
      'Total QR: número de planes que tienen un código QR generado.',
      'Activos: códigos que actualmente permiten el acceso público al plan.',
      'Expirados: cuyo período de validez ha finalizado; puedes regenerarlos para renovar el enlace.',
      'Deshabilitados: códigos que has desactivado manualmente; no permiten acceso público hasta que los vuelvas a habilitar.',
      'Regenerar un QR genera un nuevo token y fecha de expiración; el enlace anterior dejará de funcionar.'
    ],
    actions: [
      { label: 'Habilitar / Deshabilitar', description: 'Activa o pausa el acceso público de un QR concreto', icon: 'i-heroicons-toggle' },
      { label: 'Regenerar', description: 'Crea un nuevo token y reinicia la fecha de expiración', icon: 'i-heroicons-arrow-path' },
      { label: 'Ver plan', description: 'Accede al dashboard del plan vinculado al código', icon: 'i-heroicons-eye' },
      { label: 'Configurar QR', description: 'Ajusta la configuración global de generación de códigos', icon: 'i-heroicons-cog-6-tooth' }
    ]
  },

  // =================== PUBLIC - ISSUES / PLAN ACCESS ===================
  '/public/issues/[[qrSlug]]/[[code]]': {
    title: 'Reportar Incidencia',
    location: 'Acceso público > Incidencias',
    description: 'Formulario para reportar una incidencia en la obra de forma anónima o verificada.',
    tips: [
      'Describe el problema con el mayor detalle posible.',
      'Adjunta fotos para que el coordinador pueda evaluar la incidencia.',
      'Indica tu ubicación dentro de la obra si es relevante.'
    ]
  },
  '/public/issues/[[qrSlug]]/[accessToken]': {
    title: 'Reportar Incidencia',
    location: 'Acceso público > Incidencias',
    description: 'Formulario público para el reporte de incidencias mediante QR.',
    tips: [
      'No necesitas tener una cuenta para reportar una incidencia.',
      'El coordinador de la obra será notificado automáticamente.'
    ]
  },
  '/public/planes/[[id]]/[slug]': {
    title: 'Plan Público',
    location: 'Acceso público > Plan',
    description: 'Vista pública de un plan de seguridad accesible mediante QR.',
    tips: [
      'Esta es una versión simplificada del plan destinada a consulta pública.',
      'No se muestra información sensible del contratista o promotor.'
    ]
  },

  // =================== DOCS / OTHER ===================
  '/docs/[[...slug]]': {
    title: 'Documentación',
    location: 'Documentación',
    description: 'Documentación técnica y guías de uso de v9planes.',
    tips: ['Utiliza el buscador interno para encontrar artículos sobre funcionalidades específicas.']
  },
  '/changelog': {
    title: 'Changelog',
    location: 'Changelog',
    description: 'Historial de cambios y nuevas funcionalidades de v9planes.',
    tips: ['Consulta las últimas actualizaciones para aprovechar las nuevas mejoras.']
  }
}
