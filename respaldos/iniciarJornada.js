document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('iniciarJornadaForm');
    
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el comportamiento por defecto de enviar el formulario

        // Obtener el monto ingresado
        const montoCaja = document.getElementById('montoCaja').value;

        // Enviar los datos al servidor con fetch (POST)
        fetch('/iniciar-jornada', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                montoCaja: montoCaja
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Si la operación fue exitosa, redirigir a venta.html
                window.location.href = '../html/venta.html';
            } else {
                alert('Error al iniciar la jornada. Intenta nuevamente.');
            }
        })
        .catch(error => {
            console.error('Error al hacer la solicitud:', error);
            alert('Hubo un error al procesar tu solicitud.');
        });
    });
});
