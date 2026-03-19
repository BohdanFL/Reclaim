// Firebase configuration
export const FIREBASE_CONFIG = {
  // Your web app's Firebase configuration
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  // Web client ID from Google Cloud Console OAuth 2.0 client IDs
  // Format: <project-number>-<hash>.apps.googleusercontent.com
  WEB_CLIENT_ID: process.env.FIREBASE_WEB_CLIENT_ID,
};

export const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL;

// Example of what your .env should contain:
/*
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_WEB_CLIENT_ID=your-project-number-hash.apps.googleusercontent.com
*/

  