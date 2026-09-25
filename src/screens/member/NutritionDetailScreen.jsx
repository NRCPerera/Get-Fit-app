import React, { useCallback, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { nutritionAPI } from '../../api/nutrition.api';
import Button from '../../components/common/Button';

const NutritionDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params || {};
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const user = useSelector((state) => state.auth.user);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await nutritionAPI.getPlanById(id);
      const data = res?.data?.plan || res?.data || res;
      setPlan(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load plan');
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const creatorId = plan?.createdBy?._id || plan?.createdBy;
  const userId = user?._id || user?.id;
  const canManage = Boolean(
    plan && userId && (user?.role === 'admin' || String(creatorId) === String(userId))
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete nutrition plan?',
      'This plan will be removed from your nutrition plans.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await nutritionAPI.deletePlan(plan._id);
              Alert.alert('Plan deleted', 'The nutrition plan was deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (deleteError) {
              Alert.alert('Error', deleteError?.response?.data?.message || 'Failed to delete nutrition plan');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!plan && !error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      {Boolean(plan) && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{plan.title || 'Nutrition Plan'}</Text>
          {plan.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{plan.description}</Text> : null}

          {canManage ? (
            <View style={styles.actions}>
              <Button
                title="Edit"
                icon="create-outline"
                variant="outline"
                onPress={() => navigation.navigate('EditNutritionPlan', { planId: plan._id })}
                disabled={deleting}
                style={styles.actionButton}
              />
              <Button
                title="Delete"
                icon="trash-outline"
                variant="danger"
                onPress={handleDelete}
                loading={deleting}
                style={styles.actionButton}
              />
            </View>
          ) : null}
          
          <View style={[styles.metaContainer, { borderTopColor: colors.border }]}>
            {Boolean(plan.dailyCalories) && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Calories: {plan.dailyCalories} kcal</Text>
            )}
            {Boolean(plan.dailyProtein) && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Protein: {plan.dailyProtein}g</Text>
            )}
            {Boolean(plan.dailyCarbs) && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Carbs: {plan.dailyCarbs}g</Text>
            )}
            {Boolean(plan.dailyFats) && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Fats: {plan.dailyFats}g</Text>
            )}
          </View>

          {Boolean(plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0) && (
            <View style={styles.restrictionsContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Dietary Restrictions</Text>
              <View style={styles.chipContainer}>
                {plan.dietaryRestrictions.map((restriction, idx) => (
                  <View key={idx} style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.chipText, { color: colors.text }]}>{restriction}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {Array.isArray(plan.meals) && plan.meals.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Meals</Text>
              {plan.meals.map((meal, idx) => (
                <View key={`meal-${idx}`} style={[styles.meal, { borderTopColor: colors.border }]}>
                  <View style={styles.mealHeader}>
                    <Text style={[styles.mealType, { color: colors.primary }]}>
                      {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
                    </Text>
                    {Boolean(meal.time) && (
                      <Text style={[styles.mealTime, { color: colors.textSecondary }]}>{meal.time}</Text>
                    )}
                  </View>
                  {Boolean(meal.name) && (
                    <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                  )}
                  
                  {Array.isArray(meal.foods) && meal.foods.length > 0 ? (
                    <View style={styles.foodsContainer}>
                      {meal.foods.map((food, foodIdx) => (
                        <View key={`food-${foodIdx}`} style={styles.foodItem}>
                          <Text style={[styles.foodName, { color: colors.text }]}>• {food.name}</Text>
                          <View style={styles.foodDetails}>
                            {Boolean(food.quantity > 0) && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                {food.quantity} {food.unit || 'serving'}
                              </Text>
                            )}
                            {Boolean(food.calories > 0) && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                {food.calories} kcal
                              </Text>
                            )}
                            {(Boolean(food.protein > 0 || food.carbs > 0 || food.fats > 0)) && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                P: {food.protein}g C: {food.carbs}g F: {food.fats}g
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  
                  {Boolean(meal.instructions) && (
                    <Text style={[styles.mealInstructions, { color: colors.textSecondary }]}>{meal.instructions}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {Boolean(plan.notes) && (
            <View style={[styles.notesContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{plan.notes}</Text>
            </View>
          )}

          {(Boolean(plan.startDate || plan.endDate)) && (
            <View style={[styles.datesContainer, { borderTopColor: colors.border }]}>
              {Boolean(plan.startDate) && (
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  Start: {new Date(plan.startDate).toLocaleDateString()}
                </Text>
              )}
              {Boolean(plan.endDate) && (
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  End: {new Date(plan.endDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.md },
  card: { 
    borderRadius: 20, 
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { 
    fontSize: theme.typography.fontSize['2xl'], 
    fontWeight: theme.typography.fontWeight.bold, 
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.3,
  },
  desc: { 
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  metaContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  meta: { 
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  restrictionsContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
  },
  sectionTitle: { 
    fontWeight: theme.typography.fontWeight.bold, 
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.fontSize.lg,
    letterSpacing: 0.3,
  },
  meal: { 
    paddingVertical: theme.spacing.md, 
    borderTopWidth: 1, 
    marginTop: theme.spacing.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  mealType: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  mealTime: {
    fontSize: theme.typography.fontSize.sm,
  },
  mealName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  foodsContainer: {
    marginTop: theme.spacing.sm,
  },
  foodItem: {
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  foodName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  foodDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  foodDetail: {
    fontSize: theme.typography.fontSize.xs,
  },
  mealInstructions: {
    fontSize: theme.typography.fontSize.sm,
    fontStyle: 'italic',
    marginTop: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  notesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.xs,
  },
  datesContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  error: { marginBottom: 8 },
});

export default NutritionDetailScreen;


