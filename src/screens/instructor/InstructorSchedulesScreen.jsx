import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI } from '../../api/schedule.api';

const InstructorSchedulesScreen = () => {
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await scheduleAPI.getMySchedules();
      const data = res?.data?.items || res?.items || res?.data || [];
      // Filter to show only schedules created by the instructor
      // The API returns schedules where createdBy or assignedTo matches, so we filter by createdBy
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh when screen comes into focus (e.g., after creating a schedule)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        load();
      }
    }, [load, loading])
  );

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No date specified';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => navigation.navigate('ScheduleDetail', { id: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="fitness" size={24} color={colors.primary} />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name || 'Training Schedule'}</Text>
            {item.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
                <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
                  {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      {item.description && (
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      )}

      <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
        {item.startDate && (
          <View style={styles.cardDetailItem}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>
              {item.startDate && item.endDate
                ? `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`
                : formatDate(item.startDate)}
            </Text>
          </View>
        )}
        {item.exercises && item.exercises.length > 0 && (
          <View style={styles.cardDetailItem}>
            <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>
              {item.exercises.length} exercise{item.exercises.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
        {item.assignedTo && (
          <View style={styles.cardDetailItem}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>Assigned</Text>
          </View>
        )}
        {item.isTemplate && (
          <View style={styles.cardDetailItem}>
            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.cardDetailText, { color: colors.textSecondary }]}>Template</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && items.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Schedules</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your training schedules</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('CreateSchedule')}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={[styles.primaryBtnText, { color: colors.white }]}>Create</Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No schedules yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create your first training schedule to get started</Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('CreateSchedule')}
              >
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={[styles.emptyButtonText, { color: colors.white }]}>Create Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={items.length === 0 ? styles.emptyList : { paddingBottom: 24 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: theme.spacing.lg },
  title: { fontSize: theme.typography.fontSize['3xl'], fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: theme.typography.fontSize.sm },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.md, gap: theme.spacing.sm },
  error: { flex: 1, fontSize: theme.typography.fontSize.sm },
  card: { borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.md, ...theme.shadows.medium },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing.md },
  iconContainer: { width: 48, height: 48, borderRadius: theme.borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitleContainer: { flex: 1, gap: theme.spacing.xs },
  cardTitle: { fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.bold },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  difficultyText: { fontSize: theme.typography.fontSize.xs, fontWeight: theme.typography.fontWeight.semibold },
  cardDescription: { fontSize: theme.typography.fontSize.sm, marginBottom: theme.spacing.md, lineHeight: theme.typography.fontSize.sm * 1.5 },
  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1 },
  cardDetailItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  cardDetailText: { fontSize: theme.typography.fontSize.sm },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.lg, gap: theme.spacing.xs, ...theme.shadows.small },
  primaryBtnText: { fontWeight: theme.typography.fontWeight.semibold, fontSize: theme.typography.fontSize.sm },
  emptyList: { flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing['3xl'], paddingHorizontal: theme.spacing.xl },
  emptyText: { fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  emptySubtext: { fontSize: theme.typography.fontSize.sm, textAlign: 'center', marginBottom: theme.spacing.xl },
  emptyButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderRadius: theme.borderRadius.lg, gap: theme.spacing.sm, ...theme.shadows.medium },
  emptyButtonText: { fontWeight: theme.typography.fontWeight.semibold, fontSize: theme.typography.fontSize.md },
});

export default InstructorSchedulesScreen;

