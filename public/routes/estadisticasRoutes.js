const express = require("express");
const router = express.Router();
const sql = require("mssql");

// Obtener ventas por día
router.get("/ventas-dia", async (req, res) => {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: "Fecha requerida" });

    try {
        const result = await sql.query(
            `SELECT v.FechaVenta, vd.VentaID, p.Nombre, vd.Cantidad, vd.Total
            FROM Venta v
            JOIN VentaDetalle vd ON v.VentaID = vd.VentaID
            JOIN Productos p ON vd.ProductoID = p.ProductoID
            WHERE CAST(v.FechaVenta AS DATE) = '${fecha}'`
        );

        const totalVentas = await sql.query(
            `SELECT SUM(vd.Total) AS TotalDia
            FROM Venta v
            JOIN VentaDetalle vd ON v.VentaID = vd.VentaID
            WHERE CAST(v.FechaVenta AS DATE) = '${fecha}'`
        );

        res.json({ ventas: result.recordset, total: totalVentas.recordset[0].TotalDia || 0 });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener las ventas del día" });
    }
});


// Obtener resumen de ventas totales
router.get("/ventas-totales", async (req, res) => {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: "Fecha requerida" });
    
    try {
        const result = await sql.query(
            `SELECT FechaVenta, TipoPago, TotalVenta FROM Venta WHERE CAST(FechaVenta AS DATE) = '${fecha}'`
        );
        
        const totalVentas = await sql.query(
            `SELECT SUM(TotalVenta) AS TotalGeneral FROM Venta WHERE CAST(FechaVenta AS DATE) = '${fecha}'`
        );
        
        res.json({ resumen: result.recordset, total: totalVentas.recordset[0].TotalGeneral || 0 });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el resumen de ventas" });
    }
});

// Obtener ventas por mes
router.get("/ventas-mes", async (req, res) => {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ error: "Fecha requerida" });

    try {
        const result = await sql.query(
            `SELECT v.FechaVenta, v.TipoPago, v.TotalVenta
            FROM Venta v
            WHERE FORMAT(v.FechaVenta, 'yyyy-MM') = '${fecha}'`
        );

        const totalVentas = await sql.query(
            `SELECT SUM(v.TotalVenta) AS TotalMes
            FROM Venta v
            WHERE FORMAT(v.FechaVenta, 'yyyy-MM') = '${fecha}'`
        );

        res.json({ resumen: result.recordset, total: totalVentas.recordset[0].TotalMes || 0 });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener el resumen de ventas" });
    }
});


module.exports = router;
