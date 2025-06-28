// Lógica para crear un usuario
document.getElementById('crearUsuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombreCrear').value;
    const contraseña = document.getElementById('contraseñaCrear').value;
    const rol = document.getElementById('rolCrear').value;

    // Enviar la solicitud para crear el usuario
    fetch('/crearUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, contraseña, rol }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        document.getElementById('crearUsuarioForm').reset();
    })
    .catch(error => console.error('Error al crear el usuario:', error));
});

// Lógica para modificar un usuario
document.getElementById('modificarUsuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombreModificar').value;
    const nuevaContraseña = document.getElementById('nuevaContraseñaModificar').value;
    const nuevoRol = document.getElementById('nuevoRolModificar').value;

    fetch('/modificarUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, nuevaContraseña, nuevoRol }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        document.getElementById('modificarUsuarioForm').reset();
    })
    .catch(error => console.error('Error al modificar el usuario:', error));
});

// Lógica para desbloquear un usuario
document.getElementById('desbloquearUsuarioForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombreDesbloquear').value;

    fetch('/desbloquearUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre }),
    })
    .then(response => response.json())
    .then(data => {
        alert(data.mensaje);
        document.getElementById('desbloquearUsuarioForm').reset();
        document.getElementById('coincidencias').innerHTML = ''; // Limpiar lista de coincidencias
    })
    .catch(error => console.error('Error al desbloquear el usuario:', error));
});

// Mostrar coincidencias mientras se escribe el nombre de usuario
document.getElementById('nombreDesbloquear').addEventListener('input', function(event) {
    const query = event.target.value;

    if (query.length > 2) {  // Iniciar búsqueda cuando el texto tiene más de 2 caracteres
        fetch(`/buscarUsuarios?query=${query}`)
            .then(response => response.json())
            .then(data => {
                const coincidenciasList = document.getElementById('coincidencias');
                coincidenciasList.innerHTML = ''; // Limpiar coincidencias previas

                if (data.usuarios && data.usuarios.length > 0) {
                    data.usuarios.forEach(usuario => {
                        const li = document.createElement('li');
                        li.textContent = usuario.Nombre;
                        li.onclick = function() {
                            document.getElementById('nombreDesbloquear').value = usuario.Nombre;
                            coincidenciasList.innerHTML = ''; // Limpiar coincidencias al seleccionar uno
                        };
                        coincidenciasList.appendChild(li);
                    });
                } else {
                    coincidenciasList.innerHTML = '<li>No se encontraron coincidencias</li>';
                }
            })
            .catch(error => console.error('Error al buscar usuarios:', error));
    } else {
        document.getElementById('coincidencias').innerHTML = ''; // Limpiar si no se escribe nada
    }
});
