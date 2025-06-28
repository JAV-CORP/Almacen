const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para obtener los datos de la última venta, boleta y detalles
router.get('/api/getLastSaleAndBoleta', async (req, res) => {
    try {
        // Obtener el último registro de la tabla Venta
        const ventaResult = await mssql.query('SELECT TOP 1 * FROM Venta ORDER BY VentaID DESC');
        const venta = ventaResult.recordset[0];

        // Obtener el último registro de la tabla Boleta
        const boletaResult = await mssql.query('SELECT TOP 1 * FROM Boleta ORDER BY BoletaID DESC');
        const boleta = boletaResult.recordset[0];

        // Verificar si hay una venta antes de proceder con la consulta de detalles
        if (!venta) {
            return res.status(404).json({ success: false, message: 'No se encontró una venta registrada.' });
        }

        // Obtener los detalles de la venta, buscando los nombres de los productos
        const detallesResult = await mssql.query(`
            SELECT vd.Cantidad, vd.Total, p.Nombre AS Productos
            FROM VentaDetalle vd
            INNER JOIN Productos p ON vd.ProductoID = p.ProductoID
            WHERE vd.VentaID = ${venta.VentaID}
        `);
        const detalles = detallesResult.recordset;

        // Devolver los datos obtenidos
        res.json({
            venta: {
                fecha: venta.Fecha,
                ventaID: venta.VentaID,
                total: venta.TotalVenta // Corregido para asegurarse de tomar el total correcto
            },
            boleta: {
                nombreNegocio: boleta?.NombreNegocio || '',
                rut: boleta?.RUT || '',
                direccion: boleta?.Direccion || '',
                telefono: boleta?.Telefono || '',
                correo: boleta?.Correo || '',
                imagenRuta: boleta?.ImagenRuta || '', // Usar la ruta de la imagen guardada en la base de datos
                mensaje: boleta?.Mensaje || ''
            },
            detalles: detalles
        });
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).json({ success: false, message: 'Error al obtener los datos' });
    }
});

module.exports = router;
