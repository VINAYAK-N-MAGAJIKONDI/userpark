import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBxZDugXagBPvh5XJg6IkXFInmV6n__p9g",
  authDomain: "masscommerce-41024.firebaseapp.com",
  databaseURL: "https://masscommerce-41024-default-rtdb.firebaseio.com",
  projectId: "masscommerce-41024",
  storageBucket: "masscommerce-41024.appspot.com",
  messagingSenderId: "684846741835",
  appId: "1:684846741835:web:6622430e4d208ba97a90ce",
  measurementId: "G-GH0KKRJ1VF"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);