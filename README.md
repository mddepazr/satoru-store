# Satoru Store

Catálogo de tecnología y accesorios desarrollado con React y Express.
Permite consultar productos y agregar nuevos registros con nombre,
precio y categoría.

![Catálogo de Satoru Store](docs/01-catalogo.jpeg)

## Funcionalidades

- Lista de productos obtenida desde una API propia.
- Formulario para agregar productos.
- Validaciones en frontend y backend.
- Estados de carga, confirmación y error.
- Opción de reintentar cuando falla la conexión.
- Precios en quetzales e interfaz adaptable a pantallas pequeñas.

Los datos se guardan en un arreglo temporal del backend.
Al reiniciar el servidor, se restauran los tres productos iniciales.

## Ejecutar el proyecto

Requisitos: Node.js 24 LTS y Git.

```powershell
git clone https://github.com/mddepazr/satoru-store.git
cd satoru-store

npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

Desde la raíz del proyecto, abre dos terminales.

**Terminal 1 — API:**

```powershell
npm.cmd --prefix backend run dev
```

**Terminal 2 — React:**

```powershell
npm.cmd --prefix frontend run dev
```

Abre el catálogo en http://localhost:5173.

La API está disponible en http://127.0.0.1:3001/api/productos.
Mantén ambas terminales abiertas. Para detenerlas, presiona Ctrl + C.

## API

| Método | Ruta | Resultado |
|---|---|---|
| GET | `/api/productos` | Lista de productos, HTTP 200 |
| POST | `/api/productos` | Producto creado, HTTP 201 |

Ejemplo del cuerpo de una solicitud POST:

```json
{
  "nombre": "Cámara web",
  "precio": 325,
  "categoria": "Accesorios"
}
```

El POST requiere `Content-Type: application/json`.
Los datos inválidos reciben una respuesta HTTP 400 con un mensaje
y los errores correspondientes.

El nombre admite de 2 a 80 caracteres y la categoría de 2 a 40.
El precio debe ser numérico, mayor que cero, no superar Q1,000,000
y tener hasta dos decimales.

## Cómo funciona

El usuario completa el formulario. React valida los campos y envía
una solicitud con `fetch`. La API recibe el JSON, valida los datos
y guarda el producto en memoria. Después devuelve el registro creado
y React lo incorpora a la lista.

Durante el desarrollo, Vite redirige las solicitudes `/api` a Express.
El frontend comprueba la respuesta HTTP y muestra mensajes cuando
la solicitud falla.

## Organización

| Ubicación | Responsabilidad |
|---|---|
| `backend/src/routes` | Rutas HTTP |
| `backend/src/controllers` | Solicitudes y respuestas JSON |
| `backend/src/services` | Validación y reglas de productos |
| `backend/src/repositories` | Almacenamiento temporal |
| `backend/src/middleware` | Manejo central de errores |
| `frontend/src/services` | Comunicación con la API |
| `frontend/src/components` | Formulario y tabla |
| `frontend/src/App.jsx` | Estado y coordinación de la pantalla |
| `docs` | Capturas de funcionamiento |

El servicio recibe el repositorio por inyección de dependencias.
Esto facilita reemplazar el arreglo por otro almacenamiento que
mantenga los métodos `listar()` y `crear()`.

## Verificación y evidencias

```powershell
npm.cmd --prefix frontend run build
npm.cmd --prefix frontend run lint
```

| Evidencia | Captura |
|---|---|
| Catálogo y producto agregado | [Ver](docs/01-catalogo.jpeg) |
| Validación de campos vacíos | [Ver](docs/02-campos-vacios.jpeg) |
| Rechazo de precio negativo | [Ver](docs/03-precio-negativo.jpeg) |
| Error de conexión y reintento | [Ver](docs/04-error-conexion.jpeg) |
| Respuesta JSON de la API | [Ver](docs/05-respuesta-json.jpeg) |

El proyecto corresponde a una demostración local.
La compilación genera el frontend; un despliegue requiere configurar
cómo se servirán esos archivos y cómo accederán a la API.

## Autor

Marcos Daniel de Páz Rodas — Carnet 2500587  
Programación IV · Universidad San Pablo de Guatemala