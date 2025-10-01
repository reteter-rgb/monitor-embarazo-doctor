// Gestión de pacientes
class GestorPacientes {
    constructor() {
        console.log('👤 GestorPacientes inicializado');
        this.pacientes = [];
        this.formularioInicializado = false; // ← NUEVO: control de inicialización
        
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
    
    async agregarPaciente() {
        const nombre = document.getElementById('nombre').value;
        const email = document.getElementById('email').value;
        const edad = parseInt(document.getElementById('edad').value);
        const telefono = document.getElementById('telefono').value;

        try {
            const paciente = {
                name: nombre,
                email: email,
                age: edad,
                phone: telefono,
                created_at: new Date().toISOString()
            };

            await db.collection('patients').add(paciente);
            
            // Limpiar formulario
            document.getElementById('formPaciente').reset();
            
            // Recargar lista
            this.cargarPacientes();
            
            // Mostrar mensaje de éxito
            this.mostrarMensaje('Paciente agregado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al agregar paciente:', error);
            this.mostrarMensaje('Error al agregar paciente', 'error');
        }
    }

    async cargarPacientes() {
        try {
            const snapshot = await db.collection('patients').orderBy('created_at', 'desc').get();
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
        }
    }

    mostrarPacientes() {
        const tbody = document.getElementById('listaPacientes');
        tbody.innerHTML = '';

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
        const selectores = [
            'filtroPaciente',
            'pacienteRegistro', 
            'pacienteGrafico'
        ];

        selectores.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            if (select) {
                // Mantener la opción actual seleccionada
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

                // Restaurar selección anterior si existe
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
                this.cargarPacientes();
                this.mostrarMensaje('Paciente eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar paciente:', error);
                this.mostrarMensaje('Error al eliminar paciente', 'error');
            }
        }
    }

    mostrarMensaje(mensaje, tipo) {
        // Crear toast de Bootstrap
        const toastContainer = document.createElement('div');
        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white bg-${tipo === 'success' ? 'success' : 'danger'} border-0 show" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${mensaje}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            toastContainer.remove();
        }, 3000);
    }
}

// Inicializar gestor de pacientes
const gestorPacientes = new GestorPacientes();