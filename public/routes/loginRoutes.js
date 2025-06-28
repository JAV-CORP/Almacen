const express = require("express");
const mssql = require("mssql");
const bcrypt = require("bcrypt");
const session = require("express-session");

const router = express.Router();


router.post("/login", async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // Buscar el usuario en la base de datos
        const result = await mssql.query(`
            SELECT UsuarioID, Nombre, Contraseña, Rol, Estado, IntentosFallidos 
            FROM Usuarios 
            WHERE Nombre = '${usuario}'
        `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        let user = result.recordset[0];

        // Verificar si el usuario está bloqueado
        if (user.Estado === "bloqueado") {
            return res.status(403).json({ error: "Cuenta bloqueada. Contacte al administrador." });
        }

        // Comparar la contraseña ingresada con la almacenada en la base de datos
        const passwordMatch = await bcrypt.compare(password, user.Contraseña);

        if (!passwordMatch) {
            let intentos = user.IntentosFallidos + 1;

            // Si falla 3 veces, bloquear la cuenta
            if (intentos >= 3) {
                await mssql.query(`
                    UPDATE Usuarios 
                    SET Estado = 'bloqueado', IntentosFallidos = 3 
                    WHERE UsuarioID = ${user.UsuarioID}
                `);
                return res.status(403).json({ error: "Cuenta bloqueada por demasiados intentos fallidos." });
            } else {
                await mssql.query(`
                    UPDATE Usuarios 
                    SET IntentosFallidos = ${intentos} 
                    WHERE UsuarioID = ${user.UsuarioID}
                `);
                return res.status(401).json({ error: `Intento ${intentos}/3. Usuario o contraseña incorrectos.` });
            }
        }

        // Si la contraseña es correcta, restablecer intentos y activar la sesión
        await mssql.query(`
            UPDATE Usuarios 
            SET IntentosFallidos = 0, SesionActiva = 1, UltimoLogin = GETDATE() 
            WHERE UsuarioID = ${user.UsuarioID}
        `);

        // Guardar el nombre del usuario en la sesión
        req.session.usuario = user.Nombre;

        res.json({ mensaje: "Inicio de sesión exitoso", rol: user.Rol });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error del servidor" });
    }
});

// Ruta para cerrar sesión
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Error al cerrar sesión" });
        }
        res.json({ mensaje: "Sesión cerrada correctamente" });
    });
});

module.exports = router;
