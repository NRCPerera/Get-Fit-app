import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { nutritionAPI } from '../../api/nutrition.api';

const NutritionDetailScreen = () => {
  const route = useRoute();
  const { id } = route.params || {};
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

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

  useEffect(() => { load(); }, [load]);

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
      {plan && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{plan.title || 'Nutrition Plan'}</Text>
          {plan.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{plan.description}</Text> : null}
          
          <View style={[styles.metaContainer, { borderTopColor: colors.border }]}>
            {plan.dailyCalories && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Calories: {plan.dailyCalories} kcal</Text>
            )}
            {plan.dailyProtein && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Protein: {plan.dailyProtein}g</Text>
            )}
            {plan.dailyCarbs && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Carbs: {plan.dailyCarbs}g</Text>
            )}
            {plan.dailyFats && (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>Daily Fats: {plan.dailyFats}g</Text>
            )}
          </View>

          {plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0 && (
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
                    {meal.time && (
                      <Text style={[styles.mealTime, { color: colors.textSecondary }]}>{meal.time}</Text>
                    )}
                  </View>
                  {meal.name && (
                    <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                  )}
                  
                  {Array.isArray(meal.foods) && meal.foods.length > 0 ? (
                    <View style={styles.foodsContainer}>
                      {meal.foods.map((food, foodIdx) => (
                        <View key={`food-${foodIdx}`} style={styles.foodItem}>
                          <Text style={[styles.foodName, { color: colors.text }]}>• {food.name}</Text>
                          <View style={styles.foodDetails}>
                            {food.quantity > 0 && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                {food.quantity} {food.unit || 'serving'}
                              </Text>
                            )}
                            {food.calories > 0 && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                {food.calories} kcal
                              </Text>
                            )}
                            {(food.protein > 0 || food.carbs > 0 || food.fats > 0) && (
                              <Text style={[styles.foodDetail, { color: colors.textSecondary }]}>
                                P: {food.protein}g C: {food.carbs}g F: {food.fats}g
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                  
                  {meal.instructions && (
                    <Text style={[styles.mealInstructions, { color: colors.textSecondary }]}>{meal.instructions}</Text>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {plan.notes && (
            <View style={[styles.notesContainer, { borderTopColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{plan.notes}</Text>
            </View>
          )}

          {(plan.startDate || plan.endDate) && (
            <View style={[styles.datesContainer, { borderTopColor: colors.border }]}>
              {plan.startDate && (
                <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                  Start: {new Date(plan.startDate).toLocaleDateString()}
                </Text>
              )}
              {plan.endDate && (
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



