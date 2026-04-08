import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { instructorAPI } from '../../api/instructor.api';

const ClientProgressScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { clientId, clientName } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await instructorAPI.getClientMeasurements(clientId);
      setProgressData(res?.data || null);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load client progress');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      loadData();
    }
  }, [clientId, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
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
    return value < 0 ? colors.success : value > 0 ? colors.error : colors.textSecondary;
  };

  const getProgressIcon = (value) => {
    if (value === null || value === undefined) return 'remove';
    return value < 0 ? 'arrow-down' : value > 0 ? 'arrow-up' : 'remove';
  };

  const MeasurementCard = ({ label, current, progress, unit }) => {
    if (current === null || current === undefined) return null;

    const progressValue = progress !== null && progress !== undefined ? progress : null;

    return (
      <View style={[styles.measurementCard, { backgroundColor: colors.card }]}>
        <View style={styles.measurementHeader}>
          <Text style={[styles.measurementLabel, { color: colors.textSecondary }]}>{label}</Text>
          {progressValue !== null && (
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
        <View style={styles.measurementValue}>
          <Text style={[styles.valueNumber, { color: colors.text }]}>{current.toFixed(1)}</Text>
          <Text style={[styles.valueUnit, { color: colors.textSecondary }]}>{unit}</Text>
        </View>
      </View>
    );
  };

  if (loading && !progressData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading client progress...</Text>
      </View>
    );
  }

  const { latest, progress, measurements } = progressData || {};

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Client Progress</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{clientName || 'Client'}</Text>
      </View>

      {!latest ? (
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Measurements Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            This client hasn't added any body measurements yet.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Measurements</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {latest && formatDate(latest.measurementDate)}
            </Text>
          </View>

          <View style={styles.measurementsGrid}>
            <MeasurementCard
              label="Weight"
              current={latest.weight}
              progress={progress?.weight}
              unit="kg"
            />

            <MeasurementCard
              label="Chest"
              current={latest.chest}
              progress={progress?.chest}
              unit="cm"
            />

            <MeasurementCard
              label="Waist"
              current={latest.waist}
              progress={progress?.waist}
              unit="cm"
            />

            <MeasurementCard
              label="Hips"
              current={latest.hips}
              progress={progress?.hips}
              unit="cm"
            />

            <MeasurementCard
              label="Neck"
              current={latest.neck}
              progress={progress?.neck}
              unit="cm"
            />

            <MeasurementCard
              label="Shoulders"
              current={latest.shoulders}
              progress={progress?.shoulders}
              unit="cm"
            />

            <MeasurementCard
              label="Left Arm"
              current={latest.leftArm}
              progress={progress?.leftArm}
              unit="cm"
            />

            <MeasurementCard
              label="Right Arm"
              current={latest.rightArm}
              progress={progress?.rightArm}
              unit="cm"
            />

            <MeasurementCard
              label="Left Thigh"
              current={latest.leftThigh}
              progress={progress?.leftThigh}
              unit="cm"
            />

            <MeasurementCard
              label="Right Thigh"
              current={latest.rightThigh}
              progress={progress?.rightThigh}
              unit="cm"
            />

            {latest.bodyFatPercentage && (
              <MeasurementCard
                label="Body Fat %"
                current={latest.bodyFatPercentage}
                progress={progress?.bodyFatPercentage}
                unit="%"
              />
            )}
          </View>

          {measurements && measurements.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Measurement History</Text>
              <View style={styles.historyContainer}>
                {measurements.slice(0, 10).map((measurement, index) => (
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
        </>
      )}
    </ScrollView>
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.sm,
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
  measurementValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
  },
  valueNumber: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
  },
  valueUnit: {
    fontSize: theme.typography.fontSize.md,
  },
  historyContainer: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});

export default ClientProgressScreen;










