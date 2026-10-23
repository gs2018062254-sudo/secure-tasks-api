# SecureTasks API

API REST de gestión de tareas con panel web, utilizada como **caso de estudio para el
escaneo automatizado de vulnerabilidades** dentro de un pipeline de CI/CD.

El objetivo del repositorio no es ser un producto, sino evidenciar cómo se integran
herramientas de análisis de seguridad en un flujo de integración y despliegue continuo
(shift-left), qué hallazgos reales producen y cómo se remedian.

- **Aplicación desplegada:** _pendiente: reemplazar por la URL pública de Vercel_
- **Video de la construcción:** _pendiente: reemplazar por la URL del video en YouTube / TikTok_
- **Artículo publicado:** _pendiente: reemplazar por la URL del artículo en Dev.to / Medium / HashNode_

---

## 1. Descripción de la aplicación

| Elemento | Detalle |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Persistencia | En memoria (entorno serverless) |
| Frontend | HTML + CSS + JavaScript vanilla en `/public` |
| Pruebas | `node:test` + Supertest (9 casos) |
| Despliegue | Vercel (plan gratuito, SaaS público) |

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del servicio, versión y uptime |
| GET | `/api/tasks` | Listado de tareas (`?status=`, `?sort=`, `?order=`) |
| GET | `/api/tasks/stats` | Conteo de tareas por estado y prioridad |
| GET | `/api/tasks/:id` | Detalle de una tarea |
| POST | `/api/tasks` | Crea una tarea (valida y aplica allowlist de campos) |
| PATCH | `/api/tasks/:id` | Actualiza parcialmente una tarea |
| DELETE | `/api/tasks/:id` | Elimina una tarea |

### Controles de seguridad ya implementados en el código

- `helmet` para cabeceras HTTP de seguridad (CSP, HSTS, `nosniff`, frameguard).
- `express-rate-limit` para limitar peticiones por IP.
- Límite de tamaño del cuerpo JSON (`10kb`).
- Validación con allowlist: el cliente no puede escribir `id` ni propiedades arbitrarias.
- Manejo centralizado de errores: nunca se expone la traza al cliente.
- `x-powered-by` deshabilitado.

---

## 2. Ejecución local

```bash
npm ci
npm start          # http://localhost:3000
npm test           # 9 pruebas automatizadas
```

---

## 3. Pipeline de escaneo (GitHub Actions)

El workflow [security-scan.yml](.github/workflows/security-scan.yml) se ejecuta en cada
`push` y `pull request` sobre `main`. Los hallazgos se publican en la pestaña
**Security → Code scanning** del repositorio mediante SARIF.

| # | Etapa | Herramienta | Qué busca |
|---|---|---|---|
| 1 | Secretos | **Gitleaks** | Credenciales, tokens y claves en todo el historial de Git |
| 2 | SAST | **Semgrep** | Patrones inseguros en el código propio (`p/default`, `p/owasp-top-ten`, `p/secrets`) |
| 3 | SCA + IaC | **Trivy** | CVE en dependencias, misconfiguraciones y secretos en el sistema de archivos |
| 4 | SBOM + SCA | **Syft** + **Grype** | Inventario CycloneDX de componentes y CVE detectadas sobre ese inventario |
| 5 | Pruebas | `node:test` | Regresión funcional antes de desplegar |
| 6 | CD | **Vercel CLI** | Despliegue a producción **solo** si las etapas 1-5 pasan |

Todas estas herramientas son **distintas** de las que se usan habitualmente en los
laboratorios de la asignatura (ZAP, Burp Suite, Nikto, Nessus, OpenVAS, Nuclei, Wapiti),
que corresponden a la categoría DAST y que no se emplean en este repositorio.

### Por qué falla el pipeline en la primera ejecución

La versión **v1.0.0** del repositorio parte, de forma intencional, de un escenario
realista: dependencias desactualizadas con CVE conocidas y una función de renderizado
del panel web que inserta HTML sin escapar. Esto permite observar el ciclo completo
**detectar → analizar → remediar → verificar**. La versión **v1.1.0** corrige
todos los hallazgos y deja el pipeline en verde.

---

## 4. Despliegue en Vercel

El despliegue automático usa tres secretos del repositorio:

| Secreto | Dónde obtenerlo |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Archivo `.vercel/project.json` tras ejecutar `vercel link` |
| `VERCEL_PROJECT_ID` | Archivo `.vercel/project.json` tras ejecutar `vercel link` |

Alternativa sin secretos: importar el repositorio desde el panel de Vercel
(*Add New → Project*) y eliminar el job `desplegar-vercel` del workflow.

---

## 5. Estructura del repositorio

```
secure-tasks-api/
├── .github/workflows/security-scan.yml   Pipeline de escaneo y despliegue
├── .gitleaks.toml                        Reglas del escáner de secretos
├── api/index.js                          Entrada serverless para Vercel
├── public/                               Panel web (HTML/CSS/JS)
├── src/
│   ├── app.js                            Configuración de Express y middlewares
│   ├── routes/tasks.js                   Rutas REST y validación
│   ├── server.js                         Arranque local
│   └── store.js                          Almacén en memoria
├── tests/tasks.test.js                   Pruebas automatizadas
├── package.json
└── vercel.json                           Configuración de build y rutas
```

---

## 6. Autores y licencia

Proyecto académico de **Calidad y Pruebas de Software — Unidad 2, Actividad Grupal 1**.

- _Integrante 1_
- _Integrante 2_
- _Integrante 3_

Licencia [MIT](LICENSE).
