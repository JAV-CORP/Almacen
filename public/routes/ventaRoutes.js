const express = require('express');
const mssql = require('mssql');
const router = express.Router();

// Ruta para obtener los grupos
router.get('/grupos', async (req, res) => {
    try {
        const result = await mssql.query('SELECT * FROM Grupos');
        res.json({ grupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        res.status(500).json({ message: 'Error al obtener grupos' });
    }
});

// Ruta para obtener los subgrupos según el grupo
router.get('/subgrupos/:grupoId', async (req, res) => {
    const { grupoId } = req.params;
    try {
        const result = await mssql.query(`SELECT * FROM Subgrupos WHERE GrupoID = ${grupoId}`);
        res.json({ subgrupos: result.recordset });
    } catch (error) {
        console.error('Error al obtener subgrupos:', error);
        res.status(500).json({ message: 'Error al obtener subgrupos' });
    }
});

// Ruta para obtener los productos según el subgrupo
router.get('/productos/:subgrupoId', async (req, res) => {
    const { subgrupoId } = req.params;
    try {
        const result = await mssql.query(`SELECT ProductoID, Nombre FROM Productos WHERE SubgrupoID = ${subgrupoId}`);
        res.json({ productos: result.recordset });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
});

// Ruta para obtener el detalle del producto (nombre, unidad de medida, valor y stock)
router.get('/producto-detalle/:productoId', async (req, res) => {
    const { productoId } = req.params;
    try {
        const result = await mssql.query(`
            SELECT 
                p.Nombre, 
                p.UnidadMedida, 
                p.ValorUnidad, 
                s.CantidadDisponible AS Stock
            FROM Productos p
            LEFT JOIN Stock s ON p.ProductoID = s.ProductoID
            WHERE p.ProductoID = ${productoId}
        `);
        if (result.recordset.length > 0) {
            res.json({ producto: result.recordset[0] });
        } else {
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el detalle del producto:', error);
        res.status(500).json({ message: 'Error al obtener el detalle del producto' });
    }
});

// Ruta para registrar un pedido
router.post('/registrar-pedido', async (req, res) => {
    const { productos, total, tipoPago } = req.body; // Eliminé jornadaId ya que lo obtenemos del servidor
    const transaction = new mssql.Transaction();

    try {
        await transaction.begin();

        // Obtener el ID de la jornada activa
        const jornadaResult = await transaction.request().query(`
            SELECT TOP 1 JornadaID 
            FROM Jornada 
            WHERE Activa = 1
        `);

        if (jornadaResult.recordset.length === 0) {
            throw new Error("No hay una jornada activa.");
        }

        const jornadaId = jornadaResult.recordset[0].JornadaID;

        // Insertar encabezado en la tabla Venta
        const ventaResult = await transaction.request()
            .input('jornadaId', mssql.Int, jornadaId)
            .input('tipoPago', mssql.VarChar(50), tipoPago)
            .input('total', mssql.Decimal(10, 2), total)
            .query(`
                INSERT INTO Venta (JornadaID, FechaVenta, TipoPago, TotalVenta)
                OUTPUT INSERTED.VentaID
                VALUES (@jornadaId, GETDATE(), @tipoPago, @total)
            `);

        const ventaId = ventaResult.recordset[0].VentaID;

        // Insertar los detalles y actualizar el stock
        for (const producto of productos) {
            await transaction.request()
                .input('ventaId', mssql.Int, ventaId)
                .input('productoId', mssql.Int, producto.productoId)
                .input('cantidad', mssql.Decimal(10, 2), producto.cantidad)
                .input('total', mssql.Decimal(10, 2), producto.total)
                .query(`
                    INSERT INTO VentaDetalle (VentaID, ProductoID, Cantidad, Total)
                    VALUES (@ventaId, @productoId, @cantidad, @total)
                `);

            await transaction.request()
                .input('productoId', mssql.Int, producto.productoId)
                .input('cantidad', mssql.Decimal(10, 2), producto.cantidad)
                .query(`
                    UPDATE Stock
                    SET CantidadDisponible = CantidadDisponible - @cantidad
                    WHERE ProductoID = @productoId
                `);
        }

        await transaction.commit();
        res.status(201).json({ message: 'Pedido registrado correctamente', ventaId });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al registrar el pedido:', error);
        res.status(500).json({ message: 'Error al registrar el pedido' });
    }
});


// Endpoint para obtener el saldo de caja chica
router.get('/saldo-caja-chica', async (req, res) => {
    try {
        // Obtener la jornada activa (con Activa = 1 y sin FechaCierre)
        const jornadaResult = await mssql.query(`
            SELECT CajaChicaInicial, JornadaID 
            FROM Jornada
            WHERE Activa = 1 AND FechaCierre IS NULL
        `);

        // Si no se encuentra una jornada activa, retornar un error
        if (jornadaResult.recordset.length === 0) {
            return res.status(400).send('No hay una jornada activa abierta.');
        }

        const jornada = jornadaResult.recordset[0];
        const cajaChicaInicial = jornada.CajaChicaInicial; // Monto inicial de la caja chica

        // Obtener los movimientos de caja (entradas y salidas) para la jornada activa
        const movimientosResult = await mssql.query(`
            SELECT SUM(CASE WHEN TipoMovimiento = 'Entrada' THEN Monto ELSE -Monto END) AS TotalMovimientos
            FROM MovimientosCaja
            WHERE JornadaID = ${jornada.JornadaID}
        `);

        // Obtener el total de los movimientos (entradas - salidas)
        const totalMovimientos = movimientosResult.recordset[0].TotalMovimientos || 0; // Si no hay movimientos, es 0

        // Calcular el saldo actual de la caja chica
        const saldoActual = cajaChicaInicial + totalMovimientos;

        // Enviar el saldo actual como respuesta en formato JSON
        res.json({ montoCaja: saldoActual });
    } catch (error) {
        console.error('Error al obtener el saldo de caja chica:', error);
        res.status(500).send('Error al obtener el saldo de caja chica');
    }
});



// Ruta para registrar transacciones de caja chica
router.post('/registrar-caja-chica', async (req, res) => {
    const { tipoCaja, montoCaja, motivoCaja } = req.body;

    // Validación de los datos recibidos
    if (isNaN(montoCaja) || montoCaja <= 0 || !motivoCaja || motivoCaja.trim() === '') {
        return res.status(400).send('Por favor ingresa un monto y un motivo válidos.');
    }

    try {
        // Obtener la jornada activa (con Activa = 1 y sin FechaCierre)
        const jornadaResult = await mssql.query(`
            SELECT JornadaID FROM Jornada
            WHERE Activa = 1 AND FechaCierre IS NULL
        `);

        if (jornadaResult.recordset.length === 0) {
            return res.status(400).send('No hay una jornada activa abierta.');
        }

        const jornadaID = jornadaResult.recordset[0].JornadaID;

        // Insertar el movimiento en la tabla MovimientosCaja con el JornadaID
        const request = new mssql.Request();
        await request
            .input('JornadaID', mssql.Int, jornadaID)
            .input('Fecha', mssql.DateTime, new Date())
            .input('Tipo', mssql.NVarChar, tipoCaja)
            .input('Monto', mssql.Decimal, montoCaja)
            .input('Motivo', mssql.NVarChar, motivoCaja)
            .query(`
                INSERT INTO MovimientosCaja (JornadaID, FechaMovimiento, TipoMovimiento, Monto, Motivo)
                VALUES (@JornadaID, @Fecha, @Tipo, @Monto, @Motivo)
            `);

        res.json({ message: 'Transacción registrada correctamente en caja chica.' });
    } catch (error) {
        console.error('Error al registrar la transacción de caja chica:', error);
        res.status(500).send('Error al registrar la transacción de caja chica');
    }
});

router.post('/terminar-jornada', async (req, res) => {
    try {
        // Actualizar la jornada activa, cambiar su estado y agregar la FechaCierre
        const result = await mssql.query(`
            UPDATE Jornada
            SET Activa = 0, FechaCierre = GETDATE()
            WHERE Activa = 1 AND FechaCierre IS NULL
        `);

        // Verificar si la jornada fue efectivamente terminada
        if (result.rowsAffected[0] > 0) {
            res.json({ message: "Jornada terminada correctamente" });
        } else {
            res.status(400).json({ message: "No hay una jornada activa para terminar" });
        }
    } catch (error) {
        console.error('Error al terminar la jornada:', error);
        res.status(500).send('Error al terminar la jornada');
    }
});

// Ruta para obtener los detalles de una venta específica
router.get('/ultima-venta', async (req, res) => {
    try {
        const result = await mssql.query(`
            SELECT TOP 1 VentaID FROM Venta ORDER BY VentaID DESC
        `);

        if (result.recordset.length > 0) {
            res.json({ ventaId: result.recordset[0].VentaID });
        } else {
            res.status(404).json({ message: "No hay ventas registradas." });
        }
    } catch (error) {
        console.error("Error al obtener la última venta:", error);
        res.status(500).json({ message: "Error al obtener la última venta." });
    }
});

// Ruta para obtener los detalles de una venta específica
router.get('/venta/:ventaId', async (req, res) => {
    const { ventaId } = req.params;
    
    try {
        // Obtener la información principal de la venta
        const ventaResult = await mssql.query(`
            SELECT v.VentaID, v.FechaVenta, v.TotalVenta
            FROM Venta v
            WHERE v.VentaID = ${ventaId}
        `);

        if (ventaResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Venta no encontrada' });
        }

        const venta = ventaResult.recordset[0];

        // Obtener los productos de la venta
        const productosResult = await mssql.query(`
            SELECT p.Nombre, vd.Cantidad, vd.Total
            FROM VentaDetalle vd
            JOIN Productos p ON vd.ProductoID = p.ProductoID
            WHERE vd.VentaID = ${ventaId}
        `);

        res.json({
            ventaId: venta.VentaID,
            fecha: venta.FechaVenta,
            total: venta.TotalVenta,
            productos: productosResult.recordset
        });
    } catch (error) {
        console.error('Error al obtener detalles de la venta:', error);
        res.status(500).json({ message: 'Error al obtener detalles de la venta' });
    }
});

router.get('/jornada-activa', async (req, res) => {
    try {
        const result = await mssql.query(`
            SELECT TOP 1 JornadaID 
            FROM Jornada 
            WHERE Activa = 1
        `);

        if (result.recordset.length === 0) {
            return res.json({ jornadaId: null });
        }

        res.json({ jornadaId: result.recordset[0].JornadaID });
    } catch (error) {
        console.error('Error al obtener la jornada activa:', error);
        res.status(500).json({ jornadaId: null });
    }
});


module.exports = router;
