// Configuración REAL de Firebase - REEMPLAZA con tus datos
const firebaseConfig = {
  apiKey: "AIzaSyBz-OtwR7FjXXxniTujLMfXl-hmhpbixJw",
  authDomain: "com.example.monitorembarazo",
  projectId: "monitorembarazo",
  storageBucket: "monitorembarazo.firebasestorage.app",
  messagingSenderId: "898197830613",
  appId: "1:898197830613:android:e8bf61614b1d63dd4e9b5c"
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