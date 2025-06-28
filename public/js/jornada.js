document.addEventListener('DOMContentLoaded', async function () {
    const form = document.getElementById('iniciarJornadaForm');
    const cajaChicaInput = document.getElementById('montoCaja');

    // Verificar si hay una jornada activa al cargar la página
    try {
        const response = await fetch('/verificar');
        const data = await response.json();

        if (data.jornadaActiva) {
            // Si hay jornada activa, redirigir directamente a venta.html
            window.location.href = '../html/venta.html';
        }
    } catch (error) {
        console.error('Error al verificar la jornada activa:', error);
        alert('Error al verificar la jornada activa.');
    }

    // Manejar el envío del formulario
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevenir el comportamiento por defecto del formulario

        const montoCaja = cajaChicaInput.value;

        if (!montoCaja || isNaN(montoCaja) || parseFloat(montoCaja) < 0) {
            alert('Por favor, ingresa un monto válido para la caja chica.');
            return;
        }

        try {
            const response = await fetch('/iniciar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ montoCaja }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirigir a venta.html si la jornada se inicia correctamente
                window.location.href = '../html/venta.html';
            } else {
                alert(data.message || 'Error al iniciar la jornada. Intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error al iniciar la jornada:', error);
            alert('Hubo un error al procesar tu solicitud.');
        }
    });
});
