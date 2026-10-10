import { MongoClient } from "mongodb";

// Una conexión compartida administra su propio grupo de conexiones a MongoDB.
export async function conectarBaseDeDatos({
  uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
  nombre = process.env.MONGODB_DB ?? "satoru_store",
} = {}) {
  const cliente = new MongoClient(uri, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    timeoutMS: 5000,
  });

  try {
    await cliente.connect();
    const db = cliente.db(nombre);
    // Comprueba la conexión antes de iniciar la API o cargar ejemplos.
    await db.command({ ping: 1 });
    return { cliente, db };
  } catch (error) {
    await cliente.close();
    throw error;
  }
}
