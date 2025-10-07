// Gestión de pacientes - VERSIÓN CORREGIDA SIN JQUERY
class GestorPacientes {
    constructor() {
        console.log('👤 GestorPacientes inicializado');
        this.pacientes = [];
        this.formularioInicializado = false;
        
        this.inicializarEventos();
        this.cargarPacientes();
    }

    inicializarEventos() {
        // Evitar inicialización duplicada
        if (this.formularioInicializado) {
            console.log('⚠️ Eventos ya inicializados, omitiendo...');
            return;
        }
        
        const formPaciente = document.getElementById('formPaciente');
        if (formPaciente) {
            // Remover event listeners existentes primero
            formPaciente.replaceWith(formPaciente.cloneNode(true));
            
            // Volver a obtener el formulario fresco
            const formFresco = document.getElementById('formPaciente');
            formFresco.addEventListener('submit', (e) => {
                e.preventDefault();
                this.agregarPaciente();
            });
            
            this.formularioInicializado = true;
            console.log('✅ Eventos del formulario inicializados (sin duplicados)');
        }
    }

    async agregarPaciente() {
        console.log('🔵 Iniciando agregarPaciente...');
        
        // Verificar que db esté disponible
        if (typeof db === 'undefined') {
            this.mostrarMensaje('Error: Base de datos no disponible', 'error');
            return;
        }

        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const edad = parseInt(document.getElementById('edad').value);
        const telefono = document.getElementById('telefono').value;

        if (!nombre || !email || !edad || !telefono) {
            this.mostrarMensaje('Por favor completa todos los campos', 'error');
            return;
        }

        try {
            console.log('📝 Creando paciente...');
            const paciente = {
                name: nombre,
                email: email,
                age: edad,
                phone: telefono,
                created_at: new Date().toISOString()
            };

            console.log('🔥 Enviando a Firebase...', paciente);
            
            const docRef = await db.collection('patients').add(paciente);
            console.log('✅ Paciente agregado con ID:', docRef.id);
            
            document.getElementById('formPaciente').reset();
            await this.cargarPacientes();
            this.mostrarMensaje('✅ Paciente agregado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error completo:', error);
            this.mostrarMensaje(`❌ Error: ${error.message}`, 'error');
        }
    }

async cargarPacientes() {
    console.log('🔄 Cargando pacientes desde Firebase...');
    
    try {
        const snapshot = await db.collection('patients').orderBy('created_at', 'desc').get();
        console.log('📋 Pacientes encontrados:', snapshot.size);
        
        this.pacientes = [];
        snapshot.forEach(doc => {
            this.pacientes.push({
                id: doc.id,
                ...doc.data()
            });
        });

        this.mostrarPacientes();
        this.actualizarSelectoresPacientes();
        
        console.log('✅ Lista de pacientes actualizada correctamente');
        return this.pacientes; // Devolver la lista para then()
        
    } catch (error) {
        console.error('❌ Error al cargar pacientes:', error);
        this.mostrarMensaje('Error al cargar pacientes: ' + error.message, 'error');
        throw error; // Propagar el error
    }
}



    mostrarPacientes() {
        const tbody = document.getElementById('listaPacientes');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.pacientes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay pacientes registrados</td></tr>';
            return;
        }

        this.pacientes.forEach(paciente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${paciente.name}</td>
                <td>${paciente.email}</td>
                <td>${paciente.age}</td>
                <td>${paciente.phone}</td>
                <td>${new Date(paciente.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="gestorPacientes.eliminarPaciente('${paciente.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

   actualizarSelectoresPacientes() {
    const selectores = ['filtroPaciente', 'pacienteRegistro', 'pacienteGrafico'];
    
    selectores.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            const valorActual = select.value;
            const esMultiple = select.multiple;
            
            // Configurar contenido según el select
            if (selectorId === 'filtroPaciente') {
                select.innerHTML = '<option value="">Todos los pacientes</option>';
            } else {
                select.innerHTML = '<option value="">Seleccionar paciente</option>';
            }
            
            // Agregar pacientes
            this.pacientes.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = paciente.name;
                
                // Si es múltiple, mantener seleccionados
                if (esMultiple && Array.isArray(valorActual) && valorActual.includes(paciente.id)) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });

            // Restaurar selección anterior si existe (solo para selects simples)
            if (!esMultiple && this.pacientes.find(p => p.id === valorActual)) {
                select.value = valorActual;
            }
            
            // Configurar búsqueda nativa para pacienteGrafico
            if (selectorId === 'pacienteGrafico') {
                this.configurarBusquedaNativa(select);
            }
        }
    });
    
    console.log(`✅ Selectores actualizados con ${this.pacientes.length} pacientes`);
}

    configurarBusquedaNativa(select) {
        // Agregar evento de input para búsqueda nativa
        select.addEventListener('input', function() {
            const filter = this.value.toLowerCase();
            const options = this.options;
            
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                const text = option.textContent.toLowerCase();
                if (text.includes(filter)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            }
        });

        // Agregar placeholder visual
        select.setAttribute('data-placeholder', 'Escribe para buscar...');
    }

    async eliminarPaciente(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
            try {
                await db.collection('patients').doc(id).delete();
                await this.cargarPacientes();
                this.mostrarMensaje('Paciente eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                this.mostrarMensaje('Error al eliminar paciente: ' + error.message, 'error');
            }
        }
    }

    mostrarMensaje(mensaje, tipo) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
        alertDiv.style.zIndex = '9999';
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Inicializar cuando esté listo
console.log('👥 Clase GestorPacientes definida correctamente');

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.GestorPacientes = GestorPacientes;
    console.log('✅ GestorPacientes disponible globalmente');
}
// Actualizar selectores cuando se cambia a la pestaña de Gráficos - VERSIÓN MEJORADA
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Configurando observador de pestañas...');
    
    // Función para recargar pacientes en gráficos
    function recargarPacientesEnGraficos() {
        console.log('🔄 Solicitando recarga de pacientes para gráficos...');
        
        if (window.gestorPacientes) {
            // Forzar recarga desde Firebase
            window.gestorPacientes.cargarPacientes().then(() => {
                console.log('✅ Pacientes recargados exitosamente para gráficos');
            }).catch(error => {
                console.error('❌ Error recargando pacientes:', error);
            });
        } else {
            console.warn('⚠️ gestorPacientes no disponible aún');
            // Reintentar en 1 segundo
            setTimeout(recargarPacientesEnGraficos, 1000);
        }
    }

    // MÉTODO 1: Usar MutationObserver para detectar cambios de clase
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                // Verificar si la pestaña de gráficos se volvió activa
                if (target.id === 'graficos' && target.classList.contains('active') && target.classList.contains('show')) {
                    console.log('🎯 MutationObserver: Pestaña Gráficos activada');
                    setTimeout(recargarPacientesEnGraficos, 300);
                }
            }
        });
    });

    // Observar el contenedor de pestañas
    const tabContent = document.getElementById('mainTabsContent');
    if (tabContent) {
        observer.observe(tabContent, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class']
        });
        console.log('✅ MutationObserver configurado');
    }

    // MÉTODO 2: Eventos de Bootstrap (backup)
    const graficosTab = document.getElementById('graficos-tab');
    if (graficosTab) {
        graficosTab.addEventListener('click', function() {
            console.log('🎯 Click en pestaña Gráficos');
            // Pequeño delay para asegurar que la pestaña se active
            setTimeout(recargarPacientesEnGraficos, 500);
        });
    }

    // MÉTODO 3: Evento shown.bs.tab de Bootstrap
    const mainTabs = document.getElementById('mainTabs');
    if (mainTabs) {
        mainTabs.addEventListener('shown.bs.tab', function(event) {
            console.log('🎯 Bootstrap tab shown:', event.target.id);
            if (event.target.id === 'graficos-tab') {
                console.log('📊 Pestaña Gráficos mostrada - Recargando pacientes...');
                setTimeout(recargarPacientesEnGraficos, 400);
            }
        });
    }

    // MÉTODO 4: Verificar periódicamente si estamos en la pestaña de gráficos
    let ultimaPestaña = '';
    setInterval(() => {
        const graficosPane = document.getElementById('graficos');
        if (graficosPane && graficosPane.classList.contains('active') && graficosPane.classList.contains('show')) {
            if (ultimaPestaña !== 'graficos') {
                console.log('⏰ Check periódico: En pestaña Gráficos');
                ultimaPestaña = 'graficos';
                // Recargar solo si no se ha recargado recientemente
                recargarPacientesEnGraficos();
            }
        } else {
            ultimaPestaña = '';
        }
    }, 2000);

    console.log('🎯 Todos los métodos de recarga configurados');
});