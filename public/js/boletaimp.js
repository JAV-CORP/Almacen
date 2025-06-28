window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Función para obtener la fecha actual en formato dd-mm-yyyy
        function getCurrentDate() {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0'); // Asegura que el día tenga dos dígitos
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Los meses empiezan desde 0, por eso sumamos 1
            const year = today.getFullYear();

            return `${day}-${month}-${year}`;
        }

        // Llamar al servidor para obtener los datos de la venta y la boleta
        const response = await fetch('/api/getLastSaleAndBoleta');
        const data = await response.json();

        // Mostrar la fecha actual
        document.getElementById('fecha').innerText = getCurrentDate();

        // Mostrar la ventaID y total de la venta
        document.getElementById('ventaID').innerText = `Venta: ${data.venta.ventaID}`;
        document.getElementById('total').innerText = `Total: $${data.venta.total}`;

        // Mostrar los datos de la boleta
        document.getElementById('nombreNegocio').innerText = data.boleta.nombreNegocio;
        document.getElementById('rut').innerText = `RUT: ${data.boleta.rut}`;
        document.getElementById('direccion').innerText = `Dirección: ${data.boleta.direccion}`;
        document.getElementById('telefono').innerText = `Teléfono: ${data.boleta.telefono}`;
        document.getElementById('correo').innerText = `Correo: ${data.boleta.correo}`;
        document.getElementById('mensaje').innerText = data.boleta.mensaje;

        // Mostrar la imagen de la boleta si existe
        const imagenBoleta = document.getElementById('imagenBoleta');
        if (data.boleta.imagenRuta) {
            // Construir la ruta completa de la imagen
            const imagenRuta = `/Imagenes/${data.boleta.imagenRuta}`;
            document.getElementById('imagenMostrar').src = imagenRuta; // Asigna la ruta de la imagen
            imagenBoleta.style.display = 'block'; // Asegura que la imagen sea visible
        }

        // Mostrar los productos de la venta
        const listaProductos = document.getElementById('listaProductos');
        data.detalles.forEach(detalle => {
            const productoItem = document.createElement('div');
            productoItem.classList.add('producto-item');
            productoItem.innerHTML = `
                <span> ${detalle.Productos}</span>
                <span>${detalle.Cantidad}</span>
                <span> $${detalle.Total}</span>
            `;
            listaProductos.appendChild(productoItem);
        });
        
 // Agregar un pequeño retraso para asegurar que la impresión se complete antes de redirigir
 setTimeout(() => {
    window.print();
}, 500);


// Redirigir después de imprimir o cancelar
window.onafterprint = function() {
    setTimeout(() => {
        window.location.href = '../public/html/venta.html';
    }, 500); // Pequeño retraso para evitar conflictos en algunos navegadores
};

    } catch (error) {
        console.error('Error al cargar los datos de la venta:', error);
    }
});
