const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const tasksRouter = require('./routes/tasks');

const PKG = require('../package.json');

const app = express();

app.disable('x-powered-by');

// Cabeceras de seguridad HTTP (CSP, HSTS, nosniff, frameguard, etc.).
app.use(helmet());

// Politica CORS configurable por variable de entorno.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);

// Limite del cuerpo de la peticion para reducir la superficie de ataque.
app.use(express.json({ limit: '10kb' }));

// Limite de peticiones por IP para mitigar abuso y fuerza bruta.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: PKG.version,
    uptime: Number(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/tasks', tasksRouter);

// Panel web estatico (en Vercel se sirve directamente desde /public).
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Manejador de errores centralizado: nunca expone trazas al cliente.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(err.status || 500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
