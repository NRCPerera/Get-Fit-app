import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI } from '../../api/schedule.api';
import { exerciseAPI } from '../../api/exercise.api';

const SCHEDULE_TYPES = ['1-day', '2-day', '3-day'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DIFFICULTY_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const GOAL_OPTIONS = ['Weight Loss', 'Muscle Building', 'Strength Training', 'Cardio Fitness', 'Flexibility', 'Endurance'];

const CreateScheduleScreen = () => {
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('1-day');
  const [difficulty, setDifficulty] = useState('');
  const [goals, setGoals] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([]); // Structure: { exerciseId, exerciseName, scheduleDay, setReps: [{sets, reps}], duration, restTime, notes, dayOfWeek }
  const [selectedDay, setSelectedDay] = useState(1); // For multi-day schedules
  const [saving, setSaving] = useState(false);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadExercises = useCallback(async () => {
    try {
      setLoadingExercises(true);
      const res = await exerciseAPI.getAllExercises({ page: 1, limit: 100, status: 'active' });
      const payload = res?.data?.data || res?.data || res;
      setAvailableExercises(payload.items || payload?.data?.items || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load exercises');
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  useEffect(() => {
    if (showExerciseModal) {
      loadExercises();
    }
  }, [showExerciseModal, loadExercises]);

  const canSave = useMemo(() => {
    return name.trim().length > 0 && exercises.length > 0 && !saving;
  }, [name, exercises, saving]);

  // Filter exercises by selected day for multi-day schedules
  const exercisesForSelectedDay = useMemo(() => {
    if (scheduleType === '1-day') return exercises;
    return exercises.filter(ex => ex.scheduleDay === selectedDay);
  }, [exercises, scheduleType, selectedDay]);

  const toggleGoal = (goal) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const addExercise = (exercise) => {
    const newExercise = {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      scheduleDay: scheduleType === '1-day' ? undefined : selectedDay,
      setReps: [{ sets: '', reps: '' }], // Start with one set-rep combination
      duration: '',
      restTime: '',
      notes: '',
      dayOfWeek: scheduleType === '1-day' ? '' : undefined, // Only for 1-day schedules
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExerciseModal(false);
  };

  const removeExercise = (index) => {
    const exerciseToRemove = exercisesForSelectedDay[index];
    setExercises(prev => prev.filter((ex, i) => {
      if (scheduleType === '1-day') {
        return i !== index;
      }
      // For multi-day, find by exerciseId and scheduleDay
      return !(ex.exerciseId === exerciseToRemove.exerciseId && ex.scheduleDay === exerciseToRemove.scheduleDay);
    }));
  };

  const updateExercise = (index, field, value) => {
    const exerciseToUpdate = exercisesForSelectedDay[index];
    setExercises(prev => prev.map((ex, i) => {
      if (scheduleType === '1-day') {
        return i === index ? { ...ex, [field]: value } : ex;
      }
      // For multi-day, match by exerciseId and scheduleDay
      if (ex.exerciseId === exerciseToUpdate.exerciseId && ex.scheduleDay === exerciseToUpdate.scheduleDay) {
        return { ...ex, [field]: value };
      }
      return ex;
    }));
  };

  const addSetRep = (index) => {
    const exerciseToUpdate = exercisesForSelectedDay[index];
    setExercises(prev => prev.map((ex, i) => {
      if (scheduleType === '1-day') {
        // For 1-day schedules, exercisesForSelectedDay === exercises, so index matches
        if (i === index) {
          return { ...ex, setReps: [...(ex.setReps || []), { sets: '', reps: '' }] };
        }
        return ex;
      }
      if (ex.exerciseId === exerciseToUpdate.exerciseId && ex.scheduleDay === exerciseToUpdate.scheduleDay) {
        return { ...ex, setReps: [...(ex.setReps || []), { sets: '', reps: '' }] };
      }
      return ex;
    }));
  };

  const removeSetRep = (exerciseIndex, setRepIndex) => {
    const exerciseToUpdate = exercisesForSelectedDay[exerciseIndex];
    setExercises(prev => prev.map((ex, i) => {
      if (scheduleType === '1-day') {
        // For 1-day schedules, exercisesForSelectedDay === exercises, so index matches
        if (i === exerciseIndex && ex.setReps && ex.setReps.length > 1) {
          return { ...ex, setReps: ex.setReps.filter((_, idx) => idx !== setRepIndex) };
        }
        return ex;
      }
      if (ex.exerciseId === exerciseToUpdate.exerciseId && ex.scheduleDay === exerciseToUpdate.scheduleDay) {
        if (ex.setReps && ex.setReps.length > 1) {
          return { ...ex, setReps: ex.setReps.filter((_, idx) => idx !== setRepIndex) };
        }
      }
      return ex;
    }));
  };

  const updateSetRep = (exerciseIndex, setRepIndex, field, value) => {
    const exerciseToUpdate = exercisesForSelectedDay[exerciseIndex];
    setExercises(prev => prev.map((ex, i) => {
      if (scheduleType === '1-day') {
        // For 1-day schedules, exercisesForSelectedDay === exercises, so index matches
        if (i === exerciseIndex && ex.setReps) {
          const updatedSetReps = [...ex.setReps];
          updatedSetReps[setRepIndex] = { ...updatedSetReps[setRepIndex], [field]: value };
          return { ...ex, setReps: updatedSetReps };
        }
        return ex;
      }
      if (ex.exerciseId === exerciseToUpdate.exerciseId && ex.scheduleDay === exerciseToUpdate.scheduleDay) {
        if (ex.setReps) {
          const updatedSetReps = [...ex.setReps];
          updatedSetReps[setRepIndex] = { ...updatedSetReps[setRepIndex], [field]: value };
          return { ...ex, setReps: updatedSetReps };
        }
      }
      return ex;
    }));
  };

  // When schedule type changes, update exercises
  useEffect(() => {
    if (scheduleType === '1-day') {
      // Convert scheduleDay to dayOfWeek for 1-day schedules
      setExercises(prev => prev.map(ex => ({
        ...ex,
        scheduleDay: undefined,
        dayOfWeek: ex.dayOfWeek || ''
      })));
      setSelectedDay(1);
    } else {
      // Convert dayOfWeek to scheduleDay for multi-day schedules
      const numDays = scheduleType === '2-day' ? 2 : 3;
      setExercises(prev => prev.map((ex, idx) => ({
        ...ex,
        scheduleDay: ex.scheduleDay || ((idx % numDays) + 1),
        dayOfWeek: undefined
      })));
      setSelectedDay(1);
    }
  }, [scheduleType]);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        scheduleType: scheduleType,
        difficulty: difficulty || undefined,
        goals: goals.length > 0 ? goals : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
        exercises: exercises.map(ex => {
          const exerciseData = {
            exerciseId: ex.exerciseId,
            duration: ex.duration ? parseInt(ex.duration) : undefined,
            restTime: ex.restTime ? parseInt(ex.restTime) : undefined,
            notes: ex.notes.trim() || undefined,
          };

          // Add setReps array if it exists and has valid entries
          if (ex.setReps && ex.setReps.length > 0) {
            const validSetReps = ex.setReps
              .filter(sr => sr.sets && sr.reps && sr.sets !== '' && sr.reps !== '')
              .map(sr => ({
                sets: parseInt(sr.sets),
                reps: parseInt(sr.reps)
              }));
            if (validSetReps.length > 0) {
              exerciseData.setReps = validSetReps;
            }
          }

          // Add scheduleDay for multi-day schedules
          if (scheduleType !== '1-day' && ex.scheduleDay) {
            exerciseData.scheduleDay = ex.scheduleDay;
          }

          // Add dayOfWeek for 1-day schedules
          if (scheduleType === '1-day' && ex.dayOfWeek) {
            exerciseData.dayOfWeek = ex.dayOfWeek;
          }

          return exerciseData;
        }).filter(ex => ex.setReps && ex.setReps.length > 0), // Only include exercises with valid set-rep combinations
      };
      await scheduleAPI.createSchedule(payload);
      Alert.alert('Success', 'Schedule created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const renderExerciseItem = ({ item, index }) => (
    <View style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{item.exerciseName}</Text>
          <TouchableOpacity onPress={() => removeExercise(index)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.exerciseFields}>
        <View style={styles.field}>
          <View style={styles.setRepHeader}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Sets & Reps</Text>
            <TouchableOpacity onPress={() => addSetRep(index)} style={styles.addSetRepButton}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.addSetRepText, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          {(item.setReps || []).map((setRep, srIndex) => (
            <View key={srIndex} style={styles.setRepRow}>
              <View style={[styles.field, { flex: 1, marginRight: theme.spacing.xs }]}>
                <Text style={[styles.setRepLabel, { color: colors.textSecondary }]}>Sets</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                  value={String(setRep.sets || '')}
                  onChangeText={(value) => updateSetRep(index, srIndex, 'sets', value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginRight: theme.spacing.xs }]}>
                <Text style={[styles.setRepLabel, { color: colors.textSecondary }]}>Reps</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                  value={String(setRep.reps || '')}
                  onChangeText={(value) => updateSetRep(index, srIndex, 'reps', value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {(item.setReps || []).length > 1 && (
                <TouchableOpacity
                  onPress={() => removeSetRep(index, srIndex)}
                  style={styles.removeSetRepButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Duration (min)</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={item.duration}
              onChangeText={(value) => updateExercise(index, 'duration', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Rest (sec)</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
              value={item.restTime}
              onChangeText={(value) => updateExercise(index, 'restTime', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
        {scheduleType === '1-day' && (
          <View style={styles.fieldRow}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Day of Week</Text>
              <View style={styles.daySelector}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      { backgroundColor: colors.backgroundSecondary },
                      item.dayOfWeek === day && [styles.dayButtonActive, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => updateExercise(index, 'dayOfWeek', item.dayOfWeek === day ? '' : day)}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      { color: colors.textSecondary },
                      item.dayOfWeek === day && [styles.dayButtonTextActive, { color: colors.white }]
                    ]}>
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
          <TextInput
            style={[styles.fieldInput, { height: 60, textAlignVertical: 'top', backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={item.notes}
            onChangeText={(value) => updateExercise(index, 'notes', value)}
            multiline
            placeholder="Exercise notes..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Create Training Schedule</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Build your personalized workout plan</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Schedule Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Full Body Workout"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Schedule Type *</Text>
          <View style={styles.optionRow}>
            {SCHEDULE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.optionButton, { backgroundColor: colors.backgroundSecondary }, scheduleType === type && [styles.optionButtonActive, { backgroundColor: colors.primary }]]}
                onPress={() => setScheduleType(type)}
              >
                <Text style={[styles.optionText, { color: colors.textSecondary }, scheduleType === type && [styles.optionTextActive, { color: colors.white }]]}>
                  {type === '1-day' ? '1 Day' : type === '2-day' ? '2 Days' : '3 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe your training schedule..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Difficulty</Text>
          <View style={styles.optionRow}>
            {DIFFICULTY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionButton, { backgroundColor: colors.backgroundSecondary }, difficulty === opt && [styles.optionButtonActive, { backgroundColor: colors.primary }]]}
                onPress={() => setDifficulty(difficulty === opt ? '' : opt)}
              >
                <Text style={[styles.optionText, { color: colors.textSecondary }, difficulty === opt && [styles.optionTextActive, { color: colors.white }]]}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Goals</Text>
          <View style={styles.goalsContainer}>
            {GOAL_OPTIONS.map(goal => (
              <TouchableOpacity
                key={goal}
                style={[styles.goalButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, goals.includes(goal) && [styles.goalButtonActive, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]]}
                onPress={() => toggleGoal(goal)}
              >
                <Text style={[styles.goalText, { color: colors.text }, goals.includes(goal) && [styles.goalTextActive, { color: colors.primary }]]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Date Range (Optional)</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowStartDateModal(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.dateButtonText, !startDate && styles.dateButtonPlaceholder, { color: startDate ? colors.text : colors.textSecondary }]}>
              {startDate || 'Select start date'}
            </Text>
            {startDate && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setStartDate('');
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>End Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowEndDateModal(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.dateButtonText, !endDate && styles.dateButtonPlaceholder, { color: endDate ? colors.text : colors.textSecondary }]}>
              {endDate || 'Select end date'}
            </Text>
            {endDate && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setEndDate('');
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises *</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowExerciseModal(true)}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={[styles.addButtonText, { color: colors.white }]}>Add Exercise</Text>
          </TouchableOpacity>
        </View>
        {scheduleType !== '1-day' && (
          <View style={styles.dayTabs}>
            {Array.from({ length: scheduleType === '2-day' ? 2 : 3 }, (_, i) => i + 1).map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayTab, { backgroundColor: colors.backgroundSecondary }, selectedDay === day && [styles.dayTabActive, { backgroundColor: colors.primary }]]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayTabText, { color: colors.textSecondary }, selectedDay === day && [styles.dayTabTextActive, { color: colors.white }]]}>
                  Day {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {exercisesForSelectedDay.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <Ionicons name="fitness-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No exercises added</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {scheduleType !== '1-day' ? `Tap "Add Exercise" to add exercises for Day ${selectedDay}` : 'Tap "Add Exercise" to get started'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={exercisesForSelectedDay}
            keyExtractor={(item, index) => `${item.exerciseId}-${item.scheduleDay || 'single'}-${index}`}
            renderItem={({ item, index }) => {
              const actualIndex = exercisesForSelectedDay.findIndex(ex =>
                ex.exerciseId === item.exerciseId &&
                (scheduleType === '1-day' || ex.scheduleDay === item.scheduleDay)
              );
              return renderExerciseItem({ item, index: actualIndex });
            }}
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Add any additional notes about this schedule..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        onPress={onSave}
        disabled={!canSave}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled, { backgroundColor: colors.primary }]}
      >
        <Text style={[styles.saveButtonText, { color: colors.white }]}>{saving ? 'Creating...' : 'Create Schedule'}</Text>
      </TouchableOpacity>

      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Exercise</Text>
            <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search exercises..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                placeholderTextColor={colors.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {loadingExercises ? (
            <View style={styles.modalLoading}>
              <Text style={{ color: colors.text }}>Loading exercises...</Text>
            </View>
          ) : (
            <FlatList
              data={availableExercises.filter(item =>
                item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category?.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.exerciseListItem, { borderBottomColor: colors.border }]}
                  onPress={() => addExercise(item)}
                >
                  <Text style={[styles.exerciseListItemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.exerciseListItemMeta, { color: colors.textSecondary }]}>{item.category} · {item.difficulty}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No exercises found</Text>}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showStartDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStartDateModal(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={[styles.calendarModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.calendarModalHeader}>
              <Text style={[styles.calendarModalTitle, { color: colors.text }]}>Select Start Date</Text>
              <TouchableOpacity onPress={() => setShowStartDateModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day) => {
                setStartDate(day.dateString);
                setShowStartDateModal(false);
              }}
              markedDates={startDate ? { [startDate]: { selected: true, selectedColor: colors.primary } } : {}}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                dotColor: colors.primary,
                selectedDotColor: '#FFFFFF',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEndDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndDateModal(false)}
      >
        <View style={styles.calendarModalContainer}>
          <View style={[styles.calendarModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.calendarModalHeader}>
              <Text style={[styles.calendarModalTitle, { color: colors.text }]}>Select End Date</Text>
              <TouchableOpacity onPress={() => setShowEndDateModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={(day) => {
                setEndDate(day.dateString);
                setShowEndDateModal(false);
              }}
              markedDates={endDate ? { [endDate]: { selected: true, selectedColor: colors.primary } } : {}}
              minDate={startDate || new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: colors.surface,
                calendarBackground: colors.surface,
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.textSecondary,
                dotColor: colors.primary,
                selectedDotColor: '#FFFFFF',
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing['2xl'] },
  header: { marginBottom: theme.spacing.xl },
  title: { fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: theme.typography.fontSize.md },
  section: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.md },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs },
  input: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, fontSize: theme.typography.fontSize.md, borderWidth: 1 },
  optionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  optionButton: { flex: 1, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.lg, alignItems: 'center' },
  optionButtonActive: {},
  optionText: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  optionTextActive: {},
  goalsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  goalButton: { paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.lg, borderWidth: 1 },
  goalButtonActive: {},
  goalText: { fontSize: theme.typography.fontSize.sm },
  goalTextActive: { fontWeight: theme.typography.fontWeight.semibold },
  addButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.lg, gap: theme.spacing.xs },
  addButtonText: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  emptyState: { alignItems: 'center', padding: theme.spacing.xl, borderRadius: theme.borderRadius.xl },
  emptyText: { fontSize: theme.typography.fontSize.md, marginTop: theme.spacing.md },
  emptySubtext: { fontSize: theme.typography.fontSize.sm, marginTop: theme.spacing.xs },
  exerciseCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.md, marginBottom: theme.spacing.md, ...theme.shadows.medium },
  exerciseHeader: { marginBottom: theme.spacing.md },
  exerciseInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.bold, flex: 1 },
  removeButton: { padding: theme.spacing.xs },
  exerciseFields: { gap: theme.spacing.sm },
  fieldRow: { flexDirection: 'row', gap: theme.spacing.sm },
  field: { flex: 1 },
  fieldLabel: { fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs },
  fieldInput: { borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, fontSize: theme.typography.fontSize.sm },
  daySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  dayButton: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.borderRadius.md },
  dayButtonActive: {},
  dayButtonText: { fontSize: theme.typography.fontSize.xs },
  dayButtonTextActive: { fontWeight: theme.typography.fontWeight.semibold },
  dayTabs: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  dayTab: { flex: 1, paddingVertical: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.borderRadius.lg, alignItems: 'center' },
  dayTabActive: {},
  dayTabText: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold },
  dayTabTextActive: {},
  setRepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  setRepRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: theme.spacing.xs, gap: theme.spacing.xs },
  setRepLabel: { fontSize: theme.typography.fontSize.xs, marginBottom: theme.spacing.xs },
  addSetRepButton: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  addSetRepText: { fontSize: theme.typography.fontSize.xs, fontWeight: theme.typography.fontWeight.semibold },
  removeSetRepButton: { padding: theme.spacing.xs, justifyContent: 'center', alignItems: 'center' },
  saveButton: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg, ...theme.shadows.medium },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  exerciseListItem: { padding: theme.spacing.md, borderBottomWidth: 1 },
  exerciseListItemName: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs },
  exerciseListItemMeta: { fontSize: theme.typography.fontSize.sm },
  dateButton: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: 1, gap: theme.spacing.sm },
  dateButtonText: { flex: 1, fontSize: theme.typography.fontSize.md },
  dateButtonPlaceholder: {},
  clearButton: { padding: theme.spacing.xs },
  calendarModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  calendarModalContent: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, width: '90%', maxWidth: 400, ...theme.shadows.heavy },
  calendarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  calendarModalTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold },
  searchContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
  },
});

export default CreateScheduleScreen;



