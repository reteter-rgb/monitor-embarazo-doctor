// Gestión de gráficos y análisis - VERSIÓN CORREGIDA
class GestorGraficos {
    constructor() {
        this.chartPresion = null;
        this.chartRiesgo = null;
        this.registrosFiltrados = [];
        
        this.inicializarEventos();
    }

    inicializarEventos() {
        const botonGenerar = document.getElementById('generarGrafico');
        if (botonGenerar) {
            botonGenerar.addEventListener('click', () => {
                this.generarGraficos();
            });
        }

        // Establecer fechas por defecto (últimos 30 días)
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);

        const fechaInicioInput = document.getElementById('fechaInicioGrafico');
        const fechaFinInput = document.getElementById('fechaFinGrafico');
        
        if (fechaInicioInput) fechaInicioInput.value = fechaInicio.toISOString().split('T')[0];
        if (fechaFinInput) fechaFinInput.value = fechaFin.toISOString().split('T')[0];
    }

    async generarGraficos() {
        const pacienteId = document.getElementById('pacienteGrafico').value;
        const fechaInicio = document.getElementById('fechaInicioGrafico').value;
        const fechaFin = document.getElementById('fechaFinGrafico').value;

        if (!pacienteId) {
            this.mostrarMensaje('Por favor selecciona un paciente', 'error');
            return;
        }

        try {
            // Obtener registros filtrados
            let query = db.collection('daily_records')
                .where('patient_id', '==', pacienteId)
                .orderBy('date', 'asc');

            if (fechaInicio) {
                query = query.where('date', '>=', fechaInicio);
            }
            if (fechaFin) {
                query = query.where('date', '<=', fechaFin);
            }

            const snapshot = await query.get();
            this.registrosFiltrados = [];
            
            snapshot.forEach(doc => {
                this.registrosFiltrados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            if (this.registrosFiltrados.length === 0) {
                this.mostrarMensaje('No se encontraron registros para el paciente en el rango de fechas seleccionado', 'warning');
                return;
            }

            this.crearGraficoPresion();
            this.crearGraficoRiesgo();
            this.generarAnalisisIA();

        } catch (error) {
            console.error('Error al generar gráficos:', error);
            this.mostrarMensaje('Error al generar gráficos: ' + error.message, 'error');
        }
    }

    crearGraficoPresion() {
        const ctx = document.getElementById('graficoPresion');
        if (!ctx) {
            console.error('No se encontró el canvas para el gráfico de presión');
            return;
        }
        
        // Destruir gráfico anterior si existe
        if (this.chartPresion) {
            this.chartPresion.destroy();
        }

        const fechas = this.registrosFiltrados.map(reg => 
            new Date(reg.date).toLocaleDateString()
        );
        const sistolicas = this.registrosFiltrados.map(reg => reg.systolic);
        const diastolicas = this.registrosFiltrados.map(reg => reg.diastolic);

        this.chartPresion = new Chart(ctx, {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [
                    {
                        label: 'Presión Sistólica',
                        data: sistolicas,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Presión Diastólica',
                        data: diastolicas,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Evolución de la Presión Arterial'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Presión (mmHg)'
                        },
                        suggestedMin: Math.min(...sistolicas, ...diastolicas) - 10,
                        suggestedMax: Math.max(...sistolicas, ...diastolicas) + 10
                    }
                }
            }
        });
    }

    crearGraficoRiesgo() {
        const ctx = document.getElementById('graficoRiesgo');
        if (!ctx) {
            console.error('No se encontró el canvas para el gráfico de riesgo');
            return;
        }
        
        // Destruir gráfico anterior si existe
        if (this.chartRiesgo) {
            this.chartRiesgo.destroy();
        }

        // Contar niveles de riesgo
        const conteoRiesgo = {
            'Bajo': 0,
            'Moderado': 0,
            'Alto': 0
        };

        this.registrosFiltrados.forEach(reg => {
            if (conteoRiesgo.hasOwnProperty(reg.risk_level)) {
                conteoRiesgo[reg.risk_level]++;
            }
        });

        this.chartRiesgo = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Bajo', 'Moderado', 'Alto'],
                datasets: [{
                    data: [conteoRiesgo.Bajo, conteoRiesgo.Moderado, conteoRiesgo.Alto],
                    backgroundColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 205, 86)',
                        'rgb(255, 99, 132)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Niveles de Riesgo'
                    }
                }
            }
        });
    }

    generarAnalisisIA() {
        const analisisDiv = document.getElementById('analisisIA');
        if (!analisisDiv) return;
        
        if (this.registrosFiltrados.length === 0) {
            analisisDiv.innerHTML = '<p>No hay datos suficientes para el análisis.</p>';
            return;
        }

        // Análisis básico de los datos
        const ultimoRegistro = this.registrosFiltrados[this.registrosFiltrados.length - 1];
        const promedioSistolica = this.calcularPromedio(this.registrosFiltrados.map(r => r.systolic));
        const promedioDiastolica = this.calcularPromedio(this.registrosFiltrados.map(r => r.diastolic));
        const tendencia = this.analizarTendencia();
        const alertas = this.generarAlertas();

        let analisisHTML = `
            <h6><i class="fas fa-chart-line me-2"></i>Análisis del Paciente</h6>
            <div class="row mt-3">
                <div class="col-md-6">
                    <p><strong>Última medición:</strong> ${ultimoRegistro.systolic}/${ultimoRegistro.diastolic} mmHg</p>
                    <p><strong>Promedio:</strong> ${promedioSistolica.toFixed(1)}/${promedioDiastolica.toFixed(1)} mmHg</p>
                    <p><strong>Tendencia:</strong> ${tendencia}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Total de registros:</strong> ${this.registrosFiltrados.length}</p>
                    <p><strong>Período analizado:</strong> ${this.registrosFiltrados.length} días</p>
                    ${alertas}
                </div>
            </div>
        `;

        analisisDiv.innerHTML = analisisHTML;
    }

    calcularPromedio(array) {
        return array.reduce((a, b) => a + b, 0) / array.length;
    }

    analizarTendencia() {
        if (this.registrosFiltrados.length < 2) return 'Datos insuficientes';
        
        const primeros = this.registrosFiltrados.slice(0, 3);
        const ultimos = this.registrosFiltrados.slice(-3);
        
        const promPrimerosSist = this.calcularPromedio(primeros.map(r => r.systolic));
        const promUltimosSist = this.calcularPromedio(ultimos.map(r => r.systolic));
        
        if (promUltimosSist > promPrimerosSist + 5) return '📈 Tendencia al alza';
        if (promUltimosSist < promPrimerosSist - 5) return '📉 Tendencia a la baja';
        return '➡️ Estable';
    }

    generarAlertas() {
        const ultimo = this.registrosFiltrados[this.registrosFiltrados.length - 1];
        let alertas = '';
        
        if (ultimo.systolic > 140 || ultimo.diastolic > 90) {
            alertas += '<p class="text-danger"><strong>⚠️ ALERTA:</strong> Presión elevada</p>';
        }
        if (ultimo.risk_level === 'Alto') {
            alertas += '<p class="text-warning"><strong>🔴 ALTO RIESGO:</strong> Consultar médico</p>';
        }
        
        return alertas || '<p class="text-success">✅ Situación dentro de parámetros normales</p>';
    }

    mostrarMensaje(mensaje, tipo) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : 'info'} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const cardBody = document.querySelector('#graficos .card-body');
        if (cardBody) {
            cardBody.prepend(alertDiv);
        }
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Inicializar cuando esté listo
if (typeof db !== 'undefined') {
    window.gestorGraficos = new GestorGraficos();
} else {
    console.log('Esperando a que Firebase esté disponible para inicializar gráficos...');
}