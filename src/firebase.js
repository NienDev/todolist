// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4a7U2j6ldg0tbF5xjH5ZD6xw8PnH2wOg",
  authDomain: "todo-list-5d98e.firebaseapp.com",
  databaseURL: "https://todo-list-5d98e-default-rtdb.firebaseio.com",
  projectId: "todo-list-5d98e",
  storageBucket: "todo-list-5d98e.appspot.com",
  messagingSenderId: "892792556937",
  appId: "1:892792556937:web:4eb0dd3e71339d12b2e558",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth();
