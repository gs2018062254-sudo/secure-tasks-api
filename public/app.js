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

// Punto de partida del ejercicio: el contenido de la API se inserta
// directamente como HTML sin escapar.
function pintarTareas() {
  const termino = campoFiltro.value.trim().toLowerCase();
  const visibles = termino
    ? tareas.filter((t) => t.title.toLowerCase().includes(termino))
    : tareas;

  if (visibles.length === 0) {
    lista.innerHTML = '<li class="vacio">No hay tareas para mostrar.</li>';
  } else {
    lista.innerHTML = visibles
      .map(
        (t) => `<li class="tarea">
          <strong>${t.title}</strong>
          <span class="insignia ${t.priority}">${t.priority}</span>
          <p>${t.description || 'Sin descripcion'}</p>
        </li>`
      )
      .join('');
  }

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
