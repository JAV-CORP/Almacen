document.addEventListener("DOMContentLoaded", function () {
    fetch("/obtenerRolUsuario")
        .then(response => response.json())
        .then(data => {
            if (data.rol) {
                document.getElementById("rolusuario").value = data.rol;
                controlarAccesos(data.rol);
            }
        })
        .catch(error => console.error("Error al obtener el rol del usuario:", error));
});

function controlarAccesos(rol) {
    if (rol === "cajero") {
        document.getElementById("estadisticasBtn").style.display = "none";
        document.getElementById("sistemaBtn").style.display = "none";
        document.getElementById("inventarioBtn").style.display = "none";
    } else if (rol === "encargado") {
    
    }
}


// Esperar a que el DOM se cargue completamente
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Verificar si hay una jornada activa con fecha diferente a la actual
        const response = await fetch('/verificarJornada');
        const data = await response.json();
        console.log(data.mensaje); // Muestra el mensaje en la consola

    } catch (error) {
        console.error('Error al verificar la jornada:', error);
    }

    // Obtener los botones por su ID
    const iniciarJornadaBtn = document.getElementById('iniciarJornadaBtn');
    const inventarioBtn = document.getElementById('inventarioBtn');
    const gestionCajaBtn = document.getElementById('gestionCajaBtn');
    const estadisticasBtn = document.getElementById('estadisticasBtn');
    const sistemaBtn = document.getElementById('sistemaBtn');

    // Manejar el clic del botón "Inventario"
    iniciarJornadaBtn.addEventListener('click', function() {
        // Redirigir a la página de inventario
        window.location.href = '../html/iniciarJornada.html';
    });


    // Manejar el clic del botón "Inventario"
    inventarioBtn.addEventListener('click', function() {
        // Redirigir a la página de inventario
        window.location.href = '../html/inventario.html';
    });

    gestionCajaBtn.addEventListener('click', function() {
        window.location.href = '../html/gestionCaja.html';  // Redirige al archivo correspondiente
    });


    // Manejar el clic del botón "estadisticas"
    estadisticasBtn.addEventListener('click', function() {
        // Redirigir a la página de estadisticas
        window.location.href = '../html/estadisticas.html';
    });


       // Manejar el clic del botón "Sistemas"
       sistemaBtn.addEventListener('click', function() {
        // Redirigir a la página de estadisticas
        window.location.href = '../html/menusistema.html';
    });

});

document.getElementById('cerrarSesionBtn').addEventListener('click', function() {
    // Confirmar si el usuario realmente quiere cerrar sesión
    const confirmacion = confirm("¿Estás seguro que deseas cerrar sesión?");
    
    if (confirmacion) {
        // Realizar la solicitud POST para cerrar la sesión
        fetch('/cerrarSesion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usuario: 'usuarioActivo' })  // Aquí debe ir el nombre del usuario activo
        })
        .then(response => response.json())
        .then(data => {
            console.log(data.mensaje);  // Mostrar mensaje en consola
            // Redirigir a la página de login
            window.location.href = './login.html';
        })
        .catch(error => {
            console.error('Error al cerrar sesión:', error);
            alert('Hubo un error al cerrar la sesión');
        });
    }
});

