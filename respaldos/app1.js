// Importar dependencias
const express = require('express');
const mssql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Crear la aplicación Express
const app = express();

// Configurar el puerto del servidor
const PORT = 3000; // Puedes modificar este valor si es necesario

// Configuración de la conexión a la base de datos SQL Server directamente en app.js
const dbConfig = {
  user: 'jorge',          // Usuario de la base de datos
  password: '1001',    // Contraseña de la base de datos
  server: 'localhost',          // Servidor donde está SQL Server
  database: 'Almacen_BD',       // Nombre de la base de datos
  options: {
    encrypt: true,              // Habilitar encriptación de la conexión
    trustServerCertificate: true // Aceptar certificado del servidor (útil en desarrollo)
  }
};

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Para procesar las peticiones en formato JSON
app.use(bodyParser.urlencoded({ extended: true })); // Para formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conectar a la base de datos
mssql.connect(dbConfig, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos: ', err);
  } else {
    console.log('Conectado a la base de datos SQL Server');
  }
});

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));
app.use('/public', express.static(path.join(__dirname, 'public')));


// Ruta de inicio que servirá el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/menuprin.html'); // Redirige al archivo menuprin.html
});

// Rutas adicionales de ejemplo
app.get('/iniciarjornada', (req, res) => {
  res.sendFile(__dirname + '/public/html/iniciarJornada.html');  // Redirige al archivo iniciarJornada.html
});

app.get('/venta', (req, res) => {
  res.sendFile(__dirname + '/public/html/venta.html');  // Redirige al archivo venta.html
});

app.get('/inventario', (req, res) => {
  res.sendFile(__dirname + '/public/html/inventario.html');  // Redirige al archivo inventario.html
});

app.get('/stock', (req, res) => {
  res.sendFile(__dirname + '/public/html/stock.html');  // Redirige al archivo stock.html
});

app.get('/gestion-caja', (req, res) => {
  res.sendFile(__dirname + '/public/html/gestionCaja.html');  // Redirige al archivo gestionCaja.html
});


// Ruta para verificar si hay una jornada activa
app.get('/verificar-jornada-activa', async (req, res) => {
  try {
      // Conectar a la base de datos
      await mssql.connect(dbConfig);

      // Verificar si existe una jornada activa (sin FechaCierre)
      const result = await mssql.query(`
          SELECT COUNT(*) AS jornadaActiva
          FROM Jornada
          WHERE Activa = 1 AND FechaCierre IS NULL;
      `);

      // Si el contador es mayor que 0, existe una jornada activa
      if (result.recordset[0].jornadaActiva > 0) {
          res.json({ jornadaActiva: true });
      } else {
          res.json({ jornadaActiva: false });
      }
  } catch (error) {
      console.error('Error al verificar jornada activa:', error);
      res.status(500).json({ success: false, message: 'Error al verificar la jornada activa.' });
  }
});

// Ruta para iniciar la jornada
app.post('/iniciar-jornada', async (req, res) => {
  const { montoCaja } = req.body;

  try {
      // Conectar a la base de datos
      await mssql.connect(dbConfig);

      // Registrar la nueva jornada en la tabla Jornada
      const result = await mssql.query(`
          INSERT INTO Jornada (FechaInicio, CajaChicaInicial, Activa)
          VALUES (GETDATE(), ${montoCaja}, 1);
      `);

      // Si la inserción es exitosa, respondemos con éxito
      res.json({ success: true });
  } catch (error) {
      console.error('Error al registrar la jornada:', error);
      res.status(500).json({ success: false, message: 'Error al registrar la jornada.' });
  }
});


// Ruta para registrar una venta
app.post('/api/ventas', async (req, res) => {
  const { jornadaId, tipoPago, productos } = req.body; // productos es un array con { productoId, cantidad }
  const totalVenta = productos.reduce((acc, producto) => acc + (producto.cantidad * producto.precio), 0); // Sumar el total de la venta
  
  try {
    // Insertar la venta
    const result = await mssql.query(`
      INSERT INTO Venta (JornadaID, FechaVenta, TipoPago, TotalVenta)
      VALUES (${jornadaId}, GETDATE(), '${tipoPago}', ${totalVenta})
    `);

    // Obtener el ID de la venta recién insertada
    const ventaId = result.recordset[0].VentaID;

    // Insertar los detalles de la venta
    for (const producto of productos) {
      await mssql.query(`
        INSERT INTO VentaDetalle (VentaID, ProductoID, Cantidad, Total)
        VALUES (${ventaId}, ${producto.productoId}, ${producto.cantidad}, ${producto.cantidad * producto.precio})
      `);
    }

    res.status(201).json({ message: 'Venta registrada con éxito', ventaId });
  } catch (err) {
    console.error('Error al registrar la venta: ', err);
    res.status(500).send('Error al registrar la venta');
  }
});

// Ruta para obtener los grupos existentes
app.get('/obtener-grupos', async (req, res) => {
  try {
      await mssql.connect(dbConfig);
      const result = await mssql.query('SELECT * FROM Grupos');
      res.json({ grupos: result.recordset });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener grupos.' });
  }
});

// Obtener subgrupos de un grupo específico


// Ruta para obtener productos por subgrupo
app.get('/obtener-productos', async (req, res) => {
  const subgrupoID = req.query.subgrupoID;

  if (!subgrupoID) {
    return res.status(400).json({ message: 'El subgrupoID es requerido' });
  }

  try {
    const pool = await mssql.connect(dbConfig);

    // Consulta utilizando parámetros
    const result = await pool.request()
      .input('subgrupoID', mssql.Int, subgrupoID)
      .query(`
        SELECT ProductoID, Nombre, UnidadMedida, ValorUnidad
        FROM Productos
        WHERE SubgrupoID = @subgrupoID
      `);

    res.json({ productos: result.recordset });
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});


// Crear grupo
app.post('/crear-grupo', async (req, res) => {
  const { nombreGrupo } = req.body;
  try {
      await mssql.connect(dbConfig);

      // Verificar si el grupo ya existe
      const groupExists = await mssql.query(`
          SELECT COUNT(*) AS Count FROM Grupos WHERE Nombre = '${nombreGrupo}'
      `);

      // Si el grupo no existe, lo creamos
      if (groupExists.recordset[0].Count === 0) {
          const result = await mssql.query(`
              INSERT INTO Grupos (Nombre) VALUES ('${nombreGrupo}')
          `);
          res.json({ success: true, message: 'Grupo creado con éxito' });
      } else {
          // Si el grupo ya existe
          res.json({ success: false, message: 'El grupo ya existe' });
      }
  } catch (error) {
      console.error('Error al crear grupo:', error);
      res.status(500).json({ success: false, message: 'Error al crear grupo.' });
  }
});


// Crear subgrupo
app.post('/crear-subgrupo', async (req, res) => {
  const {grupoSeleccionado, nombreSubGrupo} = req.body; // 'grupo' es el nombre del grupo seleccionado en el cliente
  try {
      await mssql.connect(dbConfig);

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


// Crear producto 
app.post('/crear-producto', async (req, res) => {
  console.log('Body recibido:', req.body);

  const { grupo, subgrupo, nombre, unidad, valor } = req.body;
  
  // Verificar que los datos son correctos
  console.log('grupo:', grupo);
  console.log('subgrupo:', subgrupo);
  console.log('nombre:', nombre);
  console.log('unidad:', unidad);
  console.log('valor:', valor);

  try {
      // Validación de entrada
      const grupoID = parseInt(grupo);
      const subgrupoID = parseInt(subgrupo);
      const valorNumerico = parseFloat(valor);

      if (!grupoID || !subgrupoID || !nombre || !unidad || isNaN(valorNumerico) || valorNumerico <= 0) {
          return res.status(400).json({
              success: false,
              message: 'Datos inválidos. Asegúrate de completar todos los campos correctamente.',
          });
      }

      // Conectar a la base de datos
      await mssql.connect(dbConfig);

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
          INSERT INTO Productos (Nombre, GrupoID, SubgrupoID, UnidadMedida, ValorUnidad)
          VALUES (@nombre, @grupoID, @subgrupoID, @unidad, @valor)
      `;

      const pool = await mssql.connect(dbConfig);
      await pool.request()
          .input('nombre', mssql.VarChar(100), nombre)
          .input('grupoID', mssql.Int, grupoID)
          .input('subgrupoID', mssql.Int, subgrupoID)
          .input('unidad', mssql.VarChar(50), unidad)
          .input('valor', mssql.Decimal(10, 2), valorNumerico)
          .query(query);

      res.status(201).json({ success: true, message: 'Producto creado con éxito.' });
  } catch (err) {
      console.error('Error al crear producto:', err);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
});

// Ruta para obtener el GrupoID a partir del nombre del grupo
app.get('/obtener-grupo-id/:grupoNombre', async (req, res) => {
  const grupoNombre = req.params.grupoNombre; // Nombre del grupo
  console.log('Grupo seleccionado:', grupoNombre);

  try {
      await mssql.connect(dbConfig);

      // Buscar el GrupoID basado en el nombre del grupo
      const grupoResult = await mssql.query`
          SELECT GrupoID FROM Grupos WHERE Nombre = ${grupoNombre}
      `;

      if (grupoResult.recordset.length === 0) {
          return res.status(404).json({ success: false, message: 'El grupo especificado no existe.' });
      }

      const grupoID = grupoResult.recordset[0].GrupoID;

      res.json({ success: true, grupoID });
  } catch (error) {
      console.error('Error al obtener el GrupoID:', error);
      res.status(500).json({ success: false, message: 'Error al obtener el GrupoID.' });
  }
});


app.get('/obtener-subgrupos/:grupoID', async (req, res) => {
  const grupoSeleccionado = req.params.grupoID; // Ahora recibimos el GrupoID directamente
  console.log('Grupo seleccionado:', grupoSeleccionado);

  try {
      await mssql.connect(dbConfig);

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

// Ruta para registrar el stock sin procedimiento almacenado
// Ruta para registrar el stock con nombre del producto
app.post('/registrar-stock', async (req, res) => {
  const { productoSeleccionado, cantidadStock } = req.body;

  if (!productoSeleccionado || !cantidadStock) {
    return res.status(400).json({ message: 'Faltan datos requeridos.' });
  }

  try {
    const pool = await mssql.connect(dbConfig); // Conectar con la base de datos

    // Buscar el ProductoID a partir del nombre del producto
    const productoResult = await pool.request()
      .input('Nombre', mssql.VarChar, productoSeleccionado)
      .query('SELECT ProductoID FROM Productos WHERE Nombre = @Nombre');

    if (productoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const productoID = productoResult.recordset[0].ProductoID;

    // Insertar en la tabla Stock
    await pool.request()
      .input('ProductoID', mssql.Int, productoID)
      .input('CantidadDisponible', mssql.Decimal(10, 2), cantidadStock)
      .query('INSERT INTO Stock (ProductoID, CantidadDisponible) VALUES (@ProductoID, @CantidadDisponible)');

    res.status(200).json({
      message: 'Stock registrado exitosamente.',
      productoID,
      productoSeleccionado,
      cantidadDisponible: cantidadStock
    });

  } catch (error) {
    console.error('Error al registrar el stock:', error);
    res.status(500).json({ message: 'Error al registrar el stock.', error: error.message });
  }
});


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
