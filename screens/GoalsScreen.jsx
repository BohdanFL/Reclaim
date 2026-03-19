import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, FAB, useTheme, Button, Dialog, Portal} from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { useFocusEffect } from '@react-navigation/native';
import AddGoalDialog from '../components/AddGoalDialog';
import GoalCard from '../components/GoalCard';
import {MMKV} from 'react-native-mmkv';
import { getCurrentDailyTotalTimeInSeconds } from '../services/UsageStatsService';
import { achievementChecker } from '../services/achievementChecker';

export const storage = new MMKV();
const GOALS_STORAGE_KEY = '@app_goals';
const DAILY_GOAL_KEY = '@daily_goal';

const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [goalDialogVisible, setGoalDialogVisible] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(240); // minutes
  const [currentUsage, setCurrentUsage] = useState(0); // minutes
  const theme = useTheme();

  const loadData = useCallback(async () => {
    try {
      // Load goals
      const savedGoals = storage.getString(GOALS_STORAGE_KEY);
      if (savedGoals) {
        const parsedGoals = JSON.parse(savedGoals);
        setGoals(parsedGoals);
        // Check achievements based on total goals
        achievementChecker.checkGoalAchievements(parsedGoals.length);
      }

      // Load daily goal
      const saved = storage.getNumber(DAILY_GOAL_KEY);
      if (saved) {
        setDailyGoal(saved);
      }

      // Load current usage
      const seconds = await getCurrentDailyTotalTimeInSeconds();
      setCurrentUsage(Math.floor(seconds / 60));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const saveGoals = async newGoals => {
    try {
      storage.set(GOALS_STORAGE_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
      // Check achievements after saving goals
      achievementChecker.checkGoalAchievements(newGoals.length);
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const handleAddGoal = newGoal => {
    const updatedGoals = [...goals, {...newGoal, id: Date.now().toString()}];
    saveGoals(updatedGoals);
    // Check achievements after adding a new goal
    achievementChecker.checkGoalAchievements(updatedGoals.length);
  };

  const handleDeleteGoal = goal => {
    const updatedGoals = goals.filter(g => g.id !== goal.id);
    saveGoals(updatedGoals);
  };

  const handleToggleGoal = goal => {
    const updatedGoals = goals.map(g =>
      g.id === goal.id ? {...g, isActive: !g.isActive} : g,
    );
    saveGoals(updatedGoals);
  };

  const handleProgressUpdate = (goalId, newProgress) => {
    const updatedGoals = goals.map(g =>
      g.id === goalId ? { ...g, progress: newProgress } : g
    );
    saveGoals(updatedGoals);
  };

  const onConfirmTime = ({ hours, minutes }) => {
    const totalMinutes = (hours * 60) + minutes;
    setDailyGoal(totalMinutes);
    storage.set(DAILY_GOAL_KEY, totalMinutes);
    setGoalDialogVisible(false);
  };

  function minutesToHM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  const requestAccessibilityPermission = async () => {
    // TODO: Implement accessibility permission request
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Goals & Limits
      </Text>

      {/* Daily Usage Goal Section */}
      <View style={styles.dailyGoalSection}>
        <View style={styles.dailyGoalInfo}>
          <Text style={styles.dailyGoalLabel}>Daily Usage Goal</Text>
          <Text style={styles.usageText}>Used: {minutesToHM(currentUsage)}</Text>
        </View>
        <Button 
          mode="outlined" 
          onPress={() => setGoalDialogVisible(true)} 
          style={styles.editGoalBtn}
          icon="clock-outline"
        >
          Goal: {minutesToHM(dailyGoal)}
        </Button>
      </View>

      <TimePickerModal
        visible={goalDialogVisible}
        onDismiss={() => setGoalDialogVisible(false)}
        onConfirm={onConfirmTime}
        hours={Math.floor(dailyGoal / 60)}
        minutes={dailyGoal % 60}
        label="Set Daily Usage Goal"
        uppercase={false}
        cancelLabel="Cancel"
        confirmLabel="Save"
      />

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            No app limits set yet. Add your first limit to start managing your
            screen time.
          </Text>
          <Button
            mode="contained"
            onPress={() => setDialogVisible(true)}
            style={styles.addFirstButton}>
            Add First Limit
          </Button>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onToggle={handleToggleGoal}
              onProgressUpdate={handleProgressUpdate}
            />
          ))}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        onPress={() => setDialogVisible(true)}
        color="white"
      />

      <AddGoalDialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onSave={handleAddGoal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    margin: 16,
    marginBottom: 16,
  },
  dailyGoalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dailyGoalInfo: {
    flex: 1,
  },
  dailyGoalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editGoalBtn: {
    borderRadius: 8,
    marginLeft: 8,
  },
  scrollView: {
    padding: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  addFirstButton: {
    borderRadius: 8,
  },
});

export default GoalsScreen;
