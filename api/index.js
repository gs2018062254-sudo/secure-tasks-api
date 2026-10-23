const app = require('../src/app');

// Punto de entrada serverless para Vercel: la misma aplicacion Express
// se expone como funcion sin servidor en la ruta /api/*.
module.exports = app;
