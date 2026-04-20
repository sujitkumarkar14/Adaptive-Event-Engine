/* eslint-disable no-undef */
/**
 * FCM Web — must live at site root. Replace config with your Firebase web app values
 * (same as Vite `VITE_FIREBASE_*` / Project settings).
 * @see https://firebase.google.com/docs/cloud-messaging/js/client
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSy_mock_key_update_later',
  authDomain: 'adaptive-entry.firebaseapp.com',
  projectId: 'adaptive-entry',
  storageBucket: 'adaptive-entry.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
});

firebase.messaging();
