const { randomUUID } = require('node:crypto');
const _ = require('lodash');

/**
 * Almacen en memoria. En un entorno serverless el estado no persiste entre
 * invocaciones, por lo que la demo se re-siembra en cada arranque en frio.
 */
const tasks = new Map();

const PRIORITIES = ['baja', 'media', 'alta'];
const STATUSES = ['pendiente', 'en_progreso', 'completada'];

function seed() {
  const iniciales = [
    { title: 'Revisar hallazgos del escaneo SAST', priority: 'alta', status: 'en_progreso' },
    { title: 'Actualizar dependencias con CVE criticos', priority: 'alta', status: 'pendiente' },
    { title: 'Generar SBOM en formato CycloneDX', priority: 'media', status: 'pendiente' },
    { title: 'Documentar el pipeline en el README', priority: 'baja', status: 'completada' },
  ];

  for (const item of iniciales) {
    createTask(item);
  }
}

function listTasks({ status, sort = 'createdAt', order = 'asc' } = {}) {
  let resultado = Array.from(tasks.values());

  if (status && STATUSES.includes(status)) {
    resultado = resultado.filter((task) => task.status === status);
  }

  const ordenado = _.sortBy(resultado, (task) => task[sort] ?? task.createdAt);

  return order === 'desc' ? ordenado.reverse() : ordenado;
}

function getTask(id) {
  return tasks.get(id) ?? null;
}

function createTask({ title, description = '', priority = 'media', status = 'pendiente' }) {
  const ahora = new Date().toISOString();

  const task = {
    id: randomUUID(),
    title: _.trim(String(title)),
    description: _.truncate(_.trim(String(description)), { length: 400 }),
    priority: PRIORITIES.includes(priority) ? priority : 'media',
    status: STATUSES.includes(status) ? status : 'pendiente',
    createdAt: ahora,
    updatedAt: ahora,
  };

  tasks.set(task.id, task);

  return task;
}

function updateTask(id, cambios) {
  const actual = tasks.get(id);

  if (!actual) {
    return null;
  }

  const actualizada = {
    ...actual,
    ...cambios,
    id: actual.id,
    createdAt: actual.createdAt,
    updatedAt: new Date().toISOString(),
  };

  tasks.set(id, actualizada);

  return actualizada;
}

function deleteTask(id) {
  return tasks.delete(id);
}

function stats() {
  const todas = Array.from(tasks.values());

  return {
    total: todas.length,
    porEstado: _.countBy(todas, 'status'),
    porPrioridad: _.countBy(todas, 'priority'),
  };
}

seed();

module.exports = {
  PRIORITIES,
  STATUSES,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  stats,
};
