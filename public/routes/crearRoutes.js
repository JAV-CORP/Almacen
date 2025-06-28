// public/routes/crearRoutes.js
const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para obtener los grupos
router.get('/obtener-grupos', async (req, res) => {
    try {
        const result = await mssql.query('SELECT * FROM Grupos'); // Reemplaza con tu consulta para obtener los grupos
        res.json({ grupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener los grupos:', error);
        res.status(500).send('Error al obtener los grupos');
    }
});

// Ruta para crear un grupo
router.post('/crear-grupo', async (req, res) => {
    const { nombreGrupo } = req.body;
    try {
        const result = await mssql.query(`
            INSERT INTO Grupos (Nombre) VALUES ('${nombreGrupo}')
        `);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al crear el grupo:', error);
        res.status(500).json({ success: false, message: 'Error al crear el grupo' });
    }
});

// Ruta para crear un subgrupo
router.post('/crear-subgrupo', async (req, res) => {
    const { grupoSeleccionado, nombreSubGrupo } = req.body;
    try {
        // Buscar el GrupoID basado en el nombre del grupo
        const grupoSeleccionadoResult = await mssql.query(`
            SELECT GrupoID FROM Grupos WHERE Nombre = '${grupoSeleccionado}'
        `);

        // Verificar si el grupo existe
        if (grupoSeleccionadoResult.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'El grupo especificado no existe.' });
        }

        // Obtener el GrupoID
        const grupoID = grupoSeleccionadoResult.recordset[0].GrupoID;

        // Verificar si el subgrupo ya existe y, si no, insertarlo
        const nombreSubGrupoResult = await mssql.query(`
            IF NOT EXISTS (
                SELECT 1 FROM SubGrupos WHERE Nombre = '${nombreSubGrupo}' AND GrupoID = ${grupoID}
            )
                INSERT INTO SubGrupos (Nombre, GrupoID) VALUES ('${nombreSubGrupo}', ${grupoID})
        `);

        // Verificar si se realizó la inserción
        if (nombreSubGrupoResult.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Subgrupo creado con éxito.' });
        } else {
            res.json({ success: false, message: 'El subgrupo ya existe.' });
        }
    } catch (error) {
        console.error('Error al crear subgrupo:', error);
        res.status(500).json({ success: false, message: 'Error al crear subgrupo.' });
    }
});

// Ruta para obtener los subgrupos de un grupo
router.get('/obtener-subgrupos/:grupoID', async (req, res) => {
    const grupoSeleccionado = req.params.grupoID; // Ahora recibimos el GrupoID directamente
    console.log('Grupo seleccionado:', grupoSeleccionado);

    try {
        // Buscar el GrupoID basado en el ID recibido
        const grupoResult = await mssql.query`
            SELECT GrupoID FROM Grupos WHERE GrupoID = ${grupoSeleccionado}
        `;

        if (grupoResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'El grupo especificado no existe.' });
        }

        // Obtener los subgrupos asociados al GrupoID
        const subgruposResult = await mssql.query`
            SELECT SubgrupoID, Nombre FROM SubGrupos WHERE GrupoID = ${grupoSeleccionado}
        `;

        res.json({ subgrupos: subgruposResult.recordset });
    } catch (error) {
        console.error('Error al obtener subgrupos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener subgrupos.' });
    }
});

// Ruta para crear un producto
router.post('/crear-producto', async (req, res) => {
    console.log('Body recibido:', req.body);

    const { grupo, subgrupo, nombre, unidad, valor, codBarra } = req.body;

    // Verificar que los datos son correctos
    console.log('grupo:aaaa', grupo);
    console.log('subgrupo:', subgrupo);
    console.log('nombre:', nombre);
    console.log('unidad:', unidad);
    console.log('valor:', valor);
    console.log('codBarra:', codBarra);

    try {
        // Validación de entrada
        const grupoID = parseInt(grupo);
        const subgrupoID = parseInt(subgrupo);
        const valorNumerico = parseFloat(valor);
        const codiBarra = codBarra;

        if (!grupoID || !subgrupoID || !nombre || !unidad || isNaN(valorNumerico) || valorNumerico <= 0 || !codBarra) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos. Asegúrate de completar todos los campos correctamente.',
            });
        }

        // Verificar existencia del grupo
        const grupoResult = await mssql.query(`
            SELECT GrupoID FROM Grupos WHERE GrupoID = ${grupoID}
        `);
        if (grupoResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'El grupo especificado no existe.' });
        }

        // Verificar existencia del subgrupo
        const subgrupoResult = await mssql.query(`
            SELECT SubgrupoID FROM Subgrupos WHERE SubgrupoID = ${subgrupoID} AND GrupoID = ${grupoID}
        `);
        if (subgrupoResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'El subgrupo especificado no existe o no pertenece al grupo.' });
        }

        // Insertar el nuevo producto
        const query = `
            INSERT INTO Productos (Nombre, GrupoID, SubgrupoID, UnidadMedida, ValorUnidad, CodBarra)
            VALUES (@nombre, @grupoID, @subgrupoID, @unidad, @valor, @codBarra)
        `;

        const pool = await mssql.connect();
        await pool.request()
            .input('nombre', mssql.VarChar(100), nombre)
            .input('grupoID', mssql.Int, grupoID)
            .input('subgrupoID', mssql.Int, subgrupoID)
            .input('unidad', mssql.VarChar(50), unidad)
            .input('valor', mssql.Decimal(10, 2), valorNumerico)
            .input('codBarra', mssql.VarChar(50), codiBarra)
            .query(query);

        res.status(201).json({ success: true, message: 'Producto creado con éxito.' });
    } catch (err) {
        console.error('Error al crear producto:', err);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

module.exports = router;
