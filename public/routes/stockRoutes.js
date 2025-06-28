const express = require('express');
const router = express.Router();
const mssql = require('mssql');

// Obtener grupos
router.get('/obtener-grupos', async (req, res) => {
    try {
        const pool = await mssql.connect();
        const result = await pool.request().query('SELECT GrupoID, Nombre FROM Grupos');
        res.json({ grupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        res.status(500).json({ message: 'Error al obtener grupos' });
    }
});

// Obtener subgrupos por grupo
router.get('/obtener-subgrupos/:grupoID', async (req, res) => {
    const { grupoID } = req.params;
    try {
        const pool = await mssql.connect();
        const result = await pool.request()
            .input('grupoID', mssql.Int, grupoID)
            .query('SELECT SubgrupoID, Nombre FROM Subgrupos WHERE GrupoID = @grupoID');
        
        res.json({ subgrupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener subgrupos:', error);
        res.status(500).json({ message: 'Error al obtener subgrupos' });
    }
});

// Obtener productos por subgrupo
router.get('/obtener-productos', async (req, res) => {
    const { subgrupoID } = req.query;
    try {
        const pool = await mssql.connect();
        const result = await pool.request()
            .input('subgrupoID', mssql.Int, subgrupoID)
            .query('SELECT ProductoID, Nombre, UnidadMedida, ValorUnidad FROM Productos WHERE SubgrupoID = @subgrupoID');

        res.json({ productos: result.recordset });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
});

// Obtener GrupoID por nombre
router.get('/obtener-grupo-id/:grupoNombre', async (req, res) => {
    const { grupoNombre } = req.params;
    try {
        const pool = await mssql.connect();
        const result = await pool.request()
            .input('grupoNombre', mssql.NVarChar, grupoNombre)
            .query('SELECT GrupoID FROM Grupos WHERE Nombre = @grupoNombre');

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'El grupo especificado no existe.' });
        }

        res.json({ success: true, grupoID: result.recordset[0].GrupoID });
    } catch (error) {
        console.error('Error al obtener el GrupoID:', error);
        res.status(500).json({ success: false, message: 'Error al obtener el GrupoID.' });
    }
});

// Registrar o actualizar stock
router.post('/registrar-stock', async (req, res) => {
    const { productoSeleccionado, cantidadStock } = req.body;

    if (!productoSeleccionado || !cantidadStock) {
        return res.status(400).json({ message: 'Faltan datos requeridos.' });
    }

    try {
        const pool = await mssql.connect();
        
        // Buscar el ProductoID por nombre
        const productoResult = await pool.request()
            .input('productoSeleccionado', mssql.NVarChar, productoSeleccionado)
            .query('SELECT ProductoID FROM Productos WHERE Nombre = @productoSeleccionado');

        if (productoResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        const productoID = productoResult.recordset[0].ProductoID;

        // Verificar si ya existe stock del producto
        const stockResult = await pool.request()
            .input('productoID', mssql.Int, productoID)
            .query('SELECT CantidadDisponible FROM Stock WHERE ProductoID = @productoID');

        if (stockResult.recordset.length > 0) {
            // Si ya existe, actualizar la cantidad
            await pool.request()
                .input('productoID', mssql.Int, productoID)
                .input('cantidadStock', mssql.Int, cantidadStock)
                .query('UPDATE Stock SET CantidadDisponible = CantidadDisponible + @cantidadStock WHERE ProductoID = @productoID');
            
            res.json({ message: 'Stock actualizado correctamente.' });
        } else {
            // Si no existe, insertar el nuevo stock
            await pool.request()
                .input('productoID', mssql.Int, productoID)
                .input('cantidadStock', mssql.Int, cantidadStock)
                .query('INSERT INTO Stock (ProductoID, CantidadDisponible) VALUES (@productoID, @cantidadStock)');
            
            res.json({ message: 'Stock registrado exitosamente.' });
        }
    } catch (error) {
        console.error('Error al registrar el stock:', error);
        res.status(500).json({ message: 'Error al registrar el stock.' });
    }
});

// Obtener stock disponible de un producto
router.get('/obtener-stock/:productoID', async (req, res) => {
  const { productoID } = req.params;

  try {
      const pool = await mssql.connect();
      const result = await pool.request()
          .input('productoID', mssql.Int, productoID)
          .query('SELECT CantidadDisponible FROM Stock WHERE ProductoID = @productoID');

      const cantidadDisponible = result.recordset.length > 0 ? result.recordset[0].CantidadDisponible : 0;

      res.json({ cantidadDisponible });
  } catch (error) {
      console.error('Error al obtener stock:', error);
      res.status(500).json({ message: 'Error al obtener el stock.' });
  }
});

module.exports = router;
