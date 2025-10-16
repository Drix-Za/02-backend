// server.js
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// 1. Cargo mis variables de entorno desde 'backend/.env'. Verifico la ruta.
require('dotenv').config({ path: 'backend/.env' }); 

const app = express();
// Uso SERVER_PORT o 3000 como puerto predeterminado.
const port = process.env.SERVER_PORT || 3000;

// Configuración de conexión a PostgreSQL.
// 2. Uso mis variables de entorno para las credenciales de la DB.
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432, // Convierto el puerto a entero.
});

// Middlewares
// Permito que el frontend (Vue) acceda al backend (CORS).
app.use(cors()); 
// Permito procesar los datos JSON entrantes.
app.use(express.json());

// Verifico la conexión a la base de datos al iniciar.
pool.connect((err, client, release) => {
    if (err) {
        // Muestro credenciales que intento usar (solo para debug).
        console.error('Variables de Entorno de DB:', {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });
        return console.error('Error al adquirir cliente de PostgreSQL', err.stack);
    }
    console.log('Conectado a PostgreSQL');
    release();
});

// --- RUTAS API ---
const API_BASE = '/api/tareas';

// 1. OBTENER TODAS LAS TAREAS (GET /api/tareas)
app.get(API_BASE, async (req, res) => {
    try {
        // Ahora uso la vista creada
        const result = await pool.query('SELECT * FROM vista_tareas');
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener tareas:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener tareas' });
    }
});

// 2. AÑADIR UNA NUEVA TAREA (POST /api/tareas)
app.post(API_BASE, async (req, res) => {
    const { texto } = req.body;
    if (!texto || typeof texto !== 'string' || texto.trim().length === 0) {
        return res.status(400).json({ error: 'El campo "texto" es obligatorio y debe ser válido.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tareas (texto) VALUES ($1) RETURNING *',
            [texto.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error al añadir tarea:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al añadir la tarea' });
    }
});

// 3. ELIMINAR UNA TAREA (DELETE /api/tareas/:id)
app.delete(`${API_BASE}/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID no válido.' });

    try {
        const result = await pool.query('DELETE FROM tareas WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada.' });
        res.status(204).send();
    } catch (err) {
        console.error('Error al eliminar tarea:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al eliminar la tarea' });
    }
});

// 4. ACTUALIZAR ESTADO DE TAREA (PUT /api/tareas/:id)
app.put(`${API_BASE}/:id`, async (req, res) => {
    const id = parseInt(req.params.id);
    const { completada } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: 'ID no válido.' });
    if (typeof completada !== 'boolean') return res.status(400).json({ error: '"completada" debe ser booleano.' });

    try {
        const result = await pool.query(
            'UPDATE tareas SET completada = $1 WHERE id = $2 RETURNING *',
            [completada, id]
        );

        if (result.rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada.' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al actualizar tarea:', err.message);
        res.status(500).json({ error: 'Error interno del servidor al actualizar tarea' });
    }
});

// --- INICIAR SERVIDOR ---
// Pongo el servidor a escuchar en el puerto.
app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
    console.log(`API disponible en ${API_BASE}`);
});