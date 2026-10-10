export function crearProductosController(service) {
  return {
    async listar(req, res) {
      const productos = await service.listar();
      res.status(200).json({ datos: productos });
    },

    async crear(req, res) {
      const producto = await service.crear(req.body);

      res.status(201).json({
        mensaje: "Producto agregado correctamente.",
        datos: producto,
      });
    },
  };
}