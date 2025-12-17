import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG!);

// console.log('serviceAccount is: ');
// console.log(serviceAccount);



if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: "classify-dcb76.firebasestorage.app",
    });
}

const bucket = admin.storage().bucket();
export { bucket };