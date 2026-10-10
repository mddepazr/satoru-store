# Comprobar la persistencia

1. Inicia MongoDB, la API y React siguiendo el README.
2. Agrega un producto con un nombre fÃ¡cil de reconocer, por ejemplo Â«Prueba persistenciaÂ».
3. En MongoDB Compass conecta a `mongodb://127.0.0.1:27017`.
4. Abre `satoru_store` â†’ `productos` y actualiza la vista. Debe aparecer el documento.
5. Guarda esa captura como `docs/06-mongodb-productos.png`.
6. DetÃ©n solo la API con Ctrl + C y vuelve a iniciarla con `npm.cmd --prefix backend run dev`.
7. Actualiza el catÃ¡logo: el producto debe seguir allÃ­. Guarda `docs/07-producto-persistente.jpeg`.
8. Abre `http://127.0.0.1:3001/api/productos` para comprobar su respuesta JSON.

Para probar un error de base de datos, con la API encendida detÃ©n temporalmente el
servicio MongoDB desde Servicios de Windows y pulsa Actualizar en el catÃ¡logo.
La API debe responder 503 y React mostrar el error. Vuelve a iniciar MongoDB y pulsa Reintentar.
Para comprobar la permanencia al reiniciar MongoDB, repite ese reinicio y consulta el catÃ¡logo.

## ExplicaciÃ³n del flujo

El usuario completa el formulario. React valida los campos y envÃ­a un POST a la API
Express. El controlador llama al servicio, que valida las reglas del producto, y el
repositorio guarda un documento en MongoDB. La API devuelve JSON con el producto
creado y React actualiza la lista. Al abrir o actualizar el catÃ¡logo, un GET consulta
la colecciÃ³n y muestra los productos guardados.

## Para explicar presencialmente

- **Â¿DÃ³nde se guarda?** En la colecciÃ³n `productos` de MongoDB; ya no depende de un arreglo del proceso.
- **Â¿QuÃ© cambiÃ³?** El repositorio y la conexiÃ³n; las rutas, las validaciones y los componentes mantienen su funciÃ³n.
- **Â¿Por quÃ© MongoDB?** Es NoSQL y representa cada producto como un documento con nombre, precio y categorÃ­a.
- **Â¿QuÃ© es `_id`?** El identificador del documento. Usamos UUID como texto y la API lo presenta como `id`.
- **Â¿QuÃ© hace seed?** Carga ejemplos con `upsert` y `$setOnInsert`; no duplica ni sobrescribe los existentes.
- **Â¿Se pierden al reiniciar?** No: MongoDB los conserva en disco, salvo que se borren los datos de la base.
- **Â¿Es escalable?** La separaciÃ³n facilita ampliarlo; para catÃ¡logos grandes habrÃ­a que aÃ±adir paginaciÃ³n e Ã­ndices segÃºn las consultas.

