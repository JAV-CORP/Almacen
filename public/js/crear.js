document.addEventListener('DOMContentLoaded', function () {
    cargarGrupos();
    actualizarGrupos();
});

// Cargar grupos en los menús desplegables
function cargarGrupos() {
    fetch('/obtener-grupos', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            const grupoSelect = document.getElementById('grupoSelect');
            const grupoProductoSelect = document.getElementById('grupoProductoSelect');

            // Limpiar opciones previas
            grupoSelect.innerHTML = '<option value="">Selecciona un grupo</option>';
            grupoProductoSelect.innerHTML = '<option value="">Selecciona un grupo</option>';

            // Agregar nuevas opciones
            data.grupos.forEach(grupo => {
                const option = document.createElement('option');
                option.value = grupo.Nombre; // Usar el nombre del grupo
                option.textContent = grupo.Nombre; // Mostrar el nombre del grupo
                grupoSelect.appendChild(option);
                grupoProductoSelect.appendChild(option.cloneNode(true)); // Clonar para ambos select
            });
        })
        .catch(error => {
            console.error('Error al cargar los grupos:', error);
        });
}

// Crear Grupo
function crearGrupo() {
    const nombreGrupo = document.getElementById('grupoNombre').value.trim();
    if (!nombreGrupo) {
        document.getElementById('mensajeGrupo').innerHTML = "Por favor ingresa un nombre de grupo.";
        return;
    }

    fetch('/crear-grupo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombreGrupo })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Limpiar el campo de entrada y mostrar mensaje de éxito
                document.getElementById('grupoNombre').value = '';
                document.getElementById('mensajeGrupo').innerHTML = "Grupo creado con éxito.";
                cargarGrupos();
            } else {
                // Mostrar mensaje de que el grupo ya existe
                document.getElementById('mensajeGrupo').innerHTML = data.message;
            }
        })
        .catch(error => {
            console.error('Error al crear grupo:', error);
            document.getElementById('mensajeGrupo').innerHTML = "Hubo un error al crear el grupo.";
        });
}

// Crear SubGrupo
function crearSubGrupo() {
    const grupoSeleccionado = document.getElementById('grupoSelect').value;
    const nombreSubGrupo = document.getElementById('subGrupoNombre').value.trim();

    if (!grupoSeleccionado || !nombreSubGrupo) {
        document.getElementById('mensajeSubGrupo').innerHTML = "Selecciona un grupo y escribe un nombre para el subgrupo.";
        return;
    }

    fetch('/crear-subgrupo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grupoSeleccionado, nombreSubGrupo })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('subGrupoNombre').value = '';
                document.getElementById('mensajeSubGrupo').innerHTML = "SubGrupo creado con éxito.";
                actualizarSubGrupos();
            } else {
                document.getElementById('mensajeSubGrupo').innerHTML = data.message || "No se pudo crear el subgrupo.";
            }
        })
        .catch(error => {
            console.error('Error al crear subgrupo:', error);
            document.getElementById('mensajeSubGrupo').innerHTML = "Hubo un error al crear el subgrupo.";
        });
}

// Crear Producto
function crearProducto() {
    const grupoSeleccionado = document.getElementById('grupoProductoSelect').value;
    const subGrupoSeleccionado = document.getElementById('subGrupoProductoSelect').value;
    const nombreProducto = document.getElementById('productoNombre').value.trim();
    const unidad = document.getElementById('unidadSelect').value;
    const valor = parseFloat(document.getElementById('productoValor').value);
    const codBarra = document.getElementById('productoCodBarra').value.trim();

    // Validaciones
    if (!grupoSeleccionado || !subGrupoSeleccionado || !nombreProducto || !unidad || isNaN(valor) || !codBarra) {
        document.getElementById('mensajeProducto').innerHTML = "Completa todos los campos obligatorios.";
        return;
    }

    // Crear el objeto JSON con los valores
    const data = {
        grupo: grupoSeleccionado,
        subgrupo: subGrupoSeleccionado,
        nombre: nombreProducto,
        unidad: unidad,
        valor: valor,
        codBarra: codBarra,
    };

    // Enviar la solicitud POST con los datos del producto
    fetch('/crear-producto', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('productoNombre').value = '';
                document.getElementById('productoValor').value = '';
                document.getElementById('productoCodBarra').value = '';
                document.getElementById('mensajeProducto').innerHTML = "Producto creado con éxito.";
            } else {
                document.getElementById('mensajeProducto').innerHTML = data.message || "No se pudo crear el producto.";
            }
        })
        .catch(error => {
            console.error('Error al crear producto:', error);
            document.getElementById('mensajeProducto').innerHTML = "Hubo un error al crear el producto.";
        });
}

// Función para actualizar los grupos disponibles
async function actualizarGrupos() {
    try {
        const response = await fetch('/obtener-grupos');
        const data = await response.json();

        const grupoSelect = document.getElementById('grupoProductoSelect');
        grupoSelect.innerHTML = '<option value="">Selecciona un grupo</option>';

        data.grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.GrupoID; // Usar el GrupoID como valor
            option.textContent = grupo.Nombre; // Mostrar el Nombre del grupo
            grupoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los grupos:', error);
    }
}

// Función para actualizar los subgrupos disponibles al seleccionar un grupo
function actualizarSubGrupos() {
    const grupoSeleccionado = document.getElementById('grupoProductoSelect').value;

    if (!grupoSeleccionado) {
        const subGrupoSelect = document.getElementById('subGrupoProductoSelect');
        subGrupoSelect.innerHTML = '<option value="">Selecciona un subgrupo</option>';
        return;
    }

    // Consulta a la base de datos usando el nombre del grupo
    fetch(`/obtener-subgrupos/${encodeURIComponent(grupoSeleccionado)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener los subgrupos.');
            }
            return response.json();
        })
        .then(data => {
            const subGrupoSelect = document.getElementById('subGrupoProductoSelect');
            subGrupoSelect.innerHTML = '<option value="">Selecciona un subgrupo</option>';

            // Verifica si la respuesta contiene subgrupos
            if (data.subgrupos && data.subgrupos.length > 0) {
                data.subgrupos.forEach(subGrupo => {
                    const option = document.createElement('option');
                    option.value = subGrupo.SubgrupoID; // Usamos el SubgrupoID como valor
                    option.textContent = subGrupo.Nombre; // Mostramos el Nombre del subgrupo
                    subGrupoSelect.appendChild(option);
                });
            } else {
                subGrupoSelect.innerHTML = '<option value="">No hay subgrupos disponibles</option>';
            }
        })
        .catch(error => {
            console.error('Error al cargar los subgrupos:', error);
            document.getElementById('subGrupoProductoSelect').innerHTML = '<option value="">Error al cargar subgrupos</option>';
        });
}

// Función para actualizar la lista de productos disponibles
function actualizarProductos() {
    fetch('/obtener-productos')
        .then(response => response.json())
        .then(data => {
            // Actualizar cualquier lista de productos si es necesario
            console.log("Productos actualizados:", data);
        })
        .catch(error => console.error('Error al cargar los productos:', error));
}

function resetearCampos() {
    document.getElementById('grupoNombre').value = "";
    document.getElementById('grupoSelect').selectedIndex = 0;
    document.getElementById('subGrupoNombre').value = "";
    document.getElementById('grupoProductoSelect').selectedIndex = 0;
    document.getElementById('subGrupoProductoSelect').selectedIndex = 0;
    document.getElementById('productoNombre').value = "";
    document.getElementById('unidadSelect').selectedIndex = 0;
    document.getElementById('productoValor').value = "";
    document.getElementById('productoCodBarra').value = "";

    // Limpiar mensajes
    document.getElementById('mensajeGrupo').textContent = "";
    document.getElementById('mensajeSubGrupo').textContent = "";
    document.getElementById('mensajeProducto').textContent = "";
}

// Llamar la función cuando se carga la página
window.onload = resetearCampos;

// Agregar reset cuando se hace clic en los botones de crear
document.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", resetearCampos);
});
