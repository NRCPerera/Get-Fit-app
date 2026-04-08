import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import BackButton from '../../components/common/BackButton';

const getDifficultyColor = (difficulty, colors) => {
  switch (difficulty?.toLowerCase()) {
    case 'beginner': return colors.success;
    case 'intermediate': return colors.warning;
    case 'advanced': return colors.error;
    default: return colors.textSecondary;
  }
};

const CustomWorkoutDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workout } = route.params || {};
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [currentDay, setCurrentDay] = useState(1);
  const workoutId = workout?._id || workout?.id;

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        if (!workoutId) return;
        try {
          const progress = await AsyncStorage.getItem(`workout_progress_${workoutId}`);
          if (progress) {
             const data = JSON.parse(progress);
             setCurrentDay(data.currentDay || 1);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadProgress();
    }, [workoutId])
  );

  if (!workout) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Workout not found</Text>
      </View>
    );
  }

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutTracker', { 
      schedule: workout, 
      day: workout.scheduleType && workout.scheduleType !== '1-day' ? currentDay : null 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header Section */}
        <LinearGradient
          colors={colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <BackButton style={styles.backButton} />
          
          <View style={styles.headerContent}>
            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={styles.workoutDuration}>{workout.duration} • {workout.workoutsPerWeek}</Text>
            
            <View style={styles.badgeContainer}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty, colors) }]}>
                <Text style={styles.difficultyText}>
                  {workout.difficulty?.charAt(0).toUpperCase() + workout.difficulty?.slice(1)}
                </Text>
              </View>
              {workout.scheduleType && workout.scheduleType !== '1-day' && (
                <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.typeText}>
                    {workout.scheduleType === '2-day' ? '2 Day Split' : '3 Day Split'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Workout</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{workout.description}</Text>
          </View>
        </View>

        {/* Goals Section */}
        {workout.goals && workout.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
            <View style={styles.goalsContainer}>
              {workout.goals.map((goal, index) => (
                <View key={index} style={[styles.goalBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="flag-outline" size={14} color={colors.primary} />
                  <Text style={[styles.goalText, { color: colors.primary }]}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Exercises Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exercises ({workout.exercises?.length || 0})
            {workout.scheduleType && workout.scheduleType !== '1-day' && (
              <Text style={[styles.scheduleTypeLabel, { color: colors.textSecondary }]}>
                {' '}· {workout.scheduleType === '2-day' ? '2 Days' : '3 Days'}
              </Text>
            )}
          </Text>
          
          {workout.scheduleType && workout.scheduleType !== '1-day' ? (
            // Group exercises by schedule day for multi-day schedules
            Array.from({ length: workout.scheduleType === '2-day' ? 2 : 3 }, (_, dayNum) => {
              const dayExercises = workout.exercises.filter(ex => ex.scheduleDay === dayNum + 1);
              if (dayExercises.length === 0) return null;
              return (
                <View key={dayNum} style={styles.daySection}>
                  <View style={[styles.dayHeader, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.dayTitle, { color: colors.primary }]}>Day {dayNum + 1}</Text>
                    <Text style={[styles.exerciseCount, { color: colors.primary }]}>
                      {dayExercises.length} exercises
                    </Text>
                  </View>
                  {dayExercises.map((exercise, index) => (
                    <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.exerciseHeader}>
                        <View style={[styles.exerciseIcon, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons name="fitness" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.exerciseName, { color: colors.text }]}>
                          {exercise.exerciseId?.name || exercise.exerciseName}
                        </Text>
                      </View>
                      <View style={styles.exerciseDetails}>
                        {exercise.setReps && exercise.setReps.length > 0 && (
                          <View style={styles.setRepsContainer}>
                            {exercise.setReps.map((setRep, srIndex) => (
                              <View key={srIndex} style={[styles.setRepItem, { backgroundColor: colors.primary + '10' }]}>
                                <Text style={[styles.setRepText, { color: colors.primary }]}>
                                  {setRep.sets} sets × {setRep.reps}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {exercise.restTime && (
                          <View style={styles.exerciseDetailItem}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                              {exercise.restTime}s rest
                            </Text>
                          </View>
                        )}
                      </View>
                      {exercise.notes && (
                        <Text style={[styles.exerciseNotes, { color: colors.textTertiary }]}>{exercise.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })
          ) : (
            // Display all exercises for 1-day schedules
            workout.exercises?.map((exercise, index) => (
              <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.exerciseHeader}>
                  <View style={[styles.exerciseIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="fitness" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>
                    {exercise.exerciseId?.name || exercise.exerciseName}
                  </Text>
                </View>
                <View style={styles.exerciseDetails}>
                  {exercise.setReps && exercise.setReps.length > 0 && (
                    <View style={styles.setRepsContainer}>
                      {exercise.setReps.map((setRep, srIndex) => (
                        <View key={srIndex} style={[styles.setRepItem, { backgroundColor: colors.primary + '10' }]}>
                          <Text style={[styles.setRepText, { color: colors.primary }]}>
                            {setRep.sets} sets × {setRep.reps}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {exercise.restTime && (
                    <View style={styles.exerciseDetailItem}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={[styles.exerciseDetailText, { color: colors.textSecondary }]}>
                        {exercise.restTime}s rest
                      </Text>
                    </View>
                  )}
                </View>
                {exercise.notes && (
                  <Text style={[styles.exerciseNotes, { color: colors.textTertiary }]}>{exercise.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Start Workout Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              {workout.scheduleType && workout.scheduleType !== '1-day' ? `Start Day ${currentDay}` : 'Start Workout'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    gap: 8,
  },
  workoutName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  workoutDuration: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  scheduleTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  goalText: {
    fontSize: 13,
    fontWeight: '600',
  },
  daySection: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  setRepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setRepItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setRepText: {
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: 13,
  },
  exerciseNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CustomWorkoutDetailScreen;
