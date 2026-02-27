
// Este archivo ya no es necesario para la configuración de la API_URL en Next.js.
// La configuración se ha movido al archivo .env en la raíz del proyecto.
// Puedes eliminar este archivo si lo deseas, o mantenerlo si tiene otras configuraciones.

export const environment = {
    production: true,
    nombreAplicacion: "APP_CRM_Contactos_Resiflex",

    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

    //apiURL : '/seguridades/api',
    //apiURL : 'http://localhost:5400',
    apiURL : 'https://apps.chaide.com/seguridades',

    tituloSistema: 'SISTEMA INTEGRADO DE SEGURIDADES',
};
