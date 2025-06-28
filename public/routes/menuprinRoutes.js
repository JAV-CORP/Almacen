const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para verificar si hay una jornada activa y cerrarla si es necesario
router.get('/verificarJornada', async (req, res) => {
    try {
        // Verificar si hay una jornada activa
        const result = await mssql.query(`
            SELECT TOP 1 JornadaID, FechaInicio 
            FROM Jornada 
            WHERE Activa = 1
            ORDER BY FechaInicio DESC
        `);

        if (result.recordset.length < 0) {
            const jornada = result.recordset[0];
            const fechaInicio = new Date(jornada.FechaInicio);
            console.log(fechaInicio);
            const fechaActual = new Date();

            // Si la jornada es de un día anterior, cerrarla automáticamente
            if (fechaInicio.toDateString() == fechaActual.toDateString()) {
                await mssql.query(`
                    UPDATE Jornada 
                    SET Activa = 0, FechaCierre = GETDATE()
                    WHERE JornadaID = ${jornada.JornadaID}
                `);
                return res.json({ mensaje: 'Jornada anterior cerrada automáticamente.' });
            }
            return res.json({ mensaje: 'Jornada activa en curso.' });
        }
        
        res.json({ mensaje: 'No hay jornada activa.' });
    } catch (error) {
        console.error('Error al verificar la jornada:', error);
        res.status(500).json({ success: false, message: 'Error al verificar la jornada.' });
    }
});

// Ruta para obtener el rol del usuario con sesión activa
router.get("/obtenerRolUsuario", async (req, res) => {
    try {
        // Consultar el usuario con sesión activa
        const result = await mssql.query(`
            SELECT TOP 1 Rol 
            FROM Usuarios 
            WHERE SesionActiva = 1
        `);

        if (result.recordset.length > 0) {
            return res.json({ rol: result.recordset[0].Rol });
        } else {
            return res.status(404).json({ error: "No hay usuario con sesión activa" });
        }
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        return res.status(500).json({ error: "Error del servidor" });
    }
});

// Ruta para cerrar sesión
router.post("/cerrarSesion", async (req, res) => {
    try {
        // Buscar al usuario que tiene SesionActiva = 1
        const result = await mssql.query(`
            SELECT UsuarioID, Nombre FROM Usuarios 
            WHERE SesionActiva = 1
        `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: "No hay usuario activo." });
        }

        // Obtener el primer usuario activo (asumimos que solo hay un usuario activo a la vez)
        let user = result.recordset[0];

        // Actualizar el estado de la sesión a 0 (cerrar sesión)
        await mssql.query(`
            UPDATE Usuarios
            SET SesionActiva = 0
            WHERE UsuarioID = ${user.UsuarioID}
        `);

        // Limpiar la sesión del lado del servidor (opcional, dependiendo de cómo manejas la sesión en el cliente)
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: "Error al cerrar sesión" });
            }
            res.json({ mensaje: "Sesión cerrada con éxito" });
        });
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ error: "Error en el servidor" });
    }
});


module.exports = router;
