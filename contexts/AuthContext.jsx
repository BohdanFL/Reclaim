import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getAuthToken as authGetAuthToken,
  checkUserSession as authCheckUserSession,
  getCurrentUser,
  getAuth as getFirebaseAuth,
} from '../services/AuthService';
import FirebaseService from '../services/FirebaseService';
import { MMKV } from 'react-native-mmkv';
import { onAuthStateChanged } from 'firebase/auth';

const storage = new MMKV();

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState(null);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const tokenInfo = await authGetAuthToken();
          if (tokenInfo) {
            setIdToken(tokenInfo.idToken);
            setUid(tokenInfo.uid);
          }
        } else {
          setUser(null);
          setIdToken(null);
          setUid(null);
        }
      } catch (error) {
        console.error("AuthContext: Error handling auth state change", error);
        setUser(null);
        setIdToken(null);
        setUid(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      const { user: firebaseUser, idToken: firebaseIdToken, uid: firebaseUid } = await authSignInWithGoogle();
      setUser(firebaseUser);
      setIdToken(firebaseIdToken);
      setUid(firebaseUid);
      return firebaseUser;
    } catch (error) {
      console.error("AuthContext: Google Sign-In error", error);
      setUser(null);
      setIdToken(null);
      setUid(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authSignOut();
      setUser(null);
      setIdToken(null);
      setUid(null);
    } catch (error) {
      console.error("AuthContext: Sign Out error", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserDataPathFirebase = async (dataPathSuffix) => {
    if (!uid) {
      const tokenInfo = await authGetAuthToken();
      if (tokenInfo && tokenInfo.uid) {
        setUid(tokenInfo.uid);
        const basePath = await FirebaseService.getFirebaseUserPath(tokenInfo.uid);
        return basePath ? `${basePath}/${dataPathSuffix}` : null;
      }
      console.error('UID not available for Firebase path');
      return null;
    }
    const basePath = await FirebaseService.getFirebaseUserPath(uid);
    return basePath ? `${basePath}/${dataPathSuffix}` : null;
  };

  const saveDailyStats = async (date, stats) => {
    const path = await getUserDataPathFirebase(`dailyStats/${date}`);
    if (!path) return console.error('Cannot save daily stats: Path not available');
    try {
      await FirebaseService.writeData(path, stats);
      console.log('Daily stats saved to Firebase', date, stats);
    } catch (error) {
      console.error('Error saving daily stats to Firebase:', error);
    }
  };

  const getDailyStats = async (date) => {
    const path = await getUserDataPathFirebase(`dailyStats/${date}`);
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading daily stats from Firebase:', error);
      return null;
    }
  };
  
  const getAllUserData = async () => {
    if (!uid) {
      const tokenInfo = await authGetAuthToken();
      if (tokenInfo && tokenInfo.uid) setUid(tokenInfo.uid);
      else return null;
    }
    const userRootPath = await FirebaseService.getFirebaseUserPath(uid);
    if (!userRootPath) return null;
    try {
      return await FirebaseService.readData(userRootPath);
    } catch (error) {
      console.error('Error reading all user data from Firebase:', error);
      return null;
    }
  };

  const saveGoal = async (goalId, goalData) => {
    const path = await getUserDataPathFirebase(`goals/${goalId}`);
    if (!path) return console.error('Cannot save goal: Path not available');
    try {
      await FirebaseService.writeData(path, { ...goalData, updatedAt: new Date().toISOString() });
      console.log('Goal saved to Firebase', goalId, goalData);
    } catch (error) {
      console.error('Error saving goal to Firebase:', error);
    }
  };
  
  const getGoal = async (goalId) => {
    const path = await getUserDataPathFirebase(`goals/${goalId}`);
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading goal from Firebase:', error);
      return null;
    }
  };

  const updateGoal = async (goalId, goalDataToUpdate) => {
    const path = await getUserDataPathFirebase(`goals/${goalId}`);
    if (!path) return console.error('Cannot update goal: Path not available');
    try {
      await FirebaseService.updateData(path, { ...goalDataToUpdate, updatedAt: new Date().toISOString() });
      console.log('Goal updated in Firebase', goalId, goalDataToUpdate);
    } catch (error) {
      console.error('Error updating goal in Firebase:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    const path = await getUserDataPathFirebase(`goals/${goalId}`);
    if (!path) return console.error('Cannot delete goal: Path not available');
    try {
      await FirebaseService.deleteData(path);
      console.log('Goal deleted from Firebase', goalId);
    } catch (error) {
      console.error('Error deleting goal from Firebase:', error);
    }
  };
  
  const getAllGoals = async () => {
    const path = await getUserDataPathFirebase('goals');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading all goals from Firebase:', error);
      return null;
    }
  };

  const saveLimit = async (limitId, limitData) => {
    const path = await getUserDataPathFirebase(`limits/${limitId}`);
    if (!path) return console.error('Cannot save limit: Path not available');
    try {
      await FirebaseService.writeData(path, { ...limitData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      console.log('Limit saved to Firebase', limitId, limitData);
    } catch (error) {
      console.error('Error saving limit to Firebase:', error);
    }
  };

  const getLimit = async (limitId) => {
    const path = await getUserDataPathFirebase(`limits/${limitId}`);
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading limit from Firebase:', error);
      return null;
    }
  };

  const updateLimit = async (limitId, limitDataToUpdate) => {
    const path = await getUserDataPathFirebase(`limits/${limitId}`);
    if (!path) return console.error('Cannot update limit: Path not available');
    try {
      await FirebaseService.updateData(path, { ...limitDataToUpdate, updatedAt: new Date().toISOString() });
      console.log('Limit updated in Firebase', limitId, limitDataToUpdate);
    } catch (error) {
      console.error('Error updating limit in Firebase:', error);
    }
  };

  const deleteLimit = async (limitId) => {
    const path = await getUserDataPathFirebase(`limits/${limitId}`);
    if (!path) return console.error('Cannot delete limit: Path not available');
    try {
      await FirebaseService.deleteData(path);
      console.log('Limit deleted from Firebase', limitId);
    } catch (error) {
      console.error('Error deleting limit from Firebase:', error);
    }
  };
  
  const getAllLimits = async () => {
    const path = await getUserDataPathFirebase('limits');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading all limits from Firebase:', error);
      return null;
    }
  };
  
  const updateAchievementsBatch = async (achievementsToUpdate) => {
    const path = await getUserDataPathFirebase('achievements');
    if (!path) return console.error('Cannot update achievements: Path not available');
    try {
      await FirebaseService.updateData(path, achievementsToUpdate);
      console.log('Achievements updated in Firebase', achievementsToUpdate);
    } catch (error) {
      console.error('Error updating achievements in Firebase:', error);
    }
  };
  
  const getAllAchievements = async () => {
    const path = await getUserDataPathFirebase('achievements');
    if (!path) return null;
    try {
      const achievements = await FirebaseService.readData(path);
      return achievements || {};
    } catch (error) {
      console.error('Error reading all achievements from Firebase:', error);
      return {};
    }
  };

  const saveActiveChallenge = async (challengeId, challengeData) => {
    const path = await getUserDataPathFirebase(`activeChallenges/${challengeId}`);
    if (!path) return console.error('Cannot save active challenge: Path not available');
    try {
      await FirebaseService.writeData(path, { ...challengeData, lastUpdated: new Date().toISOString() });
      console.log('Active challenge saved to Firebase', challengeId, challengeData);
    } catch (error) {
      console.error('Error saving active challenge to Firebase:', error);
    }
  };
  
  const getActiveChallenge = async (challengeId) => {
    const path = await getUserDataPathFirebase(`activeChallenges/${challengeId}`);
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading active challenge from Firebase:', error);
      return null;
    }
  };

  const updateActiveChallenge = async (challengeId, challengeDataToUpdate) => {
    const path = await getUserDataPathFirebase(`activeChallenges/${challengeId}`);
    if (!path) return console.error('Cannot update active challenge: Path not available');
    try {
      await FirebaseService.updateData(path, { ...challengeDataToUpdate, lastUpdated: new Date().toISOString() });
      console.log('Active challenge updated in Firebase', challengeId, challengeDataToUpdate);
    } catch (error) {
      console.error('Error updating active challenge in Firebase:', error);
    }
  };

  const deleteActiveChallenge = async (challengeId) => {
    const path = await getUserDataPathFirebase(`activeChallenges/${challengeId}`);
    if (!path) return console.error('Cannot delete active challenge: Path not available');
    try {
      await FirebaseService.deleteData(path);
      console.log('Active challenge deleted from Firebase', challengeId);
    } catch (error) {
      console.error('Error deleting active challenge from Firebase:', error);
    }
  };
  
  const getAllActiveChallenges = async () => {
    const path = await getUserDataPathFirebase('activeChallenges');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading all active challenges from Firebase:', error);
      return null;
    }
  };
  
  const saveCompletedChallenge = async (challengeId, challengeData) => {
    const path = await getUserDataPathFirebase(`completedChallenges/${challengeId}`);
    if (!path) return console.error('Cannot save completed challenge: Path not available');
    try {
      await FirebaseService.writeData(path, { ...challengeData, completedAt: new Date().toISOString() });
      console.log('Completed challenge saved to Firebase', challengeId, challengeData);
    } catch (error) {
      console.error('Error saving completed challenge to Firebase:', error);
    }
  };
  
  const getAllCompletedChallenges = async () => {
    const path = await getUserDataPathFirebase('completedChallenges');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading all completed challenges from Firebase:', error);
      return null;
    }
  };

  const saveTipSettings = async (settingsData) => {
    const path = await getUserDataPathFirebase('tipSettings');
    if (!path) return console.error('Cannot save tip settings: Path not available');
    try {
      await FirebaseService.updateData(path, { ...settingsData, lastUpdated: new Date().toISOString() });
      console.log('Tip settings saved to Firebase', settingsData);
    } catch (error) {
      console.error('Error saving tip settings to Firebase:', error);
    }
  };
  
  const getTipSettings = async () => {
    const path = await getUserDataPathFirebase('tipSettings');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading tip settings from Firebase:', error);
      return null;
    }
  };

  const saveFocusSession = async (sessionId, sessionData) => {
    const path = await getUserDataPathFirebase(`focusHistory/${sessionId}`);
    if (!path) return console.error('Cannot save focus session: Path not available');
    try {
      await FirebaseService.writeData(path, sessionData);
      console.log('Focus session saved to Firebase', sessionId, sessionData);
    } catch (error) {
      console.error('Error saving focus session to Firebase:', error);
    }
  };
  
  const getAllFocusSessions = async () => {
    const path = await getUserDataPathFirebase('focusHistory');
    if (!path) return null;
    try {
      return await FirebaseService.readData(path);
    } catch (error) {
      console.error('Error reading all focus sessions from Firebase:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        uid,
        idToken,
        loading,
        signIn,
        signOut,
        saveDailyStats,
        getDailyStats,
        saveGoal,
        getGoal,
        updateGoal,
        deleteGoal,
        getAllGoals,
        saveLimit,
        getLimit,
        updateLimit,
        deleteLimit,
        getAllLimits,
        updateAchievementsBatch,
        getAllAchievements,
        saveActiveChallenge,
        getActiveChallenge,
        updateActiveChallenge,
        deleteActiveChallenge,
        getAllActiveChallenges,
        saveCompletedChallenge,
        getAllCompletedChallenges,
        saveTipSettings,
        getTipSettings,
        saveFocusSession,
        getAllFocusSessions,
        getAllUserData,
        getUserDataPathFirebase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 