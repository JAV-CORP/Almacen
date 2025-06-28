// config/dbConfig.js
const mssql = require('mssql');
const os = require('os');



const dbConfig = {
  user: 'jorge',
  password: '1001',
  server: 'almacen.local',// Permite accesibilidad local y en red
  database: 'Almacen_BD',
  options: {
    encrypt: true,  // Desactívalo si no usas certificados SSL en tu SQL Server
    trustServerCertificate: true
  }
};

const connectDB = async () => {
  try {
    await mssql.connect(dbConfig);
    console.log('Conectado a la base de datos en localhost');
  } catch (err) {
    console.error('Error al conectar con la base de datos: ', err);
  }
};

module.exports = { dbConfig, connectDB };