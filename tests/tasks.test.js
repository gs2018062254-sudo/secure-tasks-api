const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('GET /api/health responde ok', async () => {
  const res = await request(app).get('/api/health');

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.ok(res.body.version);
});

test('GET /api/tasks devuelve el listado sembrado', async () => {
  const res = await request(app).get('/api/tasks');

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.tasks));
  assert.ok(res.body.count >= 1);
});

test('POST /api/tasks crea una tarea valida', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'Validar cabeceras HTTP', priority: 'alta' });

  assert.equal(res.status, 201);
  assert.equal(res.body.title, 'Validar cabeceras HTTP');
  assert.equal(res.body.priority, 'alta');
  assert.ok(res.body.id);
});

test('POST /api/tasks rechaza titulos demasiado cortos', async () => {
  const res = await request(app).post('/api/tasks').send({ title: 'ab' });

  assert.equal(res.status, 400);
  assert.ok(res.body.details.length > 0);
});

test('POST /api/tasks ignora propiedades no permitidas', async () => {
  const res = await request(app)
    .post('/api/tasks')
    .send({ title: 'Tarea con campo extra', id: 'id-manipulado', admin: true });

  assert.equal(res.status, 201);
  assert.notEqual(res.body.id, 'id-manipulado');
  assert.equal(res.body.admin, undefined);
});

test('GET /api/tasks/:id devuelve 404 si no existe', async () => {
  const res = await request(app).get('/api/tasks/no-existe');

  assert.equal(res.status, 404);
});

test('PATCH /api/tasks/:id actualiza el estado', async () => {
  const creada = await request(app).post('/api/tasks').send({ title: 'Tarea a completar' });

  const res = await request(app)
    .patch(`/api/tasks/${creada.body.id}`)
    .send({ status: 'completada' });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'completada');
});

test('DELETE /api/tasks/:id elimina la tarea', async () => {
  const creada = await request(app).post('/api/tasks').send({ title: 'Tarea a eliminar' });

  const res = await request(app).delete(`/api/tasks/${creada.body.id}`);

  assert.equal(res.status, 204);

  const verificacion = await request(app).get(`/api/tasks/${creada.body.id}`);
  assert.equal(verificacion.status, 404);
});

test('Las cabeceras de seguridad de helmet estan presentes', async () => {
  const res = await request(app).get('/api/health');

  assert.ok(res.headers['x-content-type-options']);
  assert.ok(res.headers['x-frame-options'] || res.headers['content-security-policy']);
  assert.equal(res.headers['x-powered-by'], undefined);
});
