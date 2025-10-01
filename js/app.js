// js/app.js - Controlador principal
console.log('✅ app.js cargado - Preparando inicialización...');

function inicializarAplicacion() {
    console.log('🎯 Inicializando aplicación Monitor Embarazo...');
    
    if (typeof db === 'undefined') {
        console.error('❌ ERROR: Firebase no está disponible (db is undefined)');
        mostrarErrorFirebase();
        return;
    }
    
    console.log('✅ Firebase está disponible - Inicializando módulos...');
    
    try {
        window.gestorPacientes = new GestorPacientes();
        console.log('✅ Gestor de pacientes inicializado');
        
        window.gestorRegistros = new GestorRegistros();
        console.log('✅ Gestor de registros inicializado');
        
        window.gestorGraficos = new GestorGraficos();
        console.log('✅ Gestor de gráficos inicializado');
        
        console.log('🎉 ¡TODOS LOS MÓDULOS INICIALIZADOS CORRECTAMENTE!');
        
    } catch (error) {
        console.error('❌ Error inicializando módulos:', error);
    }
}

function mostrarErrorFirebase() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show m-3';
    errorDiv.innerHTML = `
        <h4>❌ Error de Conexión</h4>
        <p>No se pudo conectar con la base de datos. Por favor:</p>
        <ul>
            <li>Recarga la página</li>
            <li>Verifica tu conexión a internet</li>
            <li>Si el problema persiste, contacta al administrador</li>
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.prepend(errorDiv);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarAplicacion, 500);
    });
} else {
    setTimeout(inicializarAplicacion, 500);
}