// js/app.js - VERSIÓN CON REINTENTOS AUTOMÁTICOS
console.log('✅ app.js cargado');

let intentosInicializacion = 0;
const maxIntentos = 10; // 10 segundos máximo

function inicializarAplicacion() {
    console.log(`🔄 Verificando Firebase (intento ${intentosInicializacion + 1})...`);
    
    // Verificar si db está disponible Y es funcional
    if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
        console.log('✅ Firebase está disponible - Inicializando módulos...');
        
        try {
            // Inicializar módulos
            window.gestorPacientes = new GestorPacientes();
            console.log('✅ Gestor de pacientes inicializado');
            
            window.gestorRegistros = new GestorRegistros();
            console.log('✅ Gestor de registros inicializado');
            
            window.gestorGraficos = new GestorGraficos();
            console.log('✅ Gestor de gráficos inicializado');
            
            console.log('🎉 ¡APLICACIÓN INICIALIZADA CORRECTAMENTE!');
            return; // ¡ÉXITO!
            
        } catch (error) {
            console.error('❌ Error inicializando módulos:', error);
            mostrarError('Error inicializando módulos: ' + error.message);
        }
        
    } else {
        // Firebase no está listo aún
        intentosInicializacion++;
        
        if (intentosInicializacion < maxIntentos) {
            console.log(`⏳ Firebase no listo, reintentando en 1s... (${intentosInicializacion}/${maxIntentos})`);
            setTimeout(inicializarAplicacion, 1000);
        } else {
            console.error('❌ TIMEOUT: Firebase no se inicializó después de ' + maxIntentos + ' intentos');
            mostrarErrorFirebase();
        }
    }
}

function mostrarErrorFirebase() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-warning alert-dismissible fade show m-3';
    errorDiv.innerHTML = `
        <h4>⚠️ Configuración en Progreso</h4>
        <p>La aplicación se está conectando con la base de datos. Esto puede tomar unos segundos.</p>
        <p><strong>Si el problema persiste:</strong></p>
        <ul>
            <li>Recarga la página</li>
            <li>Verifica tu conexión a internet</li>
            <li>Espera unos segundos y recarga</li>
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        <button type="button" class="btn btn-sm btn-outline-warning ms-2" onclick="location.reload()">
            🔄 Recargar Página
        </button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(errorDiv);
    }
}

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show m-3';
    errorDiv.innerHTML = `
        <strong>Error:</strong> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(errorDiv);
    }
}

// Iniciar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM cargado - Iniciando aplicación...');
        setTimeout(inicializarAplicacion, 500);
    });
} else {
    console.log('📄 DOM ya cargado - Iniciando aplicación...');
    setTimeout(inicializarAplicacion, 500);
}

// También proporcionar una función manual para reiniciar
window.reiniciarApp = function() {
    console.log('🔄 Reiniciando aplicación manualmente...');
    intentosInicializacion = 0;
    inicializarAplicacion();
};

console.log('🏁 app.js configurado - Esperando inicialización...');