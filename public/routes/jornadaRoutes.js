const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para verificar si hay una jornada activa
router.get('/verificar', async (req, res) => {
    try {
        const result = await mssql.query(`
            SELECT COUNT(*) AS count 
            FROM Jornada 
            WHERE Activa = 1
        `);

        const jornadaActiva = result.recordset[0].count > 0;
        res.json({ jornadaActiva });
    } catch (error) {
        console.error('Error al verificar la jornada activa:', error);
        res.status(500).json({ success: false, message: 'Error al verificar la jornada activa.' });
    }
});

// Ruta para iniciar una nueva jornada
router.post('/iniciar', async (req, res) => {
    const { montoCaja } = req.body;

    if (montoCaja === undefined || isNaN(montoCaja) || parseFloat(montoCaja) < 0) {
        return res.status(400).json({ success: false, message: 'Monto de caja chica inválido.' });
    }

    try {
        // Verificar si hay una jornada activa
        const checkActive = await mssql.query(`
            SELECT COUNT(*) AS count 
            FROM Jornada 
            WHERE Activa = 1
        `);

        if (checkActive.recordset[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Ya existe una jornada activa.' });
        }

        // Crear una nueva jornada
        await mssql.query(`
            INSERT INTO Jornada (CajaChicaInicial, FechaInicio, Activa)
            VALUES (${montoCaja}, GETDATE(), 1)
        `);

        res.json({ success: true });
    } catch (error) {
        console.error('Error al iniciar la jornada:', error);
        res.status(500).json({ success: false, message: 'Error al iniciar la jornada.' });
    }
});

module.exports = router;
