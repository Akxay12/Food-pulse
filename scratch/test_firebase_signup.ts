import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Load .env
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('---------------------------------------------------------');
console.log('Testing Real Firebase Connection:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('API Key:', firebaseConfig.apiKey?.substring(0, 10) + '...');
console.log('---------------------------------------------------------');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runTest() {
  const timestamp = Date.now();
  const testEmail = `firebase-test-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = `Test User ${timestamp}`;

  console.log(`\nAttempting signup for: ${testEmail}`);

  try {
    // 1. Create user in Firebase Auth
    console.log('[Step 1] Calling createUserWithEmailAndPassword...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ Firebase Authentication Succeeded!');
    console.log('   - User UID:', user.uid);
    console.log('   - Email:', user.email);
    console.log('   - Email Verified:', user.emailVerified);

    // 2. Update display name
    console.log('\n[Step 2] Updating user profile displayName...');
    await updateProfile(user, { displayName: testName });
    console.log('✅ Display name updated to:', testName);

    // 3. Write user profile document to Cloud Firestore
    console.log('\n[Step 3] Writing user document to Firestore: users/' + user.uid);
    const profileData = {
      uid: user.uid,
      name: testName,
      email: testEmail,
      phone: '',
      role: 'user',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
      reviewsCount: 0
    };

    await setDoc(doc(db, 'users', user.uid), profileData);
    console.log('✅ Firestore setDoc succeeded!');

    // 4. Verify document exists in Firestore
    console.log('\n[Step 4] Verifying document in Firestore: users/' + user.uid);
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    if (docSnap.exists()) {
      console.log('✅ Firestore document verified successfully:');
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.error('❌ Document does not exist in Firestore!');
    }

    console.log('\n=========================================================');
    console.log('🎉 RESULT: SUCCESS');
    console.log('   Real Firebase Auth UID:', user.uid);
    console.log('   Real Firestore Path: users/' + user.uid);
    console.log('=========================================================');
  } catch (error: any) {
    console.error('\n❌ FIREBASE SIGNUP ERROR:');
    console.error('   Code:', error.code || 'NO_CODE');
    console.error('   Message:', error.message);
    if (error.customData) {
      console.error('   Custom Data:', error.customData);
    }
  }
}

runTest();
