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
        // Usar el select directamente (SIN jQuery)
        const selectPaciente = document.getElementById('pacienteGrafico');
        const pacienteId = selectPaciente ? selectPaciente.value : '';
        const fechaInicio = document.getElementById('fechaInicioGrafico').value;
        const fechaFin = document.getElementById('fechaFinGrafico').value;

        if (!pacienteId) {
            this.mostrarMensaje('Por favor selecciona un paciente', 'error');
            if (selectPaciente) selectPaciente.focus();
            return;
        }

        try {
            console.log('🔍 Buscando registros para paciente ID:', pacienteId);
            
            // Obtener TODOS los registros del paciente
            const snapshot = await db.collection('daily_records')
                .where('patient_id', '==', pacienteId)
                .get();
                
            this.registrosFiltrados = [];
            
            snapshot.forEach(doc => {
                const registro = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // Convertir fecha de cadena a objeto Date para filtrado
                let fechaRegistro;
                if (registro.date) {
                    if (registro.date.includes('T')) {
                        fechaRegistro = new Date(registro.date);
                    } else {
                        // Formato YYYY-MM-DD
                        const [year, month, day] = registro.date.split('-');
                        fechaRegistro = new Date(year, month - 1, day);
                    }
                }
                
                // Aplicar filtros de fecha
                let incluirRegistro = true;
                
                if (fechaInicio) {
                    const fechaInicioObj = new Date(fechaInicio);
                    if (fechaRegistro < fechaInicioObj) {
                        incluirRegistro = false;
                    }
                }
                
                if (fechaFin) {
                    const fechaFinObj = new Date(fechaFin);
                    fechaFinObj.setHours(23, 59, 59, 999); // Incluir todo el día
                    if (fechaRegistro > fechaFinObj) {
                        incluirRegistro = false;
                    }
                }
                
                if (incluirRegistro) {
                    // Guardar también la fecha como Date para ordenamiento
                    registro.fechaDate = fechaRegistro;
                    this.registrosFiltrados.push(registro);
                }
            });

            // Ordenar por fecha
            this.registrosFiltrados.sort((a, b) => a.fechaDate - b.fechaDate);

            console.log(`📊 ${this.registrosFiltrados.length} registros encontrados después del filtrado`);

				this.verificarEstructuraRegistros();

            if (this.registrosFiltrados.length === 0) {
                this.mostrarMensaje(
                    'No se encontraron registros para el paciente en el rango de fechas seleccionado',
                    'warning'
                );
                return;
            }

            // DESTRUIR GRÁFICOS ANTERIORES ANTES DE CREAR NUEVOS
            if (this.chartPresion) {
                this.chartPresion.destroy();
                this.chartPresion = null;
            }
            if (this.chartRiesgo) {
                this.chartRiesgo.destroy();
                this.chartRiesgo = null;
            }

            this.crearGraficoPresion();
            this.crearGraficoRiesgo();
            this.generarAnalisisIA();

            this.mostrarMensaje(
                `✅ Gráficos generados con ${this.registrosFiltrados.length} registros`,
                'success'
            );

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
        
        // FORMATO CORRECTO PARA FECHAS COMO CADENA
        const fechas = this.registrosFiltrados.map(reg => {
            if (!reg.date) return 'Fecha inválida';
            
            try {
                if (reg.date.includes('T')) {
                    // Formato ISO
                    return new Date(reg.date).toLocaleDateString('es-ES');
                } else {
                    // Formato YYYY-MM-DD
                    const [year, month, day] = reg.date.split('-');
                    return `${day}/${month}/${year}`;
                }
            } catch (e) {
                return reg.date; // Devolver la cadena original si hay error
            }
        });
        
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
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Presión Diastólica',
                        data: diastolicas,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1,
                        fill: true,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
    // Verificar nuevamente que Chart esté disponible
    if (typeof Chart === 'undefined') {
        console.error('Chart no disponible en crearGraficoRiesgo');
        return;
    }

    const ctx = document.getElementById('graficoRiesgo');
    if (!ctx) {
        console.error('No se encontró el canvas para el gráfico de riesgo');
        return;
    }

    // DIAGNÓSTICO DETALLADO - Ver qué datos tenemos
    console.log('🔍 Diagnóstico de datos para gráfico de riesgo:');
    console.log('Total registros:', this.registrosFiltrados.length);
    
    // Mostrar todos los risk_levels encontrados
    const riskLevelsEncontrados = [...new Set(this.registrosFiltrados.map(r => r.risk_level))];
    console.log('Risk levels encontrados:', riskLevelsEncontrados);
    
    // Mostrar ejemplo de registros
    if (this.registrosFiltrados.length > 0) {
        console.log('Ejemplo de registro:', this.registrosFiltrados[0]);
    }

    // Contar niveles de riesgo - MÁS FLEXIBLE
    const conteoRiesgo = {
        'Bajo': 0,
        'Moderado': 0,
        'Alto': 0,
        'Otros': 0, // Para valores inesperados
        'Sin dato': 0 // Para registros sin risk_level
    };

    this.registrosFiltrados.forEach(reg => {
        if (!reg.risk_level) {
            conteoRiesgo['Sin dato']++;
        } else if (conteoRiesgo.hasOwnProperty(reg.risk_level)) {
            conteoRiesgo[reg.risk_level]++;
        } else {
            // Valor inesperado, contar como "Otros"
            conteoRiesgo['Otros']++;
            console.warn('Risk level inesperado:', reg.risk_level);
        }
    });

    console.log('Conteo de riesgo:', conteoRiesgo);

    // Verificar que haya datos para mostrar (excluyendo "Sin dato" y "Otros")
    const datosValidos = conteoRiesgo.Bajo + conteoRiesgo.Moderado + conteoRiesgo.Alto;
    
    if (datosValidos === 0) {
        console.warn('No hay datos válidos de riesgo para mostrar');
        
        // Mostrar mensaje informativo en el canvas
        const ctx = document.getElementById('graficoRiesgo');
        if (ctx) {
            const ctx2d = ctx.getContext('2d');
            ctx2d.clearRect(0, 0, ctx.width, ctx.height);
            ctx2d.font = '16px Arial';
            ctx2d.fillStyle = '#6c757d';
            ctx2d.textAlign = 'center';
            ctx2d.fillText('No hay datos de riesgo disponibles', ctx.width / 2, ctx.height / 2);
            ctx2d.font = '12px Arial';
            ctx2d.fillText('Los registros no tienen niveles de riesgo definidos', ctx.width / 2, ctx.height / 2 + 20);
        }
        
        return;
    }

    // Preparar datos para el gráfico (solo los válidos)
    const labels = [];
    const data = [];
    const backgroundColors = [];

    if (conteoRiesgo.Bajo > 0) {
        labels.push('Bajo');
        data.push(conteoRiesgo.Bajo);
        backgroundColors.push('rgb(75, 192, 192)');
    }
    
    if (conteoRiesgo.Moderado > 0) {
        labels.push('Moderado');
        data.push(conteoRiesgo.Moderado);
        backgroundColors.push('rgb(255, 205, 86)');
    }
    
    if (conteoRiesgo.Alto > 0) {
        labels.push('Alto');
        data.push(conteoRiesgo.Alto);
        backgroundColors.push('rgb(255, 99, 132)');
    }

    // Si hay valores "Otros", incluirlos también
    if (conteoRiesgo.Otros > 0) {
        labels.push('Otros');
        data.push(conteoRiesgo.Otros);
        backgroundColors.push('rgb(153, 102, 255)');
    }

    this.chartRiesgo = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribución de Niveles de Riesgo'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    console.log('✅ Gráfico de riesgo creado correctamente con', datosValidos, 'registros válidos');
}

// Función para verificar la estructura de los registros
verificarEstructuraRegistros() {
    if (this.registrosFiltrados.length === 0) {
        console.log('No hay registros para verificar');
        return;
    }
    
    console.log('🔍 Verificación de estructura de registros:');
    const primerRegistro = this.registrosFiltrados[0];
    
    console.log('Campos disponibles:', Object.keys(primerRegistro));
    console.log('Ejemplo de risk_level:', primerRegistro.risk_level);
    console.log('Tipo de risk_level:', typeof primerRegistro.risk_level);
    
    // Verificar todos los risk_levels únicos
    const uniqueRiskLevels = [...new Set(this.registrosFiltrados.map(r => r.risk_level))];
    console.log('Todos los risk_levels únicos:', uniqueRiskLevels);
    
    // Contar registros sin risk_level
    const sinRiskLevel = this.registrosFiltrados.filter(r => !r.risk_level).length;
    console.log('Registros sin risk_level:', sinRiskLevel);
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
        if (array.length === 0) return 0;
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
        if (this.registrosFiltrados.length === 0) return '';
        
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
if (typeof window !== 'undefined') {
    window.GestorGraficos = GestorGraficos;
    console.log('✅ GestorGraficos disponible globalmente');
}