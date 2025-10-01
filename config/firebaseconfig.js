// config/firebase-config.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
console.log('🎯 Iniciando configuración Firebase...');

// TUS DATOS REALES
const firebaseConfig = {
  apiKey: "AIzaSyBNeBD2TXOGcAAT7US8o0JJ8LrFE0TiNxI",
  authDomain: "monitorembarazo.firebaseapp.com",
  projectId: "monitorembarazo",
  storageBucket: "monitorembarazo.firebasestorage.app",
  messagingSenderId: "898197830613",
  appId: "1:898197830613:web:daa6a783c518b6e14e9b5c",
  measurementId: "G-9D3ENB2MQ3"
};

console.log('📋 Proyecto:', firebaseConfig.projectId);

// Inicialización DIRECTA y SIMPLE
try {
    console.log('🔄 Verificando Firebase...');
    
    // Verificar que los SDKs estén cargados
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase App SDK no cargado');
    }
    if (typeof firebase.firestore === 'undefined') {
        throw new Error('Firestore SDK no cargado');
    }
    
    console.log('✅ SDKs de Firebase cargados correctamente');
    
    // Inicializar Firebase
    let app;
    if (firebase.apps.length === 0) {
        console.log('🚀 Inicializando Firebase...');
        app = firebase.initializeApp(firebaseConfig);
    } else {
        console.log('ℹ️ Usando instancia existente de Firebase');
        app = firebase.app();
    }
    
    // Inicializar Firestore
    console.log('💾 Inicializando Firestore...');
    window.db = firebase.firestore();
    
    // Configuración básica
    window.db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    console.log('✅ Firebase y Firestore inicializados correctamente');
    console.log('✅ Variable "db" definida correctamente');
    
    // Probar conexión
    testConexion();
    
} catch (error) {
    console.error('❌ ERROR en firebase-config.js:', error);
    console.error('Mensaje:', error.message);
    
    // Crear db como objeto vacío para evitar errores
    window.db = {
        collection: () => { 
            console.error('Firebase no disponible');
            return {
                get: () => Promise.reject('Firebase no disponible'),
                add: () => Promise.reject('Firebase no disponible'),
                doc: () => ({ delete: () => Promise.reject('Firebase no disponible') })
            };
        }
    };
}

// Función para probar conexión
function testConexion() {
    if (window.db && typeof window.db.collection === 'function') {
        console.log('🔍 Probando conexión con Firestore...');
        window.db.collection('test').limit(1).get()
            .then(() => {
                console.log('✅ Conexión con Firestore: EXITOSA');
            })
            .catch(error => {
                console.error('❌ Conexión con Firestore falló:', error.message);
                console.log('💡 Posibles causas:');
                console.log('   - Reglas de Firestore muy restrictivas');
                console.log('   - Dominio no autorizado en Firebase Auth');
                console.log('   - Problema de red');
            });
    }
}

console.log('🏁 firebase-config.js completado');