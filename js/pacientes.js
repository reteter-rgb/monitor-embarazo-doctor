// Gestión de pacientes - VERSIÓN CORREGIDA
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
        console.log('Cargando pacientes desde Firebase...');
        
        try {
            const snapshot = await db.collection('patients').orderBy('created_at', 'desc').get();
            console.log('Pacientes encontrados:', snapshot.size);
            
            this.pacientes = [];
            snapshot.forEach(doc => {
                this.pacientes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.mostrarPacientes();
            this.actualizarSelectoresPacientes();
            
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            this.mostrarMensaje('Error al cargar pacientes: ' + error.message, 'error');
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
                select.innerHTML = selectorId === 'filtroPaciente' 
                    ? '<option value="">Todos los pacientes</option>'
                    : '<option value="">Seleccionar paciente</option>';
                
                this.pacientes.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id;
                    option.textContent = paciente.name;
                    select.appendChild(option);
                });

                if (this.pacientes.find(p => p.id === valorActual)) {
                    select.value = valorActual;
                }
            }
        });
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