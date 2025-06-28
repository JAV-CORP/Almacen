const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para guardar el formato de la boleta
router.post('/guardar-formato', async (req, res) => {
    const { nombreNegocio, rut, direccion, telefono, correo, imagenRuta, mensaje } = req.body;

    try {
        // Insertar los datos de la boleta en la tabla Boleta
        await mssql.query(`
            INSERT INTO Boleta (NombreNegocio, RUT, Direccion, Telefono, Correo, ImagenRuta, Mensaje)
            VALUES ('${nombreNegocio}', '${rut}', '${direccion}', '${telefono}', '${correo}', '${imagenRuta || ''}', '${mensaje}')
        `);

        res.json({ success: true, message: 'Formato de boleta guardado correctamente.' });
    } catch (error) {
        console.error('Error al guardar el formato de la boleta:', error);
        res.status(500).json({ success: false, message: 'Error al guardar el formato de la boleta' });
    }
});

// Ruta para obtener los formatos de boleta guardados
router.get('/formatos', async (req, res) => {
    try {
        const result = await mssql.query('SELECT * FROM Boleta');
        res.json({ formatos: result.recordset });
    } catch (error) {
        console.error('Error al obtener los formatos de boleta:', error);
        res.status(500).json({ message: 'Error al obtener los formatos de boleta' });
    }
});

module.exports = router;
