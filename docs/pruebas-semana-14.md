# Semana 14: pruebas de Satoru Store

Las pruebas comparan una entrada con un resultado esperado. Las unitarias revisan
reglas sin HTTP ni base de datos. Las de integración comprueban Express y MongoDB
trabajando juntos. Usamos `node:test` como runner y `node:assert/strict` para las aserciones.

## Ejecutar

Desde la raíz del proyecto:

```sh
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix frontend test
npm --prefix frontend run build
npm --prefix frontend run lint
```

En PowerShell usa `npm.cmd` en lugar de `npm` si la política bloquea `npm.ps1`.
`npm --prefix backend test` ejecuta juntas las unitarias y las de integración.
La primera ejecución de integración descarga MongoDB 7.0.24 para pruebas y necesita
internet. Los casos crean bases aisladas y directorios temporales: no leen `.env`
ni modifican `satoru_store`. No necesitan la API o React encendidos.

## Casos principales de la tarea

| Prueba | Entrada o preparación | Resultado esperado |
|---|---|---|
| Unitaria: producto válido | Bocina, 150, Audio | `validarProducto` devuelve `true` |
| Unitaria: precio negativo | Bocina, -1, Audio | `false` y error del precio |
| Unitaria: categoría vacía | Bocina, 150, espacios | `false` |
| Unitaria: nombre normalizado | Bocina, BOCINA, espacios exteriores | La misma clave `bocina` |
| Integración GET | Un producto preparado en MongoDB | 200, cuerpo arreglo, nombre y precio correctos |
| Integración POST | Producto válido nuevo | 201 y documento guardado con id del servidor |
| Integración negativa | Precio -1 | 400, mensaje y cero documentos nuevos |
| Integración de duplicados | Crear Bocina y repetir con BOCINA | 201 primero, 409 después y un documento |
| Integración simultánea | Dos POST equivalentes a la vez | Un 201, un 409 y un documento |

También se prueban límites, formato JSON, contenido y tamaño de la petición, rutas
inexistentes, error interno, permanencia tras reiniciar, carga inicial repetible,
preparación de registros antiguos y error 503 cuando MongoDB deja de responder.
Las pruebas del cliente verifican que GET lea el arreglo, POST lea `datos` y un 409
conserve el mensaje y el error de nombre que consume el formulario.

Cada prueba prepara sus propios datos. La prueba de persistencia tiene fases
secuenciales dentro del mismo caso porque su objetivo es comparar antes y después
del reinicio; no depende de que otro test haya creado un producto.

## Red, Green y refactor

1. Se escribieron primero las pruebas de `validarProducto` y de normalización.
2. La ejecución falló con `ERR_MODULE_NOT_FOUND` porque el nuevo módulo aún no
   existía. No era un error de MongoDB: faltaba implementar la función.
3. Se creó el validador puro y la función de normalización; las pruebas pasaron.
4. El servicio pasó a reutilizar las reglas y las pruebas de integración quedaron
   separadas por comportamiento, manteniendo la comprobación del sistema completo.

`semana-14/01-red.txt` contiene la salida real de la ejecución inicial.
Los archivos `02-green-unitarias.txt`, `03-green-integracion.txt` y
`04-green-cliente.txt`, dentro de esa misma carpeta, conservan las ejecuciones finales.
Resultado verificado en Linux con Node 24: 11 unitarias, 17 de integración y
5 del cliente, todas correctas. Para integración se usó el binario local de
MongoDB 7.0.24 descargado durante la preparación (`MONGOMS_SYSTEM_BINARY`).
La configuración normal descarga automáticamente el binario en tu equipo;
si ya tienes un mongod compatible, esa variable permite reutilizarlo.
En los registros se reemplazó únicamente la ruta absoluta del entorno por `<proyecto>`.
Un caso que espera HTTP 400 o 409 **pasa** si recibe ese error correctamente.

## Capturas para entregar

Guarda las capturas de tu terminal dentro de `docs/semana-14`:

- `01-unitarias.png`: comando `test:unit`, nombres de casos y resumen sin fallos.
- `02-integracion.png`: comando `test:integration`, GET, POST, duplicados y resumen.
- `03-duplicado.png`: interfaz mostrando «Ya existe un producto con ese nombre».

Usa una terminal suficientemente amplia y muestra el resumen. Si no cabe todo,
usa dos capturas. Los registros de texto complementan las capturas, no las reemplazan.

## Demostración y explicación

Con MongoDB local, API y React ejecutándose, agrega «Bocina» y vuelve a enviar
« BOCINA ». El segundo intento debe mostrar el error en el formulario, conservar
lo escrito y no agregar otra fila. Cambia el nombre por uno nuevo y vuelve a guardar.
En Compass verifica que solo exista un documento con `nombreNormalizado: "bocina"`.

El validador decide si los campos son correctos. El repositorio genera la clave
normalizada y MongoDB exige que sea única. Si dos solicitudes compiten, el índice
acepta una y rechaza la otra. La API traduce ese conflicto a HTTP 409.

GET ahora entrega directamente un arreglo. POST conserva `{ mensaje, datos }`.
La adaptación del cliente se probó junto con el cambio del controlador.
