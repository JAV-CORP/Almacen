const express = require('express');
const router = express.Router();
const mssql = require('mssql');

router.get("/stock-productos", async (req, res) => {
    try {
        const result = await mssql.query(`
            SELECT s.ProductoID, p.Nombre, s.CantidadDisponible AS Stock 
            FROM Stock s
            INNER JOIN Productos p ON s.ProductoID = p.ProductoID
            ORDER BY p.Nombre ASC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error obteniendo stock:", error);
        res.status(500).json({ message: "Error al obtener stock." });
    }
});

// Nueva ruta para obtener productos sin stock
router.get("/productos-sin-stock", async (req, res) => {
    try {
        const result = await mssql.query(`
            SELECT s.ProductoID, p.Nombre, s.CantidadDisponible AS Stock 
            FROM Stock s
            INNER JOIN Productos p ON s.ProductoID = p.ProductoID
            WHERE s.CantidadDisponible <= 0
            ORDER BY p.Nombre ASC
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error obteniendo productos sin stock:", error);
        res.status(500).json({ message: "Error al obtener productos sin stock." });
    }
});

module.exports = router;

