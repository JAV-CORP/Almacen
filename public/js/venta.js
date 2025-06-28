const socket = io();

document.addEventListener('DOMContentLoaded', function () {
    const gruposContainer = document.getElementById('grupos');
    const subgruposContainer = document.getElementById('subgrupos');
    const productosContainer = document.getElementById('productos');
    const detalleNombre = document.getElementById('detalleNombre');
    const detalleUnidad = document.getElementById('detalleUnidad');
    const detalleValor = document.getElementById('detalleValor');
    const detalleStock = document.getElementById('detalleStock');
    const cantidad = document.getElementById('detalleCantidad');
    const detalleCosto = document.getElementById('detalleCosto');
    const montoRecibido = document.getElementById('montoRecibido');
    const metodoPago = document.getElementById('metodoPago');
    actualizarSaldoCajaChica();

    // Cargar grupos al inicio
    fetch('/grupos')
        .then((response) => response.json())
        .then((data) => {
            data.grupos.forEach((grupo) => {
                const button = document.createElement('button');
                button.textContent = grupo.Nombre;
                button.addEventListener('click', () => cargarSubgrupos(grupo.GrupoID));
                gruposContainer.appendChild(button);
            });
        })
        .catch((error) => console.error('Error al cargar grupos:', error));

    function cargarSubgrupos(grupoId) {
        subgruposContainer.innerHTML = '';
        productosContainer.innerHTML = '';
        fetch(`/subgrupos/${grupoId}`)
            .then((response) => response.json())
            .then((data) => {
                data.subgrupos.forEach((subgrupo) => {
                    const button = document.createElement('button');
                    button.textContent = subgrupo.Nombre;
                    button.addEventListener('click', () => cargarProductos(subgrupo.SubgrupoID));
                    subgruposContainer.appendChild(button);
                });
            })
            .catch((error) => console.error('Error al cargar subgrupos:', error));
    }

    function cargarProductos(subgrupoId) {
        productosContainer.innerHTML = '';
        fetch(`/productos/${subgrupoId}`)
            .then((response) => response.json())
            .then((data) => {
                data.productos.forEach((producto) => {
                    const button = document.createElement('button');
                    button.textContent = producto.Nombre;
                    button.addEventListener('click', () => cargarDetalleProducto(producto.ProductoID));
                    productosContainer.appendChild(button);
                });
            })
            .catch((error) => console.error('Error al cargar productos:', error));
    }

    function cargarDetalleProducto(productoId) {
        fetch(`/producto-detalle/${productoId}`)
            .then((response) => response.json())
            .then((data) => {
                const producto = data.producto;
    
                // Actualizar los detalles del producto
                detalleNombre.textContent = producto.Nombre;
                detalleNombre.setAttribute("data-producto-id", productoId); // Guardar el ID del producto
                detalleUnidad.textContent = `Unidad: ${producto.UnidadMedida}`;
                detalleValor.textContent = `Valor: $${producto.ValorUnidad}`;
                detalleStock.textContent = `Stock: ${producto.Stock}`;
            })
            .catch((error) => console.error('Error al cargar el detalle del producto:', error));
    }
    
document.getElementById("calcularCosto").addEventListener("click", function() {
    // Obtener los valores
    const cantidad = parseFloat(document.getElementById("detalleCantidad").value);
    const valor = parseFloat(document.getElementById("detalleValor").textContent.replace("Valor: $", ""));
    
    // Verificar si ambos valores son números válidos
    if (!isNaN(cantidad) && !isNaN(valor)) {
        // Calcular el costo
        const costo = cantidad * valor;
        
        // Mostrar el costo calculado en el elemento correspondiente
        document.getElementById("detalleCosto").textContent = "Costo: $" + costo.toFixed(2);
    } else {
        // Si alguno de los valores no es válido, mostrar un mensaje de error
        alert("Por favor, ingrese valores válidos.");
    }
});

document.getElementById("ingresarPedido").addEventListener("click", function() {
    // Obtener los valores de los detalles
    const nombre = document.getElementById("detalleNombre").textContent;
    const unidad = document.getElementById("detalleUnidad").textContent;
    const cantidad = parseFloat(document.getElementById("detalleCantidad").value);
    const costo = document.getElementById("detalleCosto").textContent.replace("Costo: $", "");
    const productoId = parseInt(document.getElementById("detalleNombre").getAttribute("data-producto-id")); // Extraer el ID del producto

    // Verificar si los valores son válidos
    if (!isNaN(cantidad) && cantidad > 0 && costo !== "") {
        // Crear un nuevo elemento de pedido
        const nuevoPedido = document.createElement("div");
        nuevoPedido.classList.add("order-item");
        
        // Agregar el atributo 'data-producto-id' con el ID del producto
        nuevoPedido.setAttribute("data-producto-id", productoId);

        // Agregar contenido al nuevo pedido
        nuevoPedido.innerHTML = `
            <p>${nombre}</p>
            <p>${unidad}</p>
            <p>${cantidad}</p>
            <p>$${costo}</p>
        `;

        // Agregar el nuevo pedido a la lista de pedidos
        document.getElementById("pedidoList").appendChild(nuevoPedido);

        // Actualizar el total del pedido
        actualizarTotalPedido();
         // Emitir el pedido a todos los clientes conectados
         socket.emit('nuevoPedido', {
            nombre,
            unidad,
            cantidad,
            costo: parseFloat(costo),  // Asegúrate de que 'costo' sea un número
            productoId
        });
        
    } else {
        // Si alguno de los valores no es válido, mostrar un mensaje de error
        alert("Por favor, ingrese todos los valores correctamente.");
    }
});


// Función para actualizar el total del pedido
function actualizarTotalPedido() {
    let total = 0;

    // Obtener todos los elementos de la lista de pedidos
    const pedidos = document.querySelectorAll("#pedidoList .order-item");

    // Sumar el costo de cada pedido
    pedidos.forEach(pedido => {
        const costo = parseFloat(pedido.querySelector("p:last-child").textContent.replace("$", ""));
        total += costo;
    });

    // Mostrar el total en el elemento correspondiente
    document.getElementById("totalPedido").textContent = "Total: $" + total.toFixed(2);
}


document.getElementById('enviarPedido').addEventListener('click', async function () {
    const metodoPago = document.getElementById('metodoPago').value;
    const montoRecibido = parseFloat(document.getElementById('montoRecibido').value);
    const totalPedido = parseFloat(document.getElementById('totalPedido').textContent.replace('Total: $', ''));

    // Validar monto recibido solo si el método de pago es "Efectivo"
    if (metodoPago === 'Efectivo' && (isNaN(montoRecibido) || montoRecibido < totalPedido)) {
        alert('El monto recibido debe ser mayor o igual al total del pedido.');
        return;
    }

    try {
        // Obtener el JornadaID activo antes de enviar el pedido
        const jornadaResponse = await fetch('/jornada-activa');
        const jornadaData = await jornadaResponse.json();

        if (!jornadaData.jornadaId) {
            alert('No hay una jornada activa.');
            return;
        }

        const jornadaId = jornadaData.jornadaId;

        // Obtener los productos del pedido
        const productos = [];
        const pedidos = document.querySelectorAll('#pedidoList .order-item');
        pedidos.forEach((pedido) => {
            const productoId = parseInt(pedido.getAttribute('data-producto-id'));
            const cantidad = parseFloat(pedido.querySelector('p:nth-child(3)').textContent);
            const total = parseFloat(pedido.querySelector('p:nth-child(4)').textContent.replace('$', ''));

            productos.push({ productoId, cantidad, total });
        });

        // Enviar datos al servidor
        const response = await fetch('/registrar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productos,
                total: totalPedido,
                tipoPago: metodoPago,
            }),
        });

        if (response.ok) {
            // Mostrar mensaje de confirmación
            const confirmar = document.createElement('div');
            confirmar.innerHTML = `
                <p>¿Deseas imprimir el pedido?</p>
                <button id="btnSi">Sí</button>
                <button id="btnNo">No</button>
            `;
            confirmar.style.position = 'fixed';
            confirmar.style.top = '50%';
            confirmar.style.left = '50%';
            confirmar.style.transform = 'translate(-50%, -50%)';
            confirmar.style.background = 'white';
            confirmar.style.padding = '20px';
            confirmar.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.2)';
            document.body.appendChild(confirmar);

            document.getElementById('btnSi').addEventListener('click', function () {
                window.location.href = './boletaimp.html';
            });

            document.getElementById('btnNo').addEventListener('click', function () {
                location.reload();
            });
        } else {
            alert('Error al registrar el pedido');
        }
    } catch (error) {
        console.error('Error al enviar pedido:', error);
    }
});

    
document.getElementById('montoRecibido').addEventListener('input', function () {
    const totalPedido = parseFloat(document.getElementById('totalPedido').textContent.replace('Total: $', ''));
    const montoRecibido = parseFloat(this.value);

    if (!isNaN(montoRecibido) && montoRecibido >= totalPedido) {
        const vuelto = montoRecibido - totalPedido;
        document.getElementById('vuelto').textContent = `Vuelto: $${vuelto.toFixed(2)}`;
    } else {
        document.getElementById('vuelto').textContent = 'Vuelto: $0';
    }
});



document.getElementById('metodoPago').addEventListener('change', function () {
    const metodoPago = this.value;
    const montoRecibidoDiv = document.getElementById('montoRecibidoDiv');
    const montoRecibidoInput = document.getElementById('montoRecibido');

    if (metodoPago === 'Efectivo') {
        montoRecibidoDiv.style.display = 'block';
        montoRecibidoInput.required = true; // Exigir el campo
    } else {
        montoRecibidoDiv.style.display = 'none';
        montoRecibidoInput.required = false; // No exigir el campo
        montoRecibidoInput.value = ''; // Limpiar el valor del campo
        document.getElementById('vuelto').textContent = 'Vuelto: $0'; // Resetear el vuelto
    }
});

document.getElementById("aceptarCajaChica").addEventListener("click", function() {
    const tipoCaja = document.getElementById("tipoCaja").value;
    const montoCaja = parseFloat(document.getElementById("montoCaja").value);
    const motivoCaja = document.getElementById("motivoCaja").value;

    if (isNaN(montoCaja) || montoCaja <= 0 || !motivoCaja) {
        alert("Por favor ingresa un monto y un motivo válidos.");
        return;
    }

    fetch('/registrar-caja-chica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoCaja, montoCaja, motivoCaja })
        
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        actualizarSaldoCajaChica();
    })
    .catch(error => console.error('Error al registrar transacción de caja chica:', error));
});

document.getElementById('terminarJornada').addEventListener('click', function() {
    // Confirmar si se está seguro de terminar la jornada
    const confirmacion = window.confirm("¿Estás seguro de terminar la jornada?");
    
    if (confirmacion) {
        // Si confirma, hacer la solicitud al backend para actualizar la jornada
        fetch('/terminar-jornada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            // Si la respuesta es positiva, redirigir al menú principal
            if (data.message === "Jornada terminada correctamente") {
                window.location.href = "./menuprin.html";
            } else {
                alert("Hubo un error al terminar la jornada.");
            }
        })
        .catch(error => {
            console.error('Error al terminar la jornada:', error);
            alert("Hubo un error al terminar la jornada.");
        });
    }
});


document.getElementById("menuPrincipalBtn").addEventListener("click", function() {
    // Lógica para redirigir al menú principal
    window.location.href = "../html/menuprin.html"; // Asegúrate de cambiar la ruta al menú principal real
});

// Función para obtener el saldo actual de caja chica
function actualizarSaldoCajaChica() {
    fetch('/saldo-caja-chica') // Endpoint del backend
        .then((response) => response.json())
        .then((data) => {
            // Acceder a 'montoCaja' en lugar de 'saldo'
            document.getElementById('saldoCajaChica').textContent = `$${data.montoCaja.toFixed(2)}`;
        })
        .catch((error) => console.error('Error al obtener el saldo de caja chica:', error));
}


// Llamar a la función al cargar la página
document.addEventListener('DOMContentLoaded', actualizarSaldoCajaChica);

// Llamar a esta función después de registrar un movimiento de caja chica
document.getElementById("aceptarCajaChica").addEventListener("click", function() {
    // ... lógica para registrar el movimiento ...
    actualizarSaldoCajaChica(); // Actualizar saldo después de aceptar
});

// Función para resetear inputs y selects
function resetearCampos() {
    document.querySelectorAll('input, select').forEach(element => {
        if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = false; // Desmarcar checkboxes y radios
        } else if (element.tagName === 'SELECT') {
            element.selectedIndex = 0; // Reiniciar selects
        } else {
            element.value = ''; // Limpiar inputs
        }
    });

    // Reiniciar valores en pantalla
    document.getElementById('detalleNombre').textContent = 'Nombre del producto';
    document.getElementById('detalleUnidad').textContent = 'Unidad:';
    document.getElementById('detalleValor').textContent = 'Valor:';
    document.getElementById('detalleStock').textContent = 'Stock:';
    document.getElementById('detalleCosto').textContent = 'Costo: $0';
    document.getElementById('vuelto').textContent = 'Vuelto: $0';
    document.getElementById('totalPedido').textContent = 'Total: $0';

    // Vaciar la lista de pedidos
    document.getElementById('pedidoList').innerHTML = '';
}

document.getElementById("imprimirBoleta").addEventListener("click", async function() {
    // Recuperar el formato guardado
    const formato = JSON.parse(localStorage.getItem("formatoBoleta"));
    if (!formato) {
        alert("No hay un formato guardado.");
        return;
    }
    
 
    
    try {
        // Obtener el último VentaID desde el servidor
        const respuestaVenta = await fetch("/ultimaVenta");
        const ultimaVenta = await respuestaVenta.json();
        const ventaID = ultimaVenta.VentaID;
        
        document.getElementById("ventaID").innerHTML = ventaID;
        
        // Obtener los productos de esa venta
        const respuestaProductos = await fetch(`/productosVenta/${ventaID}`);
        const productos = await respuestaProductos.json();
        
        let listaHTML = "";
        productos.forEach(producto => {
            listaHTML += `<li>${producto.Nombre} - ${producto.Cantidad} - $${producto.Total}</li>`;
        });
        document.getElementById("listaProductos").innerHTML = listaHTML;
        
        // Mostrar el total de la venta
        document.getElementById("total").innerHTML = `$${ultimaVenta.TotalVenta}`;
        
        // Mostrar los demás datos del formato guardado
        document.getElementById("nombreNegocio").innerHTML = formato.nombreNegocio;
        document.getElementById("rut").innerHTML = formato.rut;
        document.getElementById("direccion").innerHTML = formato.direccion;
        document.getElementById("imagenBoleta").src = formato.imagen;
        document.getElementById("mensaje").innerHTML = formato.mensaje;
        
        // Imprimir boleta
        window.print();
    } catch (error) {
        console.error("Error al obtener datos de la venta:", error);
        alert("Ocurrió un error al cargar los datos de la venta.");
    }
});


window.onload = resetearCampos;

});
