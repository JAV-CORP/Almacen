const socket = io();

// Función para agregar un pedido al DOM
function agregarPedidoEnDOM(pedido) {
    const pedidoList = document.getElementById("pedidoList");
    const pedidoItem = document.createElement("div");
    pedidoItem.classList.add("pedido-item");
    pedidoItem.innerHTML = `
        <p><strong>${pedido.nombre}</strong> - Cantidad: ${pedido.cantidad}</p>
        <p>Precio: $${pedido.costo.toFixed(2)}</p>
    `;
    pedidoList.appendChild(pedidoItem);
}

// Función para actualizar el total del pedido
function actualizarTotalPedido() {
    const pedidoList = document.getElementById("pedidoList");
    let total = 0;

    const pedidos = pedidoList.querySelectorAll(".pedido-item");

    pedidos.forEach(pedido => {
        const costo = parseFloat(pedido.querySelector("p:last-child").textContent.replace("Precio: $", ""));
        total += costo;
    });

    document.getElementById("totalPedido").textContent = `Total: $${Math.round(total)}`;
}

// Cuando se cargue la página
document.addEventListener("DOMContentLoaded", () => {
    const pedidoList = document.getElementById("pedidoList");
    const totalPedido = document.getElementById("totalPedido");

    // Escuchar los pedidos emitidos desde el servidor
    socket.on('nuevoPedido', function(pedido) {
        if (pedido && !isNaN(pedido.costo)) {
            pedido.costo = parseFloat(pedido.costo);

            // Revisar si el pedido ya existe en el DOM antes de agregarlo
            const pedidosExistentes = document.querySelectorAll(".pedido-item");
            let pedidoYaExistente = false;

            // Verificar si el pedido ya está en la lista
            pedidosExistentes.forEach(existingPedido => {
                const existingNombre = existingPedido.querySelector("p").textContent;
                if (existingNombre.includes(pedido.nombre) && !pedidoYaExistente) {
                    pedidoYaExistente = true;
                }
            });

            // Si el pedido no existe, agregarlo al DOM
            if (!pedidoYaExistente) {
                agregarPedidoEnDOM(pedido);
                actualizarTotalPedido();
            }
        } else {
            console.error('El costo no es un número válido:', pedido);
        }
    });

    // Función para actualizar la lista de pedidos (en caso de que los datos sean guardados en localStorage)
    function actualizarPedidos() {
        // Obtener los pedidos guardados en el localStorage
        const pedidos = JSON.parse(localStorage.getItem("pedidos")) || [];
        let total = 0;

        // Limpiar la lista de pedidos en el DOM antes de agregar los nuevos
        pedidoList.innerHTML = "";

        pedidos.forEach(pedido => {
            const pedidoItem = document.createElement("div");
            pedidoItem.classList.add("pedido-item");
            pedidoItem.innerHTML = `
                <p><strong>${pedido.nombre}</strong> - Cantidad: ${pedido.cantidad}</p>
                <p>Precio: $${pedido.costo.toFixed(2)}</p> 
            `;
            pedidoList.appendChild(pedidoItem);
        
            total += pedido.costo * pedido.cantidad; 
        });

        // Actualizar el total en el DOM
        totalPedido.textContent = `Total: $${Math.round(total)}`;
    }

    // Actualizar la lista de pedidos al cargar la página
    actualizarPedidos();

    // Escuchar el evento de almacenamiento para actualizar la lista si cambia en otra pestaña
    window.addEventListener("storage", actualizarPedidos);
});
