document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const mensajeError = document.getElementById("mensaje");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const usuario = document.getElementById("usuario").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!usuario || !password) {
            mensajeError.textContent = "Por favor, complete todos los campos.";
            return;
        }

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                mensajeError.textContent = data.error;
                return;
            }

            // Guardar el rol en sessionStorage para su uso en otras páginas
            sessionStorage.setItem("rolUsuario", data.rol);

            // Redirigir al menú principal
            window.location.href = "./html/menuprin.html";
        } catch (error) {
            console.error("Error en la petición:", error);
            mensajeError.textContent = "Error de conexión con el servidor.";
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key === "I") || (event.ctrlKey && event.key === "U")) {
        event.preventDefault();
    }
});

// Desactivar el clic derecho
document.addEventListener("contextmenu", function(event) {
    event.preventDefault();
});

// Función para ir a pantalla completa
function goFullScreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { // Firefox
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari y Opera
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
        document.documentElement.msRequestFullscreen();
    }
}

// Llamar a la función para hacer la pantalla completa cuando la página cargue
window.onload = function() {
    goFullScreen();
};
