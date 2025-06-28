        document.addEventListener("DOMContentLoaded", () => {
            fetch("/stock-productos")
                .then(response => response.json())
                .then(data => {
                    const stockTabla = document.getElementById("stockTabla");
                    stockTabla.innerHTML = ""; // Limpiar contenido previo

                    if (data.length > 0) {
                        data.forEach(producto => {
                            const row = document.createElement("tr");
                            row.innerHTML = `
                                <td>${producto.ProductoID}</td>
                                <td>${producto.Nombre}</td>
                                <td>${producto.Stock}</td>
                            `;
                            stockTabla.appendChild(row);
                        });
                    } else {
                        stockTabla.innerHTML = "<tr><td colspan='3'>No hay productos en stock.</td></tr>";
                    }
                })
                .catch(error => {
                    console.error("Error al obtener stock:", error);
                    stockTabla.innerHTML = "<tr><td colspan='3'>Error al cargar los datos.</td></tr>";
                });
        });

        function imprimirStock() {
            window.print();
            // Redirigir automáticamente después de imprimir
            setTimeout(() => {
                window.location.href = "../html/menuprin.html"; // Cambiar esta URL al que corresponda a tu menú principal
            }, 1000); // Espera 1 segundo antes de redirigir
        }
        
        function guardarStock() {
            let contenido = "ID,Nombre del Producto,Cantidad Disponible\n";
            document.querySelectorAll("#stockTabla tr").forEach(row => {
                const columnas = row.querySelectorAll("td");
                if (columnas.length > 0) {
                    contenido += `${columnas[0].textContent},${columnas[1].textContent},${columnas[2].textContent}\n`;
                }
            });
        
            const blob = new Blob(["\ufeff" + contenido], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "Stock_Productos.csv";
            link.click();
        
            // Redirigir automáticamente después de guardar
            setTimeout(() => {
                window.location.href = "../html/menuprin.html"; // Cambiar esta URL al que corresponda a tu menú principal
            }, 1000); // Espera 1 segundo antes de redirigir
        }