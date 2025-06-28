const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para obtener los grupos
router.get('/obtener-grupos', async (req, res) => {
    try {
        const result = await mssql.query('SELECT * FROM Grupos');
        res.json({ grupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener los grupos:', error);
        res.status(500).send('Error al obtener los grupos');
    }
});

// Ruta para obtener los subgrupos por grupo
router.get('/obtener-subgrupos/:grupoId', async (req, res) => {
    const { grupoId } = req.params;
    try {
        const result = await mssql.query(`
            SELECT * FROM Subgrupos WHERE GrupoID = '${grupoId}'
        `);
        res.json({ subgrupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener los subgrupos:', error);
        res.status(500).send('Error al obtener los subgrupos');
    }
});

// Ruta para obtener los productos por subgrupo
router.get('/obtener-productos/:subgrupoId', async (req, res) => {
    const { subgrupoId } = req.params;
    try {
        const result = await mssql.query(`
            SELECT * FROM Productos WHERE SubgrupoID = '${subgrupoId}'
        `);
        res.json({ productos: result.recordset });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error al obtener los productos');
    }
});

// Ruta para modificar el nombre de un grupo
router.post('/modificar-grupo', async (req, res) => {
    console.log(req.body);

    const {grupoID, nuevoNombre } = req.body;

    if (!grupoID || !nuevoNombre) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos (grupoId o nuevoNombre).' });
    }

    try {
        const result = await mssql.query(`
            UPDATE Grupos 
            SET Nombre = '${nuevoNombre}' 
            WHERE GrupoID = ${grupoID}
        `);
         res.json({ success: true, message: 'Grupo modificado correctamente.' });
    } catch (error) {
        console.error('Error al modificar el grupo:', error);
        res.status(500).json({ success: false, message: 'Error al modificar el grupo' });
    }
});


// Modificar subgrupo
router.post('/modificar-subgrupo', async (req, res) => {
    const { subgrupoID, nuevoNombre } = req.body;

    if (!subgrupoID || !nuevoNombre) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos (subgrupoID o nuevoNombre).' });
    }

    try {
        await mssql.query(`
            UPDATE Subgrupos 
            SET Nombre = '${nuevoNombre}' 
            WHERE SubgrupoID = ${subgrupoID}
        `);
        res.json({ success: true, message: 'Subgrupo modificado correctamente.' });
    } catch (error) {
        console.error('Error al modificar el subgrupo:', error);
        res.status(500).json({ success: false, message: 'Error al modificar el subgrupo.' });
    }
});

// Modificar producto
router.post('/modificar-producto', async (req, res) => {
    const { productoID, nuevoNombre, nuevoValor } = req.body;

    // Verificar si se recibieron los datos requeridos
    if (!productoID || (!nuevoNombre && nuevoValor === undefined)) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos (productoID, nuevoNombre o nuevoValor).' });
    }

    try {
        // Crear la consulta SQL para actualizar el nombre y/o el valor
        let query = `UPDATE Productos SET `;
        
        // Si se proporciona un nuevo nombre
        if (nuevoNombre) {
            query += `Nombre = '${nuevoNombre}'`;
        }
        
        // Si se proporciona un nuevo valor
        if (nuevoValor !== undefined) {
            // Si ya se ha añadido un campo para nombre, añadir coma
            if (nuevoNombre) {
                query += `, `;
            }
            query += `ValorUnidad = ${nuevoValor}`;
        }

        query += ` WHERE ProductoID = ${productoID}`;

        // Ejecutar la consulta
        await mssql.query(query);

        // Responder con mensaje de éxito
        res.json({ success: true, message: 'Producto modificado correctamente.' });
    } catch (error) {
        console.error('Error al modificar el producto:', error);
        res.status(500).json({ success: false, message: 'Error al modificar el producto.' });
    }
});


// Reasignar producto
router.post('/reasignar-producto', async (req, res) => {
    const { productoID, nuevoGrupoID, nuevoSubgrupoID } = req.body;

    if (!productoID || !nuevoGrupoID || !nuevoSubgrupoID) {
        return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }

    try {
        await mssql.query(`
            UPDATE Productos 
            SET Grupo = ${nuevoGrupoID}, Subgrupo = ${nuevoSubgrupoID} 
            WHERE ProductoID = ${productoID}
        `);
        res.json({ success: true, message: 'Producto reasignado correctamente.' });
    } catch (error) {
        console.error('Error al reasignar el producto:', error);
        res.status(500).json({ success: false, message: 'Error al reasignar el producto.' });
    }
});

module.exports = router;
