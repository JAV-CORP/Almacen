const express = require('express');
const mssql = require('mssql');
const fs = require('fs'); // Para escribir archivos
const { parse } = require('json2csv'); // Para generar el archivo CSV
const path = require('path');
const router = express.Router();

// Endpoint para obtener la información de la jornada (activa o inactiva)
router.get('/gestion-caja', async (req, res) => {
    try {
        // Obtener la jornada activa o inactiva más reciente
        const jornadaResult = await mssql.query(`
            SELECT TOP 1 JornadaID, CajaChicaInicial, FechaCierre
            FROM Jornada
            WHERE FechaCierre IS NULL OR Activa = 0
            ORDER BY FechaInicio DESC
        `);

        if (jornadaResult.recordset.length === 0) {
            return res.status(400).send('No hay jornadas registradas.');
        }

        const jornada = jornadaResult.recordset[0];
        const jornadaID = jornada.JornadaID;
        const cajaChicaInicial = jornada.CajaChicaInicial;

        // Obtener el total de ventas por jornada (sin importar el TipoPago)
        const ventasResult = await mssql.query(`
            SELECT SUM(TotalVenta) AS TotalVentas,
                   SUM(CASE WHEN TipoPago = 'Efectivo' THEN TotalVenta ELSE 0 END) AS TotalEfectivo,
                   SUM(CASE WHEN TipoPago = 'Tarjeta' THEN TotalVenta ELSE 0 END) AS TotalTarjeta,
                   SUM(CASE WHEN TipoPago = 'Transferencia' THEN TotalVenta ELSE 0 END) AS TotalTransferencia
            FROM Venta
            WHERE JornadaID = ${jornadaID}
        `);

        // Obtener los movimientos de caja para la jornada
        const movimientosResult = await mssql.query(`
            SELECT SUM(CASE WHEN TipoMovimiento = 'Entrada' THEN Monto ELSE 0 END) AS Entrada,
                   SUM(CASE WHEN TipoMovimiento = 'Salida' THEN Monto ELSE 0 END) AS Salida
            FROM MovimientosCaja
            WHERE JornadaID = ${jornadaID}
        `);

        const totalVentas = ventasResult.recordset[0];
        const movimientos = movimientosResult.recordset[0];

        // Calcular el monto de Caja Chica actual
        const montoCajaChica = cajaChicaInicial + movimientos.Entrada - movimientos.Salida + totalVentas.TotalEfectivo;

        // Enviar los datos al frontend
        res.json({
            jornadaActiva: jornada.FechaCierre === null,
            totalVentas: totalVentas,
            montoCajaChica: montoCajaChica
        });

    } catch (error) {
        console.error('Error al obtener los datos de gestión de caja:', error);
        res.status(500).send('Error al obtener los datos de gestión de caja');
    }
});

router.post('/cerrar-caja', async (req, res) => {
    const { efectivoEnCaja } = req.body; // Monto ingresado en el input de cierre de caja

    if (isNaN(efectivoEnCaja) || efectivoEnCaja < 0) {
        return res.status(400).send('Ingrese un monto válido.');
    }

    try {
        // Obtener la última jornada con Activa = 0 (cierre realizado)
        const jornadaResult = await mssql.query(`
            SELECT TOP 1 JornadaID, CajaChicaInicial
            FROM Jornada
            WHERE Activa = 0  
            AND FechaCierre IS NOT NULL 
            ORDER BY FechaCierre DESC 
        `);

        if (jornadaResult.recordset.length === 0) {
            return res.status(400).send('No hay jornada cerrada para procesar el cierre de caja.');
        }

        const jornadaID = jornadaResult.recordset[0].JornadaID;
        const cajaChicaInicial = jornadaResult.recordset[0].CajaChicaInicial;

        // Obtener los totales de ventas por tipo de pago (efectivo, tarjeta, transferencia)
        const ventasResult = await mssql.query(`
            SELECT 
                SUM(CASE WHEN TipoPago = 'Efectivo' THEN TotalVenta ELSE 0 END) AS TotalEfectivo,
                SUM(CASE WHEN TipoPago = 'Tarjeta' THEN TotalVenta ELSE 0 END) AS TotalTarjeta,
                SUM(CASE WHEN TipoPago = 'Transferencia' THEN TotalVenta ELSE 0 END) AS TotalTransferencia
            FROM Venta
            WHERE JornadaID = ${jornadaID}
        `);

        // Obtener los movimientos de caja para la jornada
        const movimientosResult = await mssql.query(`
            SELECT 
                SUM(CASE WHEN TipoMovimiento = 'Entrada' THEN Monto ELSE 0 END) AS Entrada,
                SUM(CASE WHEN TipoMovimiento = 'Salida' THEN Monto ELSE 0 END) AS Salida
            FROM MovimientosCaja
            WHERE JornadaID = ${jornadaID}
        `);

        // Calcular los valores obtenidos
        const totalVentasEfectivo = ventasResult.recordset[0].TotalEfectivo || 0;
        const totalVentasTarjeta = ventasResult.recordset[0].TotalTarjeta || 0;
        const totalVentasTransferencia = ventasResult.recordset[0].TotalTransferencia || 0;
        const totalEntrada = movimientosResult.recordset[0].Entrada || 0;
        const totalSalida = movimientosResult.recordset[0].Salida || 0;

        // Calcular el monto esperado en caja
        const montoEsperado = cajaChicaInicial + totalEntrada - totalSalida + totalVentasEfectivo;
        const diferencia = efectivoEnCaja - montoEsperado;

        // Insertar los datos en la tabla CierreCaja
        await mssql.query(`
            INSERT INTO CierreCaja (JornadaID, CajaChicaInicial, TotalVentasEfectivo, TotalVentasTarjeta, TotalVentasTransferencia, EfectivoEnCaja, Diferencia, FechaCierre)
            VALUES (${jornadaID}, ${cajaChicaInicial}, ${totalVentasEfectivo}, ${totalVentasTarjeta}, ${totalVentasTransferencia}, ${efectivoEnCaja}, ${diferencia}, GETDATE())
        `);

        res.json({ success: true, message: 'Caja cerrada exitosamente.' });
    } catch (error) {
        console.error('Error al cerrar la caja:', error);
        res.status(500).json({ success: false, message: 'Error al cerrar la caja.' });
    }
});

// Endpoint para obtener los movimientos disponibles para una fecha
router.get('/movimientos-por-fecha', async (req, res) => {
    const { fecha } = req.query;
    try {
        const movimientosResult = await mssql.query(`
            SELECT DISTINCT JornadaID FROM MovimientosCaja
            WHERE CONVERT(DATE, FechaMovimiento) = '${fecha}'
        `);

        if (movimientosResult.recordset.length === 0) {
            return res.status(400).json({ message: "No hay movimientos de caja para esta fecha.", jornadas: [] });
        }

        const jornadaIds = movimientosResult.recordset.map(mov => mov.JornadaID);
        const jornadasResult = await mssql.query(`
            SELECT JornadaID, FechaInicio 
            FROM Jornada
            WHERE JornadaID IN (${jornadaIds.join(', ')}) AND Activa = 0
        `);

        res.json({
            jornadas: jornadasResult.recordset
        });
    } catch (error) {
        console.error('Error obteniendo las jornadas:', error);
        res.status(500).send('Error en la consulta de jornadas.');
    }
});

// Ruta para obtener los movimientos de entrada y salida de la caja de una jornada
router.get('/movimientos-jornada', async (req, res) => {
    const { jornadaID } = req.query;

    try {
        // Obtener los movimientos de entrada y salida para la jornada seleccionada
        const resultEntrada = await mssql.query(`
            SELECT Monto, Motivo FROM MovimientosCaja
            WHERE JornadaID = ${jornadaID} AND TipoMovimiento = 'Entrada'
        `);

        const resultSalida = await mssql.query(`
            SELECT Monto, Motivo FROM MovimientosCaja
            WHERE JornadaID = ${jornadaID} AND TipoMovimiento = 'Salida'
        `);

        // Calcular el saldo de la caja chica
        const saldoResult = await mssql.query(`
            SELECT CajaChicaInicial FROM Jornada WHERE JornadaID = ${jornadaID}
        `);

        const saldoCajaChica = saldoResult.recordset[0].CajaChicaInicial +
                               resultEntrada.recordset.reduce((acc, cur) => acc + cur.Monto, 0) -
                               resultSalida.recordset.reduce((acc, cur) => acc + cur.Monto, 0);

        res.json({
            movimientosEntrada: resultEntrada.recordset,
            movimientosSalida: resultSalida.recordset,
            saldoCajaChica: saldoCajaChica
        });
    } catch (error) {
        console.error('Error al obtener los movimientos de la jornada:', error);
        res.status(500).send('Error al obtener los movimientos de la jornada.');
    }
});

module.exports = router;
