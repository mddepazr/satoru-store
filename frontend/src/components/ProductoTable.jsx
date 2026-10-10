const moneda = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  minimumFractionDigits: 2,
});

export default function ProductoTable({ productos }) {
  if (!productos.length) {
    return <p className="empty-state">Todavía no hay productos en el catálogo.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <caption className="sr-only">Productos de Satoru Store</caption>
        <thead>
          <tr>
            <th scope="col">Producto</th>
            <th scope="col">Categoría</th>
            <th scope="col" className="price-cell">Precio</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td className="product-name">{producto.nombre}</td>
              <td>{producto.categoria}</td>
              <td className="price-cell">{moneda.format(producto.precio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}