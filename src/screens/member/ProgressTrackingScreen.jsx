import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { measurementAPI } from '../../api/measurement.api';
import BackButton from '../../components/common/BackButton';

const ProgressTrackingScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [progressRes, historyRes] = await Promise.all([
        measurementAPI.getProgressComparison(),
        measurementAPI.getMeasurementHistory({ limit: 10 })
      ]);

      setProgressData(progressRes?.data || null);
      setHistory(historyRes?.data?.measurements || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load progress data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getProgressColor = (value) => {
    if (value === null || value === undefined) return colors.textSecondary;
    // For weight, negative is good (losing weight), positive is bad
    // For measurements like waist, negative is good (losing inches), positive is bad
    // For muscle measurements like chest/arms, positive is good, negative is bad
    return value < 0 ? colors.success : value > 0 ? colors.error : colors.textSecondary;
  };

  const getProgressIcon = (value) => {
    if (value === null || value === undefined) return 'remove';
    return value < 0 ? 'arrow-down' : value > 0 ? 'arrow-up' : 'remove';
  };

  const MeasurementCard = ({ label, current, previous, progress, unit, isWeight = false }) => {
    if (current === null || current === undefined) return null;

    const progressValue = progress !== null && progress !== undefined ? progress : null;
    const showProgress = previous !== null && previous !== undefined;

    return (
      <View style={[styles.measurementCard, { backgroundColor: colors.surface }]}>
        <View style={styles.measurementHeader}>
          <Text style={[styles.measurementLabel, { color: colors.textSecondary }]}>{label}</Text>
          {showProgress && progressValue !== null && (
            <View style={[styles.progressBadge, { backgroundColor: getProgressColor(progressValue) + '20' }]}>
              <Ionicons
                name={getProgressIcon(progressValue)}
                size={14}
                color={getProgressColor(progressValue)}
              />
              <Text style={[styles.progressText, { color: getProgressColor(progressValue) }]}>
                {formatPercentage(progressValue)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.measurementValues}>
          <View style={styles.currentValue}>
            <Text style={[styles.valueNumber, { color: colors.text }]}>{current.toFixed(1)}</Text>
            <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>{unit}</Text>
          </View>
          {showProgress && previous !== null && previous !== undefined && (
            <View style={styles.previousValue}>
              <Text style={[styles.previousLabel, { color: colors.textSecondary }]}>Previous</Text>
              <Text style={[styles.previousNumber, { color: colors.textSecondary }]}>{previous.toFixed(1)} {unit}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading progress...</Text>
      </View>
    );
  }

  const { current, previous, progress, message } = progressData || {};

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 10 }]}
      >
        {/* Decorative circles */}
        <View style={styles.headerCircle1} />
        <View style={styles.headerCircle2} />
        <View style={styles.headerTop}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Progress Tracking</Text>
            <Text style={styles.headerSubtitle}>Track your body measurements</Text>
          </View>
          <TouchableOpacity
            style={styles.addButtonHeader}
            onPress={() => navigation.navigate('AddMeasurement')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        {current && (
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{current.weight?.toFixed(1) || '—'}</Text>
              <Text style={styles.quickStatLabel}>Weight (kg)</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{history.length}</Text>
              <Text style={styles.quickStatLabel}>Records</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>
                {progress?.weight ? `${progress.weight > 0 ? '+' : ''}${progress.weight.toFixed(1)}%` : '—'}
              </Text>
              <Text style={styles.quickStatLabel}>Change</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />}
        showsVerticalScrollIndicator={false}
      >

        {!current ? (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Measurements Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start tracking your progress by adding your first measurement
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddMeasurement')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add First Measurement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {message && (
              <View style={[styles.messageCard, { backgroundColor: colors.primary + '10' }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.messageText, { color: colors.text }]}>{message}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Measurements</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                {current && formatDate(current.measurementDate)}
              </Text>
            </View>

            <View style={styles.measurementsGrid}>
              <MeasurementCard
                label="Weight"
                current={current.weight}
                previous={previous?.weight}
                progress={progress?.weight}
                unit="kg"
                isWeight
              />

              <MeasurementCard
                label="Chest"
                current={current.chest}
                previous={previous?.chest}
                progress={progress?.chest}
                unit="cm"
              />

              <MeasurementCard
                label="Waist"
                current={current.waist}
                previous={previous?.waist}
                progress={progress?.waist}
                unit="cm"
              />

              <MeasurementCard
                label="Hips"
                current={current.hips}
                previous={previous?.hips}
                progress={progress?.hips}
                unit="cm"
              />

              <MeasurementCard
                label="Neck"
                current={current.neck}
                previous={previous?.neck}
                progress={progress?.neck}
                unit="cm"
              />

              <MeasurementCard
                label="Shoulders"
                current={current.shoulders}
                previous={previous?.shoulders}
                progress={progress?.shoulders}
                unit="cm"
              />

              <MeasurementCard
                label="Left Arm"
                current={current.leftArm}
                previous={previous?.leftArm}
                progress={progress?.leftArm}
                unit="cm"
              />

              <MeasurementCard
                label="Right Arm"
                current={current.rightArm}
                previous={previous?.rightArm}
                progress={progress?.rightArm}
                unit="cm"
              />

              <MeasurementCard
                label="Left Thigh"
                current={current.leftThigh}
                previous={previous?.leftThigh}
                progress={progress?.leftThigh}
                unit="cm"
              />

              <MeasurementCard
                label="Right Thigh"
                current={current.rightThigh}
                previous={previous?.rightThigh}
                progress={progress?.rightThigh}
                unit="cm"
              />

              {current.bodyFatPercentage && (
                <MeasurementCard
                  label="Body Fat %"
                  current={current.bodyFatPercentage}
                  previous={previous?.bodyFatPercentage}
                  progress={progress?.bodyFatPercentage}
                  unit="%"
                />
              )}
            </View>

            {history.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Measurement History</Text>
                <View style={styles.historyContainer}>
                  {history.map((measurement, index) => (
                    <View key={measurement._id || index} style={[styles.historyItem, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={styles.historyDate}>
                        <Text style={[styles.historyDateText, { color: colors.text }]}>
                          {formatDate(measurement.measurementDate)}
                        </Text>
                      </View>
                      <View style={styles.historyDetails}>
                        <Text style={[styles.historyWeight, { color: colors.text }]}>
                          {measurement.weight.toFixed(1)} kg
                        </Text>
                        {measurement.waist && (
                          <Text style={[styles.historyMeasurement, { color: colors.textSecondary }]}>
                            Waist: {measurement.waist.toFixed(1)} cm
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('AddMeasurement')}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Measurement</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
  },
  headerGradient: {
    paddingBottom: theme.spacing[5],
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  addButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing[3],
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  messageText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
  },
  measurementsGrid: {
    gap: theme.spacing.md,
  },
  measurementCard: {
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  measurementLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs / 2,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  measurementValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  valueNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  valueUnit: {
    fontSize: theme.typography.fontSize.md,
  },
  previousValue: {
    alignItems: 'flex-end',
  },
  previousLabel: {
    fontSize: theme.typography.fontSize.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  previousNumber: {
    fontSize: theme.typography.fontSize.sm,
  },
  historyContainer: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  historyDate: {
    flex: 1,
  },
  historyDateText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  historyDetails: {
    alignItems: 'flex-end',
  },
  historyWeight: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs / 2,
  },
  historyMeasurement: {
    fontSize: theme.typography.fontSize.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
    marginTop: theme.spacing[4],
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 22,
    opacity: 0.8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ProgressTrackingScreen;

