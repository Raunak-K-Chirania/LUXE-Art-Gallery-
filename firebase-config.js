import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyC2GWA87gFkxjPj7Gw1AzJCUkc2gql_uWE",
    authDomain: "luxe-art-gallery-72e3d.firebaseapp.com",
    projectId: "luxe-art-gallery-72e3d",
    storageBucket: "luxe-art-gallery-72e3d.firebasestorage.app",
    messagingSenderId: "392991258918",
    appId: "1:392991258918:web:691cec09483ce9d3e4a9e7",
    measurementId: "G-0JPVEQZPKL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
