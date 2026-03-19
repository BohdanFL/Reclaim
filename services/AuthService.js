import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { MMKV } from 'react-native-mmkv';
import { FIREBASE_CONFIG, FIREBASE_DB_URL } from '../config/firebaseConfig';
import FirebaseService from './FirebaseService';

const storage = new MMKV();
const USER_KEY = 'user_data';

let currentFirebaseUser = null;
let currentIdToken = null;

// Configure Google Sign-In with proper web client ID
GoogleSignin.configure({
  webClientId: FIREBASE_CONFIG.WEB_CLIENT_ID,
  offlineAccess: false,
});

// Listen for auth state changes
auth().onAuthStateChanged(async (user) => {
  if (user) {
    currentFirebaseUser = user;
    currentIdToken = await user.getIdToken();
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    storage.set(USER_KEY, JSON.stringify(userData));
    await syncUserProfile(user);
  } else {
    currentFirebaseUser = null;
    currentIdToken = null;
    storage.delete(USER_KEY);
  }
});

export const getAuthToken = async () => {
  if (currentFirebaseUser && currentIdToken) {
    return { idToken: currentIdToken, uid: currentFirebaseUser.uid };
  }
  if (currentFirebaseUser) {
    try {
      currentIdToken = await currentFirebaseUser.getIdToken(true);
      return { idToken: currentIdToken, uid: currentFirebaseUser.uid };
    } catch (e) {
      console.error("AuthService: Error refreshing ID token", e);
      return null;
    }
  }
  return null;
};

export const signInWithGoogle = async () => {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get the users ID token
    const { user: googleUser } = await GoogleSignin.signIn();
    
    // Get the user's ID token
    const { accessToken } = await GoogleSignin.getTokens();
    if (!accessToken) {
      throw new Error('Failed to get access token from Google Sign-In');
    }

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(null, accessToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    currentFirebaseUser = userCredential.user;
    currentIdToken = await currentFirebaseUser.getIdToken();

    const userData = {
      uid: currentFirebaseUser.uid,
      email: currentFirebaseUser.email,
      displayName: currentFirebaseUser.displayName,
      photoURL: currentFirebaseUser.photoURL,
    };
    storage.set(USER_KEY, JSON.stringify(userData));

    await syncUserProfile(currentFirebaseUser, true);

    return {
      user: currentFirebaseUser,
      idToken: currentIdToken,
      uid: currentFirebaseUser.uid
    };

  } catch (error) {
    console.error("AuthService: Google Sign-In/Firebase error", error);
    // Add more detailed error logging
    if (error.code) {
      console.error("Error code:", error.code);
    }
    throw error;
  }
};

export const signOut = async () => {
  try {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    await auth().signOut();
    
  } catch (error) {
    console.error('AuthService: Sign out error', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return currentFirebaseUser;
};

export const syncUserProfile = async (firebaseUser, isLogin = false) => {
  if (!firebaseUser || !firebaseUser.uid) {
    console.warn('AuthService: Cannot sync profile, Firebase user or UID missing.');
    return;
  }

  const userPath = `/users/${firebaseUser.uid}`;
  const profilePath = `${userPath}/profile`;

  try {
    const existingProfile = await FirebaseService.readData(profilePath);

    const profileData = {
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoUrl: firebaseUser.photoURL,
      ...(existingProfile || {}),
      lastLoginAt: new Date().toISOString(),
    };

    if (!existingProfile || isLogin) {
      if(!existingProfile?.createdAt) profileData.createdAt = new Date().toISOString();
    }

    await FirebaseService.updateData(profilePath, profileData);
    console.log('User profile synced with Firebase via AuthService');

  } catch (error) {
    console.error('AuthService: Error syncing user profile with Firebase:', error);
  }
};

export const checkUserSession = async () => {
  return currentFirebaseUser;
};

export const getAuth = () => auth(); 