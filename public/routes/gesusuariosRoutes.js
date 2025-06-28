const express = require('express');
const bcrypt = require('bcrypt');
const mssql = require('mssql');
const router = express.Router();


router.post('/crearUsuario', async (req, res) => {
    const { nombre, contraseña, rol } = req.body;

    try {
        // Encriptar la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Consulta SQL con parámetros para evitar inyección SQL
        const query = `
            INSERT INTO Usuarios (Nombre, Contraseña, Rol, Estado, IntentosFallidos)
            VALUES (@nombre, @contraseña, @rol, 'activo', 0)
        `;

        // Ejecutar la consulta con parámetros
        const pool = await mssql.connect();
        await pool.request()
            .input('nombre', mssql.VarChar, nombre)
            .input('contraseña', mssql.VarChar, hashedPassword)
            .input('rol', mssql.VarChar, rol)
            .query(query);

        res.json({ mensaje: 'Usuario creado exitosamente' });

    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ mensaje: 'Error al crear el usuario' });
    }
});

// Ruta para modificar un usuario
router.post('/modificarUsuario', async (req, res) => {
    const { nombre, nuevaContraseña, nuevoRol } = req.body;

    try {
        let query = `UPDATE Usuarios SET Rol = '${nuevoRol}'`;
        
        if (nuevaContraseña) {
            const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
            query += `, Contraseña = '${hashedPassword}'`;
        }

        query += ` WHERE Nombre = '${nombre}'`;

        await mssql.query(query);

        res.json({ mensaje: 'Usuario modificado exitosamente' });
    } catch (error) {
        console.error('Error al modificar el usuario:', error);
        res.status(500).json({ mensaje: 'Error al modificar el usuario' });
    }
});

// Ruta para desbloquear un usuario
router.post('/desbloquearUsuario', async (req, res) => {
    const { nombre } = req.body;

    try {
        // Restablecer el estado a 'activo' y los intentos fallidos a 0
        await mssql.query(`
            UPDATE Usuarios
            SET Estado = 'activo', IntentosFallidos = 0
            WHERE Nombre = '${nombre}' AND Estado = 'bloqueado'
        `);

        res.json({ mensaje: 'Usuario desbloqueado exitosamente y los intentos fallidos han sido restablecidos.' });
    } catch (error) {
        console.error('Error al desbloquear el usuario:', error);
        res.status(500).json({ mensaje: 'Error al desbloquear el usuario' });
    }
});

// Ruta para buscar usuarios que coincidan con el texto
router.get('/buscarUsuarios', async (req, res) => {
    const { query } = req.query;

    try {
        const result = await mssql.query(`
            SELECT Nombre
            FROM Usuarios
            WHERE Nombre LIKE '%${query}%' AND Estado != 'deshabilitado'
        `);

        res.json({ usuarios: result.recordset });
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({ mensaje: 'Error al buscar usuarios' });
    }
});


module.exports = router;
