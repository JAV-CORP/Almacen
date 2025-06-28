// Seleccionar un día
document.getElementById("btnDia").addEventListener("click", function() {
    const fecha = document.getElementById("fechaDia").value;
    if (!fecha) {
        alert("Por favor selecciona una fecha.");
        return;
    }

    fetch(`/ventas-dia?fecha=${fecha}`)
        .then(response => response.json())
        .then(data => {
            const tabla = document.getElementById("tablaVentasDia").getElementsByTagName("tbody")[0];
            tabla.innerHTML = ""; // Limpiar la tabla antes de llenarla

            data.ventas.forEach(venta => {
                const row = tabla.insertRow();
                row.insertCell(0).textContent = venta.FechaVenta;
                row.insertCell(1).textContent = venta.VentaID;
                row.insertCell(2).textContent = venta.Nombre;
                row.insertCell(3).textContent = venta.Cantidad;
                row.insertCell(4).textContent = venta.Total;
            });

            document.getElementById("totalDia").textContent = data.total;
        })
        .catch(error => console.error("Error al obtener las ventas:", error));
});

// Seleccionar un mes y año
document.getElementById("btnMes").addEventListener("click", function() {
    const fecha = document.getElementById("fechaMes").value;
    if (!fecha) {
        alert("Por favor selecciona un mes.");
        return;
    }

    fetch(`/ventas-mes?fecha=${fecha}`)
        .then(response => response.json())
        .then(data => {
            const tabla = document.getElementById("tablaVentasMes").getElementsByTagName("tbody")[0];
            tabla.innerHTML = ""; // Limpiar la tabla antes de llenarla

            data.resumen.forEach(venta => {
                const row = tabla.insertRow();
                row.insertCell(0).textContent = venta.FechaVenta;
                row.insertCell(1).textContent = venta.TipoPago;
                row.insertCell(2).textContent = venta.TotalVenta;
            });

            document.getElementById("totalMes").textContent = data.total;
        })
        .catch(error => console.error("Error al obtener el resumen de ventas:", error));
});

// Exportar a PDF
function exportarPDF(tablaID, titulo) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(titulo, 10, 10);
    const tabla = document.getElementById(tablaID);
    let y = 20;
    
    for (let fila of tabla.rows) {
        let x = 10;
        for (let celda of fila.cells) {
            doc.text(celda.innerText, x, y);
            x += 40;
        }
        y += 10;
    }
    
    doc.save(`${titulo}.pdf`);
}

// Exportar a TXT
function exportarTXT(tablaID, nombreArchivo) {
    const tabla = document.getElementById(tablaID);
    let txt = "";
    const filas = tabla.rows;

    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].cells;
        for (let j = 0; j < celdas.length; j++) {
            txt += celdas[j].innerText + (j === celdas.length - 1 ? "" : "\t");
        }
        txt += "\n";
    }

    const enlace = document.createElement("a");
    enlace.href = "data:text/plain;charset=utf-8," + encodeURIComponent(txt);
    enlace.target = "_blank";
    enlace.download = nombreArchivo + ".txt";
    enlace.click();
}

// Exportar a CSV
function exportarCSV(tablaID, nombreArchivo) {
    const tabla = document.getElementById(tablaID);
    let csv = "";
    const filas = tabla.rows;

    for (let i = 0; i < filas.length; i++) {
        const celdas = filas[i].cells;
        for (let j = 0; j < celdas.length; j++) {
            csv += celdas[j].innerText + (j === celdas.length - 1 ? "" : ",");
        }
        csv += "\n";
    }

    const enlace = document.createElement("a");
    enlace.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    enlace.target = "_blank";
    enlace.download = nombreArchivo + ".csv";
    enlace.click();
}

// Imprimir tabla
function imprimirTabla(tablaID) {
    const tabla = document.getElementById(tablaID).outerHTML;
    const ventana = window.open("", "", "width=800,height=600");
    ventana.document.write("<html><head><title>Imprimir</title></head><body>");
    ventana.document.write(tabla);
    ventana.document.write("</body></html>");
    ventana.document.close();
    ventana.print();
}

// Función para resetear inputs y tablas
function resetearCampos() {
    // Limpiar inputs de fecha
    document.getElementById('fechaDia').value = '';
    document.getElementById('fechaMes').value = '';

    // Reiniciar tablas
    document.querySelector('#tablaVentasDia tbody').innerHTML = '';
    document.querySelector('#tablaVentasDia tfoot #totalDia').textContent = '';

    document.querySelector('#tablaVentasMes tbody').innerHTML = '';
    document.querySelector('#tablaVentasMes tfoot #totalMes').textContent = '';
}

// Ejecutar al cargar la página
window.onload = resetearCampos;