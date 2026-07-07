import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI } from '../../api/schedule.api';
import { formatDate } from '../../utils/helpers';

const ScheduleDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, refreshCount } = route.params || {};
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ paddingLeft: 16, paddingRight: 16, paddingVertical: 8, marginLeft: -8 }}
          onPress={() => {
            if (route.params?.fromHome) {
              navigation.navigate('Home');
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text, route.params?.fromHome]);

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        if (!id) return;
        try {
          const progress = await AsyncStorage.getItem(`workout_progress_${id}`);
          if (progress) {
             const data = JSON.parse(progress);
             setCurrentDay(data.currentDay || 1);
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadProgress();
    }, [id])
  );

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return formatDate(date, 'MMM dd, yyyy');
    } catch {
      return '';
    }
  };

  const load = useCallback(async () => {
    try {
      const res = await scheduleAPI.getScheduleById(id);
      const data = res?.data?.schedule || res?.data || res;
      setItem(data);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to load schedule');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useEffect(() => { load(); }, [load, refreshCount]);

  if (loading || !item) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  const handleStartWorkout = () => {
    navigation.navigate('WorkoutTracker', { 
      schedule: item, 
      day: item.scheduleType && item.scheduleType !== '1-day' ? currentDay : null 
    });
  };

  const handleEditWorkout = () => {
    navigation.navigate('EditSchedule', { id, initialData: item });
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Schedule Details</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>View and manage your training schedule</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.infoRow}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Schedule Name</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{item.name || 'Untitled Schedule'}</Text>
              </View>
            </View>
            {item.description && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Description</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{item.description}</Text>
                </View>
              </View>
            )}
            {item.difficulty && (
              <View style={styles.infoRow}>
                <Ionicons name="trending-up-outline" size={20} color={colors.warning} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Difficulty</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Date Range</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            {item.startDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Start Date</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatDateForDisplay(item.startDate)}</Text>
                </View>
              </View>
            )}
            {item.endDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>End Date</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{formatDateForDisplay(item.endDate)}</Text>
                </View>
              </View>
            )}
            {!item.startDate && !item.endDate && (
              <Text style={[styles.noDateText, { color: colors.textSecondary }]}>No date range specified</Text>
            )}
          </View>
        </View>

        {item.exercises && item.exercises.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Exercises ({item.exercises.length})
              {item.scheduleType && item.scheduleType !== '1-day' && (
                <Text style={[styles.scheduleTypeLabel, { color: colors.textSecondary }]}> · {item.scheduleType === '2-day' ? '2 Days' : '3 Days'}</Text>
              )}
            </Text>
            {item.scheduleType && item.scheduleType !== '1-day' ? (
              // Group exercises by schedule day for multi-day schedules
              Array.from({ length: item.scheduleType === '2-day' ? 2 : 3 }, (_, dayNum) => {
                const dayExercises = item.exercises.filter(ex => ex.scheduleDay === dayNum + 1);
                if (dayExercises.length === 0) return null;
                return (
                  <View key={dayNum} style={styles.daySection}>
                    <Text style={[styles.daySectionTitle, { color: colors.primary }]}>Day {dayNum + 1}</Text>
                    <View style={styles.exercisesContainer}>
                      {dayExercises.map((exercise, index) => (
                        <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                          <View style={styles.exerciseHeader}>
                            <Ionicons name="fitness" size={20} color={colors.primary} />
                            <Text style={[styles.exerciseName, { color: colors.text }]}>
                              {exercise.exerciseId?.name || exercise.exerciseName || `Exercise ${index + 1}`}
                            </Text>
                          </View>
                          <View style={styles.exerciseDetails}>
                            {exercise.setReps && exercise.setReps.length > 0 && (
                              <View style={styles.setRepsContainer}>
                                {exercise.setReps.map((setRep, srIndex) => (
                                  <View key={srIndex} style={[styles.setRepItem, { backgroundColor: colors.primary + '20' }]}>
                                    <Text style={[styles.setRepText, { color: colors.primary }]}>
                                      {setRep.sets} sets × {setRep.reps} reps
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            )}
                            {exercise.duration && (
                              <View style={styles.exerciseDetailItem}>
                                <Text style={[styles.exerciseDetailLabel, { color: colors.textSecondary }]}>Duration:</Text>
                                <Text style={[styles.exerciseDetailValue, { color: colors.text }]}>{exercise.duration} min</Text>
                              </View>
                            )}
                            {exercise.restTime && (
                              <View style={styles.exerciseDetailItem}>
                                <Text style={[styles.exerciseDetailLabel, { color: colors.textSecondary }]}>Rest:</Text>
                                <Text style={[styles.exerciseDetailValue, { color: colors.text }]}>{exercise.restTime} sec</Text>
                              </View>
                            )}
                          </View>
                          {exercise.notes && (
                            <Text style={[styles.exerciseNotes, { color: colors.textSecondary }]}>{exercise.notes}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            ) : (
              // Display all exercises for 1-day schedules
              <View style={styles.exercisesContainer}>
                {item.exercises.map((exercise, index) => (
                  <View key={index} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={styles.exerciseHeader}>
                      <Ionicons name="fitness" size={20} color={colors.primary} />
                      <Text style={[styles.exerciseName, { color: colors.text }]}>
                        {exercise.exerciseId?.name || exercise.exerciseName || `Exercise ${index + 1}`}
                      </Text>
                    </View>
                    <View style={styles.exerciseDetails}>
                      {exercise.setReps && exercise.setReps.length > 0 && (
                        <View style={styles.setRepsContainer}>
                          {exercise.setReps.map((setRep, srIndex) => (
                            <View key={srIndex} style={[styles.setRepItem, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.setRepText, { color: colors.primary }]}>
                                {setRep.sets} sets × {setRep.reps} reps
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {exercise.duration && (
                        <View style={styles.exerciseDetailItem}>
                          <Text style={[styles.exerciseDetailLabel, { color: colors.textSecondary }]}>Duration:</Text>
                          <Text style={[styles.exerciseDetailValue, { color: colors.text }]}>{exercise.duration} min</Text>
                        </View>
                      )}
                      {exercise.restTime && (
                        <View style={styles.exerciseDetailItem}>
                          <Text style={[styles.exerciseDetailLabel, { color: colors.textSecondary }]}>Rest:</Text>
                          <Text style={[styles.exerciseDetailValue, { color: colors.text }]}>{exercise.restTime} sec</Text>
                        </View>
                      )}
                    </View>
                    {exercise.notes && (
                      <Text style={[styles.exerciseNotes, { color: colors.textSecondary }]}>{exercise.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {item.goals && item.goals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Goals</Text>
            <View style={styles.goalsContainer}>
              {item.goals.map((goal, index) => (
                <View key={index} style={[styles.goalBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="flag-outline" size={14} color={colors.primary} />
                  <Text style={[styles.goalText, { color: colors.primary }]}>{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {item.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
              <Text style={[styles.notesText, { color: colors.text }]}>{item.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomActionBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEditWorkout}>
          <LinearGradient
            colors={[colors.secondary, '#8e44ad']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="pencil" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleStartWorkout}>
          <LinearGradient
            colors={[colors.primary, '#2980b9']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {item.scheduleType && item.scheduleType !== '1-day' ? `Start Day ${currentDay}` : 'Start'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 100 }, // Added padding bottom to prevent floating bar overlap
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: theme.typography.fontSize.md },
  header: { marginBottom: theme.spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.xs, letterSpacing: 0.3 },
  subtitle: { fontSize: theme.typography.fontSize.md },
  section: { marginBottom: theme.spacing.xl },
  sectionTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.md },
  infoCard: { borderRadius: 20, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing.md, gap: theme.spacing.md },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs },
  infoValue: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold },
  noDateText: { fontSize: theme.typography.fontSize.sm, fontStyle: 'italic' },
  exercisesContainer: { gap: theme.spacing.md },
  exerciseCard: { borderRadius: 20, padding: theme.spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, gap: theme.spacing.sm },
  exerciseName: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold, flex: 1 },
  exerciseDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, marginTop: theme.spacing.sm },
  exerciseDetailItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  exerciseDetailLabel: { fontSize: theme.typography.fontSize.sm },
  exerciseDetailValue: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  exerciseNotes: { fontSize: theme.typography.fontSize.sm, marginTop: theme.spacing.sm, fontStyle: 'italic' },
  scheduleTypeLabel: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.normal },
  daySection: { marginBottom: theme.spacing.lg },
  daySectionTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.md },
  setRepsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  setRepItem: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.borderRadius.md },
  setRepText: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  goalsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  goalBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 12, gap: theme.spacing.xs },
  goalText: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  notesCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.md, ...theme.shadows.medium },
  notesText: { fontSize: theme.typography.fontSize.md, lineHeight: theme.typography.fontSize.md * 1.5 },
  
  // Bottom Action Bar Styles
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    gap: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ScheduleDetailScreen;

