const express = require('express');
const store = require('../store');

const router = express.Router();

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESC_MAX = 400;

/**
 * Validacion y normalizacion del cuerpo de la peticion.
 * Devuelve la lista de errores y solo los campos validos (allowlist),
 * evitando que el cliente escriba propiedades arbitrarias del recurso.
 */
function validateTask(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo de la peticion debe ser un objeto JSON'], data };
  }

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      errors.push('title debe ser una cadena de texto');
    } else {
      const title = body.title.trim();
      if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
        errors.push(`title debe tener entre ${TITLE_MIN} y ${TITLE_MAX} caracteres`);
      } else {
        data.title = title;
      }
    }
  } else if (!partial) {
    errors.push('title es obligatorio');
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push('description debe ser una cadena de texto');
    } else if (body.description.length > DESC_MAX) {
      errors.push(`description no puede superar ${DESC_MAX} caracteres`);
    } else {
      data.description = body.description.trim();
    }
  }

  if (body.priority !== undefined) {
    if (!store.PRIORITIES.includes(body.priority)) {
      errors.push(`priority debe ser uno de: ${store.PRIORITIES.join(', ')}`);
    } else {
      data.priority = body.priority;
    }
  }

  if (body.status !== undefined) {
    if (!store.STATUSES.includes(body.status)) {
      errors.push(`status debe ser uno de: ${store.STATUSES.join(', ')}`);
    } else {
      data.status = body.status;
    }
  }

  return { errors, data };
}

// GET /api/tasks
router.get('/', (req, res) => {
  const { status, sort, order } = req.query;
  const tasks = store.listTasks({ status, sort, order });

  res.json({ count: tasks.length, tasks });
});

// GET /api/tasks/stats
router.get('/stats', (req, res) => {
  res.json(store.stats());
});

// GET /api/tasks/:id
router.get('/:id', (req, res) => {
  const task = store.getTask(req.params.id);

  if (!task) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  return res.json(task);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { errors, data } = validateTask(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos invalidos', details: errors });
  }

  return res.status(201).json(store.createTask(data));
});

// PATCH /api/tasks/:id
router.patch('/:id', (req, res) => {
  const { errors, data } = validateTask(req.body, { partial: true });

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos invalidos', details: errors });
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No se envio ningun campo actualizable' });
  }

  const actualizada = store.updateTask(req.params.id, data);

  if (!actualizada) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  return res.json(actualizada);
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const eliminada = store.deleteTask(req.params.id);

  if (!eliminada) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  return res.status(204).send();
});

module.exports = router;
