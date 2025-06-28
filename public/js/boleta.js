document.addEventListener('DOMContentLoaded', () => {
    const guardarFormatoButton = document.getElementById('guardarFormato');
    const nombreNegocio = document.getElementById('nombreNegocio');
    const rut = document.getElementById('rut');
    const direccion = document.getElementById('direccion');
    const telefono = document.getElementById('telefono');
    const correo = document.getElementById('correo');
    const imagenInput = document.getElementById('imagenInput');
    const imagenBoleta = document.getElementById('imagenBoleta');
    const mensaje = document.getElementById('mensaje');
    const fontSelectors = document.querySelectorAll('.fontSelect');
    const colorSelectors = document.querySelectorAll('.colorSelect');
    const editableElements = document.querySelectorAll('.editable');
    let imagenRuta = '';

    // Cambiar fuente y color de los campos editables
    fontSelectors.forEach(select => {
        select.addEventListener('change', (e) => {
            const selectedFont = e.target.value;
            editableElements.forEach(el => {
                el.style.fontFamily = selectedFont;
            });
        });
    });

    colorSelectors.forEach(input => {
        input.addEventListener('input', (e) => {
            const selectedColor = e.target.value;
            editableElements.forEach(el => {
                el.style.color = selectedColor;
            });
        });
    });

    
    // Mostrar la imagen seleccionada
    imagenInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagenBoleta.src = event.target.result;
                imagenBoleta.style.display = 'block';
            };
            reader.readAsDataURL(file);
            imagenRuta = file.name;  // Guardar el nombre de la imagen
        }
    });

    // Guardar el formato cuando se haga clic en el botón
    guardarFormatoButton.addEventListener('click', async () => {
        const formatoBoleta = {
            nombreNegocio: nombreNegocio.textContent,
            rut: rut.textContent,
            direccion: direccion.textContent,
            telefono: telefono.textContent,
            correo: correo.textContent,
            imagenRuta: imagenRuta,
            mensaje: mensaje.textContent
        };

        try {
            const response = await fetch('/guardar-formato', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formatoBoleta)
            });

            const data = await response.json();
            if (data.success) {
                alert('Formato de boleta guardado correctamente');
            } else {
                alert('Hubo un error al guardar el formato de boleta');
            }
        } catch (error) {
            console.error('Error al guardar formato:', error);
            alert('Hubo un error al guardar el formato de boleta');
        }
    });
});
