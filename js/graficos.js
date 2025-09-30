// Gestión de gráficos y análisis
class GestorGraficos {
    constructor() {
        this.chartPresion = null;
        this.chartRiesgo = null;
        this.registrosFiltrados = [];
        
        this.inicializarEventos();
    }

    inicializarEventos() {
        document.getElementById('generarGrafico').addEventListener('click', () => {
            this.generarGraficos();
        });

        // Establecer fechas por defecto (últimos 30 días)
        const fechaFin = new Date();
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 30);

        document.getElementById('fechaInicioGrafico').value = fechaInicio.toISOString().split('T')[0];
        document.getElementById('fechaFinGrafico').value = fechaFin.toISOString().split('T')[0];
    }

    async generarGraficos() {
        const pacienteId = document.getElementById('pacienteGrafico').value;
        const fechaInicio = document.getElementById('fechaInicioGrafico').value;
        const fechaFin = document.getElementById('fechaFinGrafico').value;

        if (!pacienteId) {
            alert('Por favor selecciona un paciente');
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
                alert('No se encontraron registros para el paciente en el rango de fechas seleccionado');
                return;
            }

            this.crearGraficoPresion();
            this.crearGraficoRiesgo();
            this.generarAnalisisIA();

        } catch (error) {
            console.error('Error al generar gráficos:', error);
            alert('Error al generar gráficos');
        }
    }

    crearGraficoPresion() {
        const ctx = document.getElementById('graficoPresion').getContext('2d');
        
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
        const ctx = document.getElementById('graficoRiesgo').getContext('2d');
        
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
            conteoRiesgo[reg.risk_level]++;
        });

        this.chartRiesgo = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Bajo', 'Moderado', 'Alto'],
                datasets: [{
                    data: [conteoRiesgo.Bajo, conteoRiesgo.Moderado, conteoRiesgo.Alto],
                    backgroundColor: [
                        'rgb