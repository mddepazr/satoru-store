// Traduce las solicitudes HTTP a llamadas del servicio y responde JSON.
// Express 5 envía los errores de estas funciones async al middleware de errores.
export function crearProductosController(service) {
  return {
    async listar(req, res) {
      const productos = await service.listar();
      // 200 indica una consulta exitosa; el cuerpo es directamente la lista.
      res.status(200).json(productos);
    },

    async crear(req, res) {
      // req.body contiene los campos que Express leyó del JSON enviado.
      const producto = await service.crear(req.body);

      // 201 indica que se creó un recurso; devuelve también el producto con su id.
      res.status(201).json({
        mensaje: "Producto agregado correctamente.",
        datos: producto,
      });
    },
  };
}