// server.js
require("dotenv").config({ path: "backend/.env" });
const express = require("express");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
const port = process.env.SERVER_PORT || 3000;

// --- CONFIGURACIÓN DE SEQUELIZE ---
// Configuro mi conexión a la base de datos PostgreSQL usando Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl:
        process.env.DB_SSL === "true"
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  }
);

// --- PROBAR CONEXIÓN ---
// Verifico que la conexión a la base de datos sea exitosa
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Conectado correctamente a PostgreSQL (Sequelize)");
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error.message);
  }
}
testConnection();
module.exports = {sequelize, testConnection};

// --- DEFINIR MODELO (ejemplo: tareas) ---
// Defino el modelo 'Tarea' para la tabla 'tareas'
const Tarea = sequelize.define(
  "Tarea",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    texto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    completada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "tareas",
    timestamps: false,
  }
);

// --- SINCRONIZAR ---
// Si lo necesito, puedo descomentar esta línea para que Sequelize cree o altere la tabla
// sequelize.sync({ alter: true });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- BASE API ---
const API_BASE = "/api/tareas";

// OBTENER TODAS LAS TAREAS
// Manejo la ruta GET para obtener todas mis tareas
app.get(API_BASE, async (req, res) => {
  try {
    const tareas = await Tarea.findAll();
    res.json(tareas);
  } catch (err) {
    console.error("Error al obtener tareas:", err.message);
    res.status(500).json({ error: "Error al obtener tareas" });
  }
});

// CREAR NUEVA TAREA
// Manejo la ruta POST para crear una nueva tarea
app.post(API_BASE, async (req, res) => {
  const { texto } = req.body;
  if (!texto || typeof texto !== "string" || texto.trim().length === 0) {
    return res
      .status(400)
      .json({ error: 'El campo "texto" es obligatorio y debe ser válido.' });
  }

  try {
    const nueva = await Tarea.create({ texto: texto.trim() });
    res.status(201).json(nueva);
  } catch (err) {
    console.error("Error al añadir tarea:", err.message);
    res.status(500).json({ error: "Error al añadir tarea" });
  }
});

// ELIMINAR TAREA
// Manejo la ruta DELETE para eliminar una tarea por ID
app.delete(`${API_BASE}/:id`, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID no válido." });

  try {
    const eliminada = await Tarea.destroy({ where: { id } });
    if (!eliminada)
      return res.status(404).json({ error: "Tarea no encontrada." });
    res.status(204).send();
  } catch (err) {
    console.error("Error al eliminar tarea:", err.message);
    res.status(500).json({ error: "Error al eliminar tarea" });
  }
});

// ACTUALIZAR ESTADO DE TAREA
// Manejo la ruta PUT para actualizar el estado 'completada' de una tarea por ID
app.put(`${API_BASE}/:id`, async (req, res) => {
  const id = parseInt(req.params.id);
  const { completada } = req.body;

  if (isNaN(id)) return res.status(400).json({ error: "ID no válido." });
  if (typeof completada !== "boolean")
    return res.status(400).json({ error: '"completada" debe ser booleano.' });

  try {
    const [filas, [actualizada]] = await Tarea.update(
      { completada },
      { where: { id }, returning: true }
    );

    if (filas === 0)
      return res.status(404).json({ error: "Tarea no encontrada." });
    res.json(actualizada);
  } catch (err) {
    console.error("Error al actualizar tarea:", err.message);
    res.status(500).json({ error: "Error al actualizar tarea" });
  }
});

// --- INICIAR SERVIDOR ---
// Arranco mi servidor en el puerto configurado
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
  console.log(`API disponible en ${API_BASE}`);
});
