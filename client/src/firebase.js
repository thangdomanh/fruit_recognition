import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyB4cm-u4LrX84Z1rRsBvz6wKNMuut7VDko",
    authDomain: "ttiot-6ea8c.firebaseapp.com",
    databaseURL: "https://ttiot-6ea8c-default-rtdb.firebaseio.com",
    projectId: "ttiot-6ea8c",
    storageBucket: "ttiot-6ea8c.appspot.com",
    messagingSenderId: "34000242765",
    appId: "1:34000242765:web:0194db02969037fc2df404",
    measurementId: "G-P7QYBTB4XY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };