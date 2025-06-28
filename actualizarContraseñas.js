const mssql = require("mssql");
const bcrypt = require("bcrypt");
const os = require('os');

const LOCAL_IP = getWiFiIP();

const dbConfig = {
  user: 'jorge',
  password: '1001',
  server: LOCAL_IP,  // Usar 'localhost' si LOCAL_IP es null
  database: 'Almacen_BD',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

function getWiFiIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    // Solo queremos la interfaz Wi-Fi (o el nombre de tu adaptador Wi-Fi en tu red)
    if (name.includes('Wi-Fi')) { // Aquí puedes cambiar 'Wi-Fi' si tu adaptador tiene otro nombre
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;  // Retorna la dirección IPv4 de la interfaz Wi-Fi
        }
      }
    }
  }
  return 'localhost';  // Si no se encuentra la IP de Wi-Fi, devuelve localhost como fallback
}


const connectDB = async () => {
  try {
    await mssql.connect(dbConfig);
    console.log('Conectado a la base de datos SQL Server');
  } catch (err) {
    console.error('Error al conectar con la base de datos: ', err);
  }
};

// Función para encriptar y actualizar contraseñas
async function actualizarContraseñas() {
    try {
        let pool = await mssql.connect(dbConfig);

        // Obtener todos los usuarios
        const result = await pool.request().query("SELECT UsuarioID, Contraseña FROM Usuarios");

        for (let user of result.recordset) {
            const hash = await bcrypt.hash(user.Contraseña, 10); // Hashear la contraseña

            // Actualizar la contraseña en la base de datos
            await pool.request()
                .input("usuarioID", mssql.Int, user.UsuarioID)
                .input("nuevaContraseña", mssql.NVarChar, hash)
                .query("UPDATE Usuarios SET Contraseña = @nuevaContraseña WHERE UsuarioID = @usuarioID");

            console.log(`Contraseña de UsuarioID ${user.UsuarioID} actualizada`);
        }

        console.log("✅ Todas las contraseñas han sido actualizadas correctamente.");
    } catch (error) {
        console.error("❌ Error al actualizar contraseñas:", error);
    } finally {
        mssql.close();
    }
}

// Ejecutar la función
actualizarContraseñas();
