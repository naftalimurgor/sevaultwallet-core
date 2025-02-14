/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as admin from 'firebase-admin'

// @ts-ignore
import * as serviceAccount from './admin.json'

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
})

// const firebaseConfig = {
//   apiKey: "AIzaSyBaXX-HPbOZJo-byTH9WEaCsEXPnd8WUf0",
//   authDomain: "exglos-api.firebaseapp.com",
//   projectId: "exglos-api",
//   storageBucket: "exglos-api.appspot.com",
//   messagingSenderId: "153049980031",
//   appId: "1:153049980031:web:b97e935c40942c05d6f34a",
//   measurementId: "G-YTKXRQX0PT"

// }

const db = admin.firestore()

export { admin, db }
