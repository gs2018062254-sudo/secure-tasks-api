const formulario = document.getElementById('formulario');
const campoFiltro = document.getElementById('filtro');
const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const estadoApi = document.getElementById('estado-api');
const detalleApi = document.getElementById('detalle-api');

let tareas = [];

function marcarEstado(texto, clase) {
  estadoApi.textContent = texto;
  estadoApi.className = `estado ${clase}`;
}

async function cargarSalud() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    marcarEstado('api en linea', 'ok');
    detalleApi.textContent = `version ${data.version} - uptime ${data.uptime}s`;
  } catch (error) {
    marcarEstado('api sin conexion', 'error');
  }
}

async function cargarTareas() {
  const res = await fetch('/api/tasks');
  const data = await res.json();
  tareas = data.tasks;
  pintarTareas();
}

// v1.1.0: la salida se construye con nodos del DOM y textContent, de modo que
// el contenido de la API nunca se interpreta como HTML. Esto elimina el
// sumidero de XSS almacenado (CWE-79) que arrastraba la v1.0.0.
function crearElemento(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);

  if (clase) {
    nodo.className = clase;
  }

  nodo.textContent = texto;
  return nodo;
}

function pintarTareas() {
  const termino = campoFiltro.value.trim().toLowerCase();
  const visibles = termino
    ? tareas.filter((t) => t.title.toLowerCase().includes(termino))
    : tareas;

  const nodos = visibles.length === 0
    ? [crearElemento('li', 'vacio', 'No hay tareas para mostrar.')]
    : visibles.map((t) => {
        const item = crearElemento('li', 'tarea', '');
        item.append(
          crearElemento('strong', '', t.title),
          crearElemento('span', 'insignia', t.priority),
          crearElemento('p', '', t.description || 'Sin descripcion')
        );
        return item;
      });

  lista.replaceChildren(...nodos);
  contador.textContent = `${visibles.length} de ${tareas.length} tarea(s)`;
}

async function crearTarea(evento) {
  evento.preventDefault();

  const titulo = document.getElementById('titulo').value.trim();
  const priority = document.getElementById('prioridad').value;

  if (titulo.length < 3) {
    return;
  }

  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: titulo, priority }),
  });

  if (res.ok) {
    formulario.reset();
    await cargarTareas();
  }
}

formulario.addEventListener('submit', crearTarea);
campoFiltro.addEventListener('input', pintarTareas);

cargarSalud();
cargarTareas();
