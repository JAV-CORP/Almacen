document.addEventListener("DOMContentLoaded", () => {
    const grupoSelect = document.getElementById("grupoSelect");
    const subgrupoSelect = document.getElementById("subgrupoSelect");
    const productosTable = document.getElementById("productosTable").querySelector("tbody");
    const productoSeleccionadoInput = document.getElementById("productoSeleccionado");
    const cantidadStockInput = document.getElementById("cantidadStock");
    const mensajeStock = document.getElementById("mensajeStock");
    const btnIngresarStock = document.getElementById("btnIngresarStock");

    // Cargar grupos
    async function cargarGrupos() {
        try {
            const response = await fetch("/obtener-grupos");
            const data = await response.json();
            grupoSelect.innerHTML = '<option value="">Selecciona un grupo</option>';
            data.grupos.forEach(grupo => {
                const option = document.createElement("option");
                option.value = grupo.GrupoID;
                option.textContent = grupo.Nombre;
                grupoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar grupos:", error);
        }
    }

    // Cargar subgrupos por grupo seleccionado
    async function cargarSubgrupos(grupoID) {
        try {
            const response = await fetch(`/obtener-subgrupos/${grupoID}`);
            const data = await response.json();
            subgrupoSelect.innerHTML = '<option value="">Selecciona un subgrupo</option>';
            data.subgrupos.forEach(subgrupo => {
                const option = document.createElement("option");
                option.value = subgrupo.SubgrupoID;
                option.textContent = subgrupo.Nombre;
                subgrupoSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar subgrupos:", error);
        }
    }

    // Cargar productos por subgrupo seleccionado
    async function cargarProductos(subgrupoID) {
        try {
            const response = await fetch(`/obtener-productos?subgrupoID=${subgrupoID}`);
            const data = await response.json();
            productosTable.innerHTML = "";
    
            if (data.productos.length === 0) {
                productosTable.innerHTML = "<tr><td colspan='5'>No hay productos en este subgrupo</td></tr>";
                return;
            }
    
            for (const producto of data.productos) {
                // Obtener stock disponible de cada producto
                const stockResponse = await fetch(`/obtener-stock/${producto.ProductoID}`);
                const stockData = await stockResponse.json();
                const stockDisponible = stockData.cantidadDisponible || 0;
    
                // Crear fila con la nueva columna de stock
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${producto.ProductoID}</td>
                    <td>${producto.Nombre}</td>
                    <td>${producto.UnidadMedida}</td>
                    <td>${producto.ValorUnidad}</td>
                    <td>${stockDisponible}</td> <!-- Nueva columna de stock -->
                `;
                row.addEventListener("click", () => {
                    productoSeleccionadoInput.value = producto.Nombre;
                });
                productosTable.appendChild(row);
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }
    

    // Registrar stock
    async function registrarStock() {
        const productoSeleccionado = productoSeleccionadoInput.value;
        const cantidadStock = cantidadStockInput.value;

        if (!productoSeleccionado || !cantidadStock) {
            mensajeStock.textContent = "Selecciona un producto e ingresa una cantidad válida.";
            return;
        }

        try {
            const response = await fetch("/registrar-stock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ productoSeleccionado, cantidadStock })
            });
            const data = await response.json();
            mensajeStock.textContent = data.message;
            cantidadStockInput.value = "";
        } catch (error) {
            console.error("Error al registrar stock:", error);
        }
    }

    // Eventos
    grupoSelect.addEventListener("change", () => {
        const grupoID = grupoSelect.value;
        if (grupoID) {
            cargarSubgrupos(grupoID);
        } else {
            subgrupoSelect.innerHTML = '<option value="">Selecciona un subgrupo</option>';
            productosTable.innerHTML = "<tr><td colspan='4'>Selecciona un subgrupo para ver los productos</td></tr>";
        }
    });

    subgrupoSelect.addEventListener("change", () => {
        const subgrupoID = subgrupoSelect.value;
        if (subgrupoID) {
            cargarProductos(subgrupoID);
        } else {
            productosTable.innerHTML = "<tr><td colspan='4'>Selecciona un subgrupo para ver los productos</td></tr>";
        }
    });

    btnIngresarStock.addEventListener("click", registrarStock);

    // Función para resetear inputs y selects
function resetearCampos() {
    document.querySelectorAll('input, select').forEach(element => {
        if (element.tagName === 'SELECT') {
            element.selectedIndex = 0; // Reiniciar selects
        } else {
            element.value = ''; // Limpiar inputs
        }
    });

    // Reiniciar mensaje de stock y producto seleccionado
    document.getElementById('productoSeleccionado').value = '';
    document.getElementById('mensajeStock').textContent = '';
    
    // Reiniciar la tabla de productos
    document.querySelector('#productosTable tbody').innerHTML = `
        <tr>
            <td colspan="4">Selecciona un subgrupo para ver los productos</td>
        </tr>
    `;
}

window.onload = resetearCampos;

    // Cargar los grupos al inicio
    cargarGrupos();
});
