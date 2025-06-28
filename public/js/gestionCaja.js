document.addEventListener('DOMContentLoaded', function () {
    cargarDatosGestionCaja();

    // Función para cargar los datos de la jornada y actualizar la UI
    function cargarDatosGestionCaja() {
        fetch('/gestion-caja')  // Llamada al endpoint que devuelve los datos
            .then((response) => response.json())
            .then((data) => {
                // Mostrar los datos de ventas sin decimales
                document.getElementById('totalVentas').textContent = `Total de Ventas: $${Math.floor(data.totalVentas.TotalVentas)}`;
                document.getElementById('ventasEfectivo').textContent = `Total en Efectivo: $${Math.floor(data.totalVentas.TotalEfectivo)}`;
                document.getElementById('ventasTarjeta').textContent = `Total en Tarjetas: $${Math.floor(data.totalVentas.TotalTarjeta)}`;
                document.getElementById('ventasTransferencia').textContent = `Total en Transferencias: $${Math.floor(data.totalVentas.TotalTransferencia)}`;
                document.getElementById('montoCajaChica').textContent = `Monto de Caja Chica: $${Math.floor(data.montoCajaChica)}`;

                // Obtener el monto de caja chica actualizado
                const montoCajaChica = Math.floor(data.montoCajaChica);

                // Si la jornada está activa, deshabilitar el botón de "Cerrar Caja"
                if (data.jornadaActiva) {
                    document.getElementById('btnCerrarCaja').disabled = true;
                    document.getElementById('btnCerrarCaja').textContent = 'La jornada está activa, no se puede cerrar la caja';
                } else {
                    document.getElementById('btnCerrarCaja').disabled = false;
                    document.getElementById('btnCerrarCaja').textContent = 'Cerrar Caja';
                }

                // Calcular la diferencia de caja cuando el usuario ingresa un valor en efectivoCaja
                document.getElementById('efectivoCaja').addEventListener('input', function () {
                    const efectivoCaja = parseInt(this.value) || 0; // Convertir a entero o 0 si está vacío
                    const diferencia = montoCajaChica - efectivoCaja;
                    document.getElementById('diferenciaCaja').textContent = `Diferencia: $${diferencia}`;
                });
            })
            .catch((error) => console.error('Error al cargar los datos de gestión de caja:', error));
    }

    // Función para manejar el cierre de caja
    document.getElementById('btnCerrarCaja').addEventListener('click', function () {
        const confirmacion = confirm('¿Estás seguro de que deseas cerrar la caja?');

        if (confirmacion) {
            cerrarCaja();
        }
    });

    // Función para hacer el cierre de caja
    function cerrarCaja() {
        const efectivoCaja = parseFloat(document.getElementById('efectivoCaja').value) || 0;
    
        // Validar que el valor del efectivoCaja sea correcto
        if (isNaN(efectivoCaja) || efectivoCaja < 0) {
            alert('Por favor, ingrese un monto válido en el campo de efectivo.');
            return;
        }
    
        // Enviar los datos al backend
        fetch('/cerrar-caja', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                efectivoEnCaja: efectivoCaja
            })
        })
        .then(response => {
            // Validar si la respuesta del servidor es correcta
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Error del servidor: ${response.status} ${response.statusText} - ${text}`);
                });
            }
            return response.json(); // Si la respuesta es correcta, procesar el JSON
        })
        .then(data => {
            if (data.message) {
                alert(data.message); // Mostrar el mensaje del backend
            } else {
                alert('Caja cerrada correctamente');
            }
            window.location.href = '../html/menuprin.html'; // Redirigir al menú principal
        })
        .catch(error => {
            console.error('Error al cerrar la caja:', error);
            alert('Hubo un problema al cerrar la caja. Revisa la consola para más detalles.');
        });
    }

    // Manejar el botón "Volver"
    document.getElementById('btnVolver').addEventListener('click', function () {
        window.history.back();  // Volver a la página anterior
    });

    // Manejar el botón "Menú Principal"
    document.getElementById('btnMenuPrincipal').addEventListener('click', function () {
        window.location.href = '../html/menuprin.html';  // Redirigir al menú principal
    });
});

// Evento para manejar la selección de la fecha y cargar las jornadas
document.getElementById("formSeleccionFecha").addEventListener("submit", async function (event) {
    event.preventDefault();

    const fecha = document.getElementById("fecha").value;
    if (!fecha) {
        alert("Seleccione una fecha válida.");
        return;
    }

    try {
        const response = await fetch(`/movimientos-por-fecha?fecha=${fecha}`);
        if (!response.ok) {
            throw new Error("No hay jornadas para esta fecha.");
        }

        const data = await response.json();
        const jornadaSelect = document.getElementById("jornada");

        // Limpiar opciones previas
        jornadaSelect.innerHTML = "";

        if (data.jornadas.length === 0) {
            alert("No hay jornadas disponibles para la fecha seleccionada.");
            return;
        }

        // Agregar opciones al select
        data.jornadas.forEach(jornada => {
            const option = document.createElement("option");
            option.value = jornada.JornadaID;
            option.textContent = `Jornada ${jornada.JornadaID} - ${jornada.FechaInicio}`;
            jornadaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error al obtener las jornadas:", error);
        alert("Error al cargar las jornadas.");
    }
});



// Evento para manejar la selección de la jornada y mostrar los movimientos
document.getElementById("mostrarMovimientos").addEventListener("click", async function () {
    const jornadaID = document.getElementById("jornada").value;
    if (!jornadaID) {
        alert("Seleccione una jornada válida.");
        return;
    }

    fetch(`/movimientos-jornada?jornadaID=${jornadaID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al obtener los movimientos.");
            }
            return response.json();
        })
        .then(data => {
            const entradaLista = document.getElementById("entradaLista");
            const salidaLista = document.getElementById("salidaLista");

            // Limpiar listas anteriores
            entradaLista.innerHTML = "";
            salidaLista.innerHTML = "";

            // Cargar movimientos de entrada
            if (data.movimientosEntrada.length > 0) {
                data.movimientosEntrada.forEach(movimiento => {
                    const listItem = document.createElement("li");
                    listItem.textContent = ` Monto: $${movimiento.Monto}, Motivo: ${movimiento.Motivo}`;
                    entradaLista.appendChild(listItem);
                });
            } else {
                entradaLista.innerHTML = "<li>No hay registros en la fecha seleccionada.</li>";
            }

            // Cargar movimientos de salida
            if (data.movimientosSalida.length > 0) {
                data.movimientosSalida.forEach(movimiento => {
                    const listItem = document.createElement("li");
                    listItem.textContent = `Monto: $${movimiento.Monto}, Motivo: ${movimiento.Motivo}`;
                    salidaLista.appendChild(listItem);
                });
            } else {
                salidaLista.innerHTML = "<li>No hay registros en la fecha seleccionada.</li>";
            }
        })
        .catch(error => {
            console.error("Error al obtener los movimientos:", error);
            alert("Error al cargar los movimientos.");
        });
});

