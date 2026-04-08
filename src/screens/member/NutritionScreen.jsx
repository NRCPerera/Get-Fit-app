import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { nutritionAPI } from '../../api/nutrition.api';
import Card from '../../components/common/Card';
import BackButton from '../../components/common/BackButton';

const NutritionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await nutritionAPI.getMyPlans();
      const data = res?.data?.items || res?.items || res?.data || [];
      setItems(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load nutrition plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const getMealCount = (item) => {
    return item.meals?.length || 0;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
      onPress={() => navigation.navigate('NutritionDetail', { id: item._id })}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconContainer, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="nutrition" size={24} color={colors.success} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title || 'Nutrition Plan'}</Text>
          <View style={styles.cardStats}>
            {item.dailyCalories ? (
              <View style={[styles.statBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="flame" size={14} color={colors.warning} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.dailyCalories} kcal/day</Text>
              </View>
            ) : item.totalCalories ? (
              <View style={[styles.statBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="flame" size={14} color={colors.warning} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{item.totalCalories} kcal</Text>
              </View>
            ) : null}
            {getMealCount(item) > 0 && (
              <View style={[styles.statBadge, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="restaurant" size={14} color={colors.secondary} />
                <Text style={[styles.statText, { color: colors.textSecondary }]}>{getMealCount(item)} meals</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </View>
      </View>
      {item.description && (
        <Text style={[styles.cardDescription, { color: colors.textSecondary, borderTopColor: colors.border }]} numberOfLines={2}>{item.description}</Text>
      )}
    </TouchableOpacity>
  );

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
        <View style={styles.headerContent}>
          <BackButton style={styles.backButton} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Nutrition Plans</Text>
            <Text style={styles.headerSubtitle}>Your personalized meal plans</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateNutritionPlan')}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Plans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {items.reduce((acc, i) => acc + (i.meals?.length || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Meals</Text>
          </View>
        </View>
      </LinearGradient>

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.success} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="nutrition-outline" size={48} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Nutrition Plans Yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create your first nutrition plan to start tracking your meals and calories</Text>
            <TouchableOpacity
              style={[styles.createPlanButton, { backgroundColor: colors.success }]}
              onPress={() => navigation.navigate('CreateNutritionPlan')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.createPlanButtonText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: theme.spacing[6],
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing[4],
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing[4],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing[2],
  },
  error: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
  },
  listContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  card: {
    borderRadius: 20,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: theme.spacing[3],
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: theme.spacing[1],
    letterSpacing: -0.3,
  },
  cardStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardDescription: {
    marginTop: theme.spacing[3],
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[6],
    marginTop: theme.spacing[8],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[5],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: theme.spacing[2],
    letterSpacing: -0.5,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing[6],
    opacity: 0.8,
  },
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  createPlanButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export { NutritionScreen };
