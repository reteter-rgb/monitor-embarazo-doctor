// Configuración REAL de Firebase - REEMPLAZA con tus datos
const firebaseConfig = {

  apiKey: "AIzaSyBNeBD2TXOGcAAT7US8o0JJ8LrFE0TiNxI",

  authDomain: "monitorembarazo.firebaseapp.com",

  projectId: "monitorembarazo",

  storageBucket: "monitorembarazo.firebasestorage.app",

  messagingSenderId: "898197830613",

  appId: "1:898197830613:web:daa6a783c518b6e14e9b5c",

  measurementId: "G-9D3ENB2MQ3"

};


// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a Firestore
const db = firebase.firestore();

// Habilitar persistencia offline (opcional pero recomendado)
db.enablePersistence()
  .catch((err) => {
    console.log("Error en persistencia: ", err);
  });