// Gestión de registros diarios
class GestorRegistros {
    constructor() {
        this.registros = [];
        this.filtros = {
            paciente: '',
            fechaInicio: '',
            fechaFin: ''
        };
        
        this.cargarRegistros();
        this.inicializarEventos();
    }

    inicializarEventos() {
        // Formulario de registro
        document.getElementById('formRegistro').addEventListener('submit', (e) => {
            e.preventDefault();
            this.agregarRegistro();
        });

        // Filtros
        document.getElementById('filtroPaciente').addEventListener('change', (e) => {
            this.filtros.paciente = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroFechaInicio').addEventListener('change', (e) => {
            this.filtros.fechaInicio = e.target.value;
            this.aplicarFiltros();
        });

        document.getElementById('filtroFechaFin').addEventListener('change', (e) => {
            this.filtros.fechaFin = e.target.value;
            this.aplicarFiltros();
        });

        // Establecer fecha actual por defecto
        document.getElementById('fechaRegistro').valueAsDate = new Date();
    }

    async agregarRegistro() {
        const pacienteId = document.getElementById('pacienteRegistro').value;
        const fecha = document.getElementById('fechaRegistro').value;
        const sistolica = parseInt(document.getElementById('sistolica').value);
        const diastolica = parseInt(document.getElementById('diastolica').value);
        const riesgo = document.getElementById('riesgo').value;
        const notas = document.getElementById('notas').value;

        try {
            // Obtener nombre del paciente
            const pacienteDoc = await db.collection('patients').doc(pacienteId).get();
            const pacienteNombre = pacienteDoc.data().name;

            const registro = {
                date: fecha,
                systolic: sistolica,
                diastolic: diastolica,
                notes: notas,
                patient_id: pacienteId,
                patient_name: pacienteNombre,
                risk_level: riesgo,
                record_id: this.generarIdUnico(),
                created_at: new Date().toISOString()
            };

            await db.collection('daily_records').add(registro);
            
            // Limpiar formulario
            document.getElementById('formRegistro').reset();
            document.getElementById('fechaRegistro').valueAsDate = new Date();
            
            // Recargar lista
            this.cargarRegistros();
            
            this.mostrarMensaje('Registro agregado correctamente', 'success');
            
        } catch (error) {
            console.error('Error al agregar registro:', error);
            this.mostrarMensaje('Error al agregar registro', 'error');
        }
    }

    generarIdUnico() {
        return 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async cargarRegistros() {
        try {
            const snapshot = await db.collection('daily_records').orderBy('date', 'desc').get();
            this.registros = [];
            
            snapshot.forEach(doc => {
                this.registros.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.aplicarFiltros();
            
        } catch (error) {
            console.error('Error al cargar registros:', error);
        }
    }

    aplicarFiltros() {
        let registrosFiltrados = [...this.registros];

        // Filtrar por paciente
        if (this.filtros.paciente) {
            registrosFiltrados = registrosFiltrados.filter(reg => 
                reg.patient_id === this.filtros.paciente
            );
        }

        // Filtrar por fecha inicio
        if (this.filtros.fechaInicio) {
            registrosFiltrados = registrosFiltrados.filter(reg => 
                reg.date >= this.filtros.fechaInicio
            );
        }

        // Filtrar por fecha fin
        if (this.filtros.fechaFin) {
            registrosFiltrados = registrosFiltrados.filter(reg => 
                reg.date <= this.filtros.fechaFin
            );
        }

        this.mostrarRegistros(registrosFiltrados);
    }

    mostrarRegistros(registros) {
        const tbody = document.getElementById('listaRegistros');
        tbody.innerHTML = '';

        if (registros.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" class="text-center">No se encontraron registros</td>`;
            tbody.appendChild(tr);
            return;
        }

        registros.forEach(registro => {
            const tr = document.createElement('tr');
            const claseRiesgo = `risk-${registro.risk_level.toLowerCase()}`;
            
            tr.innerHTML = `
                <td>${registro.patient_name}</td>
                <td>${new Date(registro.date).toLocaleDateString()}</td>
                <td>${registro.systolic}/${registro.diastolic}</td>
                <td><span class="badge ${claseRiesgo}">${registro.risk_level}</span></td>
                <td>${registro.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="gestorRegistros.eliminarRegistro('${registro.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    async eliminarRegistro(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            try {
                await db.collection('daily_records').doc(id).delete();
                this.cargarRegistros();
                this.mostrarMensaje('Registro eliminado correctamente', 'success');
            } catch (error) {
                console.error('Error al eliminar registro:', error);
                this.mostrarMensaje('Error al eliminar registro', 'error');
            }
        }
    }

    mostrarMensaje(mensaje, tipo) {
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
        
        setTimeout(() => {
            toastContainer.remove();
        }, 3000);
    }
}

// Inicializar gestor de registros
const gestorRegistros = new GestorRegistros();