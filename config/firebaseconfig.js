// config/firebase-config.js - CON TUS DATOS REALES PARA WEB
console.log('🚀 Iniciando configuración Firebase...');

// TUS DATOS REALES - CONFIGURACIÓN CORRECTA PARA WEB
const firebaseConfig = {
  apiKey: "AIzaSyBNeBD2TXOGcAAT7US8o0JJ8LrFE0TiNxI",
  authDomain: "monitorembarazo.firebaseapp.com",
  projectId: "monitorembarazo",
  storageBucket: "monitorembarazo.firebasestorage.app",
  messagingSenderId: "898197830613",
  appId: "1:898197830613:web:daa6a783c518b6e14e9b5c",
  measurementId: "G-9D3ENB2MQ3"
};

console.log('✅ Configuración Firebase cargada para proyecto:', firebaseConfig.projectId);

// Inicializar Firebase de forma segura
try {
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK no se cargó correctamente');
    }

    // Inicializar solo si no está inicializado
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('🔥 Firebase inicializado correctamente');
    } else {
        firebase.app(); // Usar la instancia existente
        console.log('🔥 Firebase ya estaba inicializado');
    }
    
    // Crear referencia global a Firestore
    window.db = firebase.firestore();
    console.log('💾 Firestore db inicializado');
    
    // Configurar settings para desarrollo
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    // Intentar habilitar persistencia offline
    db.enablePersistence()
        .then(() => {
            console.log('📱 Persistencia offline habilitada');
        })
        .catch(err => {
            console.log('⚠️ Persistencia no disponible:', err.message);
        });
        
} catch (error) {
    console.error('❌ Error crítico inicializando Firebase:', error);
    console.error('Detalles:', error.message);
    
    // Mostrar error al usuario
    if (typeof document !== 'undefined') {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger position-fixed top-0 start-0 w-100 m-0 rounded-0';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            <div class="container">
                <strong>Error de Firebase:</strong> ${error.message} 
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.prepend(errorDiv);
    }
}

// Función para verificar conexión
window.verificarFirebase = function() {
    console.group('🔍 Diagnóstico Firebase');
    console.log('Firebase apps:', firebase.apps.length);
    console.log('Firestore disponible:', typeof firebase.firestore !== 'undefined');
    console.log('Variable db:', typeof window.db !== 'undefined' ? '✅ Definida' : '❌ No definida');
    
    if (window.db) {
        // Probar conexión simple
        db.collection('patients').limit(1).get()
            .then(snapshot => {
                console.log('✅ Conexión Firestore: OK -', snapshot.size, 'pacientes encontrados');
            })
            .catch(error => {
                console.error('❌ Conexión Firestore falló:', error.message);
                console.log('💡 Consejo: Revisa las reglas de Firestore');
            });
    }
    console.groupEnd();
};

// Ejecutar verificación cuando esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.verificarFirebase);
} else {
    setTimeout(window.verificarFirebase, 1000);
}

console.log('🎯 Firebase config completado - Esperando inicialización...');