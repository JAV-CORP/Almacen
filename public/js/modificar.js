document.addEventListener("DOMContentLoaded", () => {
    // Selectores de Grupos
    const grupoLista = document.getElementById("grupo-lista");
    const grupoNuevoNombre = document.getElementById("grupo-nuevo-nombre");
    const grupoModificarBtn = document.getElementById("grupo-modificar-btn");

    // Selectores de Subgrupos
    const subgrupoGrupoLista = document.getElementById("subgrupo-grupo-lista");
    const subgrupoLista = document.getElementById("subgrupo-lista");
    const subgrupoNuevoNombre = document.getElementById("subgrupo-nuevo-nombre");
    const subgrupoModificarBtn = document.getElementById("subgrupo-modificar-btn");

    // Selectores de Productos
    const productoGrupoLista = document.getElementById("producto-grupo-lista");
    const productoSubgrupoLista = document.getElementById("producto-subgrupo-lista");
    const productoLista = document.getElementById("producto-lista");
    const productoNuevoNombre = document.getElementById("producto-nuevo-nombre");
    const productoNuevoValor = document.getElementById("producto-nuevo-valor");
    const productoModificarBtn = document.getElementById("producto-modificar-btn");


    // Función para cargar Grupos
    async function cargarGrupos() {
        const response = await fetch("/obtener-grupos");
        const data = await response.json();
        const options = data.grupos.map(g => `<option value="${g.GrupoID}">${g.Nombre}</option>`).join("");
        grupoLista.innerHTML = `<option value="">Selecciona un grupo</option>${options}`;
        subgrupoGrupoLista.innerHTML = grupoLista.innerHTML;
        productoGrupoLista.innerHTML = grupoLista.innerHTML;
        document.getElementById('grupo-nuevo-nombre').value = '';
        document.getElementById('subgrupo-nuevo-nombre').value = '';
        document.getElementById('producto-nuevo-nombre').value = '';
        document.getElementById('producto-nuevo-valor').value = '';
       
    }

    // Función para cargar Subgrupos
    async function cargarSubgrupos(grupoID, lista) {
        if (!grupoID) {
            lista.innerHTML = `<option value="">Selecciona un subgrupo</option>`;
            return;
        }
        const response = await fetch(`/obtener-subgrupos/${grupoID}`);
        const data = await response.json();
        const options = data.subgrupos.map(s => `<option value="${s.SubgrupoID}">${s.Nombre}</option>`).join("");
        lista.innerHTML = `<option value="">Selecciona un subgrupo</option>${options}`;
    }

    // Función para cargar Productos
    async function cargarProductos(subgrupoID) {
        if (!subgrupoID) {
            productoLista.innerHTML = `<option value="">Selecciona un producto</option>`;
            return;
        }
        const response = await fetch(`/obtener-productos/${subgrupoID}`);
        const data = await response.json();
        const options = data.productos.map(p => `<option value="${p.ProductoID}">${p.Nombre}</option>`).join("");
        productoLista.innerHTML = `<option value="">Selecciona un producto</option>${options}`;
   
    }

    // Modificar Grupo
    grupoModificarBtn.addEventListener("click", async () => {
        const grupoID = grupoLista.value;
        const nuevoNombre = grupoNuevoNombre.value.trim();
        if (!grupoID || !nuevoNombre) {
            alert("Por favor selecciona un grupo y proporciona un nuevo nombre.");
            return;
        }
        const response = await fetch("/modificar-grupo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grupoID, nuevoNombre }),
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) 
            document.getElementById('grupo-nuevo-nombre').value = '';
            cargarGrupos();
    });

    // Modificar Subgrupo
    subgrupoModificarBtn.addEventListener("click", async () => {
        const grupoID = subgrupoGrupoLista.value;
        const subgrupoID = subgrupoLista.value;
        const nuevoNombre = subgrupoNuevoNombre.value.trim();
        if (!grupoID || !subgrupoID || !nuevoNombre) {
            alert("Por favor selecciona un subgrupo y proporciona un nuevo nombre.");
            return;
        }
        const response = await fetch("/modificar-subgrupo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subgrupoID, nuevoNombre }),
        });
        const result = await response.json();
        alert(result.message);
        if (result.success) cargarSubgrupos(grupoID, subgrupoLista);
    });

    // Modificar Producto
    productoModificarBtn.addEventListener("click", async () => {
        const productoID = productoLista.value;
        const nuevoNombre = productoNuevoNombre.value.trim();
        const nuevoValor = productoNuevoValor.value;
        if (!productoID || (!nuevoNombre && !nuevoValor)) {
            alert("Por favor selecciona un producto y proporciona datos para modificar.");
            return;
        }
        const response = await fetch("/modificar-producto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productoID, nuevoNombre, nuevoValor}),
        });
        const result = await response.json();
        alert(result.message);
    });

    // Listeners para cargar subgrupos y productos
    subgrupoGrupoLista.addEventListener("change", () => cargarSubgrupos(subgrupoGrupoLista.value, subgrupoLista));
    productoGrupoLista.addEventListener("change", () => cargarSubgrupos(productoGrupoLista.value, productoSubgrupoLista));
    productoSubgrupoLista.addEventListener("change", () => cargarProductos(productoSubgrupoLista.value));

    // Cargar datos iniciales
    cargarGrupos();


// Función para resetear los inputs de los formularios
function resetFormFields() {
    const forms = document.querySelectorAll('section');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'text' || input.type === 'number') {
                input.value = ''; // Resetear valores de input tipo texto o número
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0; // Resetear el valor de los selects
            }
        });
    });
}

// Llamar a la función al cargar la página
window.onload = resetFormFields;

// Llamar a la función cuando se haga clic en cualquier botón dentro del formulario
const buttons = document.querySelectorAll('button');
buttons.forEach(button => {
    button.addEventListener('click', resetFormFields);
});

});
