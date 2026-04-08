import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, SafeAreaView, Platform, StatusBar, FlatList } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI } from '../../api/schedule.api';
import { exerciseAPI } from '../../api/exercise.api';
import BackButton from '../../components/common/BackButton';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const EditScheduleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, initialData } = route.params || {};
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const scheduleType = initialData?.scheduleType || '1-day'; // We assume schedule type doesn't change easily, or if it does, it needs extra UI.

  // Ensure dates are parsed to correct string formats
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [startDate, setStartDate] = useState(formatDateForInput(initialData?.startDate));
  const [endDate, setEndDate] = useState(formatDateForInput(initialData?.endDate));
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);

  // --- EXERCISE EDITING STATE ---
  const initialExercises = (initialData?.exercises || []).map(ex => {
      let mappedSetReps = [];
      if (ex.setReps && ex.setReps.length > 0) {
          mappedSetReps = ex.setReps.map(sr => ({ sets: String(sr.sets || ''), reps: String(sr.reps || '') }));
      } else if (ex.sets || ex.reps) {
          mappedSetReps = [{ sets: String(ex.sets || ''), reps: String(ex.reps || '') }];
      } else {
          mappedSetReps = [{ sets: '', reps: '' }];
      }

      return {
          exerciseId: ex.exerciseId?._id || ex.exerciseId || ex.id,
          exerciseName: ex.exerciseId?.name || ex.exerciseName || 'Exercise',
          scheduleDay: ex.scheduleDay,
          setReps: mappedSetReps,
          duration: ex.duration ? String(ex.duration) : '',
          restTime: ex.restTime ? String(ex.restTime) : '',
          notes: ex.notes || '',
          dayOfWeek: ex.dayOfWeek || ''
      };
  });

  const [exercises, setExercises] = useState(initialExercises);
  const [selectedDay, setSelectedDay] = useState(1);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
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

  const exercisesForSelectedDay = useMemo(() => {
    if (scheduleType === '1-day') return exercises;
    return exercises.filter(ex => ex.scheduleDay === selectedDay);
  }, [exercises, scheduleType, selectedDay]);

  const addExercise = (exercise) => {
    const newExercise = {
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      scheduleDay: scheduleType === '1-day' ? undefined : selectedDay,
      setReps: [{ sets: '', reps: '' }], // Start with one set-rep combination
      duration: '',
      restTime: '',
      notes: '',
      dayOfWeek: scheduleType === '1-day' ? '' : undefined,
    };
    setExercises(prev => [...prev, newExercise]);
    setShowExerciseModal(false);
  };

  const removeExercise = (index) => {
    const exerciseToRemove = exercisesForSelectedDay[index];
    setExercises(prev => prev.filter((ex, i) => {
      if (scheduleType === '1-day') return i !== index;
      return !(ex.exerciseId === exerciseToRemove.exerciseId && ex.scheduleDay === exerciseToRemove.scheduleDay);
    }));
  };

  const updateExercise = (index, field, value) => {
    const exerciseToUpdate = exercisesForSelectedDay[index];
    setExercises(prev => prev.map((ex, i) => {
      if (scheduleType === '1-day') return i === index ? { ...ex, [field]: value } : ex;
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
        if (i === index) return { ...ex, setReps: [...(ex.setReps || []), { sets: '', reps: '' }] };
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

  const canSave = useMemo(() => !!name.trim() && !saving, [name, saving]);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
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

          if (scheduleType !== '1-day' && ex.scheduleDay) {
            exerciseData.scheduleDay = ex.scheduleDay;
          }

          if (scheduleType === '1-day' && ex.dayOfWeek) {
            exerciseData.dayOfWeek = ex.dayOfWeek;
          }

          return exerciseData;
        }).filter(ex => ex.setReps && ex.setReps.length > 0),
      };
      await scheduleAPI.updateSchedule(id, payload);
      Alert.alert('Success', 'Schedule updated successfully', [
        { text: 'OK', onPress: () => {
          navigation.navigate('ScheduleDetail', { id, refreshCount: Date.now() }); 
        }}
      ]);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update schedule');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    Alert.alert('Delete Schedule', 'Are you sure you want to delete this schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await scheduleAPI.deleteSchedule(id);
            Alert.alert('Success', 'Schedule deleted successfully', [
              { text: 'OK', onPress: () => navigation.navigate('MySchedules') }
            ]);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete schedule');
          }
        }
      }
    ]);
  };

  // Render a specific exercise block identical to the Creation equivalent
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <BackButton style={styles.backButton} color={colors.text} />
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Schedule</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          <View style={[styles.editCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Schedule Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter schedule name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Enter description"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Start Date</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
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
                style={[styles.dateButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
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
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top', backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Additional notes"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Exercises Section */}
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

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled, { backgroundColor: colors.primary }]}
            onPress={onSave}
            disabled={!canSave}
          >
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={[styles.saveButtonText, { color: colors.white }]}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.error }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.white} />
            <Text style={[styles.deleteButtonText, { color: colors.white }]}>Delete Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Start Date Modal */}
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

        {/* End Date Modal */}
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

        {/* Exercise Selection Modal */}
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

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing['2xl'] },
  section: { marginBottom: theme.spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  sectionTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.md },
  editCard: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.md, ...theme.shadows.medium },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.typography.fontSize.sm, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs },
  input: { borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, fontSize: theme.typography.fontSize.md, borderWidth: 1 },
  actionsContainer: { gap: theme.spacing.md, marginTop: theme.spacing.md },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadows.medium },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, gap: theme.spacing.sm, ...theme.shadows.medium },
  deleteButtonText: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold },
  dateButton: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: 1, gap: theme.spacing.sm },
  dateButtonText: { flex: 1, fontSize: theme.typography.fontSize.md },
  dateButtonPlaceholder: {},
  clearButton: { padding: theme.spacing.xs },
  calendarModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  calendarModalContent: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, width: '90%', maxWidth: 400, ...theme.shadows.heavy },
  calendarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  calendarModalTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold },
  
  // Exercise specific styles ported from CreateScheduleScreen
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
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: theme.spacing.md, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.borderRadius.md, paddingHorizontal: theme.spacing.md, height: 40 },
  searchInput: { flex: 1, marginLeft: theme.spacing.sm, fontSize: theme.typography.fontSize.md },
  exerciseListItem: { padding: theme.spacing.md, borderBottomWidth: 1 },
  exerciseListItemName: { fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.xs },
  exerciseListItemMeta: { fontSize: theme.typography.fontSize.sm },
});

export default EditScheduleScreen;
