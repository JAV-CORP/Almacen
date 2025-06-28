// Importar dependencias
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mssql = require('mssql');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs'); // Para escribir archivos
const { parse } = require('json2csv'); // Para generar el archivo CSV
const path = require('path');
const os = require('os');
const session = require('express-session');
const { connectDB } = require('./dbConfig');  // Requerir el archivo dbConfig

// Importar las rutas desde la carpeta 'public/routes'
const crearRoutes = require('./public/routes/crearRoutes');

const modRoutes = require('./public/routes/modRoutes');

const jornadaRoutes = require('./public/routes/jornadaRoutes');

const ventaRoutes = require('./public/routes/ventaRoutes');

const gestionRoutes = require('./public/routes/gestionRoutes');

const pedidoRoutes = require('./public/routes/pedidoRoutes');

const estadisticasRoutes = require('./public/routes/estadisticasRoutes');

const stockRoutes = require('./public/routes/stockRoutes');

const boletaRoutes = require('./public/routes/boletaRoutes');

const boletaimpRoutes = require('./public/routes/boletaimpRoutes');

const menuprinRoutes = require('./public/routes/menuprinRoutes');

const loginRoutes = require('./public/routes/loginRoutes');

const gesusuariosRoutes = require('./public/routes/gesusuariosRoutes');

const stockdispRoutes = require('./public/routes/stockdispRoutes');

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Almacén temporal de pedidos en memoria (opcional)
let pedidosEnMemoria = []; // Inicialización de la memoria de pedidos

// Configurar el puerto del servidor
const PORT = 3000; // Puedes modificar este valor si es necesario

// Conectar a la base de datos
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Para procesar las peticiones en formato JSON
app.use(bodyParser.urlencoded({ extended: true })); // Para formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function verificarAutenticacion(req, res, next) {
  if (req.session.usuario) {
      next(); // ✅ Si está autenticado, sigue a la siguiente función
  } else {
      res.redirect('/login'); // 🚫 Si no, redirige al login
  }
}

app.use(session({
  secret: 'soloyolose', // Cámbialo por algo seguro en producción
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Usa true si usas HTTPS
}));



// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));
app.use('/public', express.static(path.join(__dirname, 'public')));
// Servir archivos estáticos desde la carpeta actual
app.use('/informes', express.static(path.join(__dirname, 'informes')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(crearRoutes);
app.use(modRoutes);
app.use(jornadaRoutes);
app.use(ventaRoutes);
app.use(gestionRoutes);
app.use(pedidoRoutes);
app.use(estadisticasRoutes);
app.use(stockRoutes);
app.use(boletaRoutes);
app.use(boletaimpRoutes);
app.use(menuprinRoutes);
app.use(loginRoutes);
app.use(gesusuariosRoutes);
app.use(stockdispRoutes);


// Ruta de inicio que servirá el archivo HTML
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/login.html'); // Redirige al archivo menuprin.html
});

// Rutas adicionales de ejemplos

app.get('/menuprin',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/menuprin.html');  // Redirige al archivo iniciarJornada.html
});

app.get('/iniciarjornada',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/iniciarJornada.html');  // Redirige al archivo iniciarJornada.html
});

app.get('/venta',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/venta.html');  // Redirige al archivo venta.html
});

app.get('/inventario',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/inventario.html');  // Redirige al archivo inventario.html
});

app.get('/crear',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/crear.html');  // Redirige al archivo crear.html
});

app.get('/modificar',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/modificar.html');  // Redirige al archivo modificar.html
});

app.get('/gestionCaja',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/gestionCaja.html');  // Redirige al archivo gestionCaja.html
});

app.get('/pedido',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/pedido.html');  // Redirige al archivo pedido.html
});

app.get('/estadisticas',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/estadisticas.html');  // Redirige al archivo estadisticas.html
});

app.get('/stock',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/stock.html');  // Redirige al archivo stock.html
});

app.get('/boleta',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/boleta.html');  // Redirige al archivo boleta.html
});

app.get('/boletaimp',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/boletaimp.html');  // Redirige al archivo boletaimp.html
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/html/login.html');  // Redirige al archivo boletaimp.html
});

app.get('/menusistema',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/menusistema.html');  // Redirige al archivo boletaimp.html
});

app.get('/gestionUsuarios',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/gestionUsuarios.html');  // Redirige al archivo boletaimp.html
});

app.get('/stockDisponible',verificarAutenticacion, (req, res) => {
  res.sendFile(__dirname + '/public/html/stockDisponible.html');  // Redirige al archivo boletaimp.html
});


// Configuración de Socket.IO para manejar pedidos en tiempo real
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  // Enviar los pedidos actuales al nuevo cliente
  socket.emit('pedidosActuales', pedidosEnMemoria); // Usar 'pedidosEnMemoria' directamente

  // Escuchar el evento 'nuevoPedido' que se emite desde venta.js
  socket.on('nuevoPedido', (pedido) => {
    // Actualizar el arreglo en memoria para que la ruta GET /pedidos lo refleje
    pedidosEnMemoria.push(pedido);
    // Emitir el nuevo pedido a todos los clientes conectados (venta.html y pedido.html)
    io.emit('nuevoPedido', pedido);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});





server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
