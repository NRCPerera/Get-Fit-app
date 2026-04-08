import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { nutritionAPI } from '../../api/nutrition.api';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import DatePickerInput from '../../components/common/DatePickerInput';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const CreateNutritionPlanScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { clientId, clientName } = route.params || {};

  // If clientId is provided, it's an instructor creating for a client
  // Otherwise, it's a member creating for themselves
  const isForClient = !!clientId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meals, setMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState('');
  const [dailyProtein, setDailyProtein] = useState('');
  const [dailyCarbs, setDailyCarbs] = useState('');
  const [dailyFats, setDailyFats] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [restrictionInput, setRestrictionInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addMeal = (mealType) => {
    setMeals([...meals, {
      mealType,
      name: '',
      time: '',
      foods: [],
      instructions: ''
    }]);
  };

  const removeMeal = (index) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const updateMeal = (index, field, value) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], [field]: value };
    setMeals(updated);
  };

  const addFoodToMeal = (mealIndex) => {
    const updated = [...meals];
    updated[mealIndex].foods = [...(updated[mealIndex].foods || []), {
      name: '',
      quantity: 0,
      unit: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    }];
    setMeals(updated);
  };

  const removeFoodFromMeal = (mealIndex, foodIndex) => {
    const updated = [...meals];
    updated[mealIndex].foods = updated[mealIndex].foods.filter((_, i) => i !== foodIndex);
    setMeals(updated);
  };

  const updateFood = (mealIndex, foodIndex, field, value) => {
    const updated = [...meals];
    const food = updated[mealIndex].foods[foodIndex];
    updated[mealIndex].foods[foodIndex] = {
      ...food,
      [field]: field === 'name' || field === 'unit' ? value : parseFloat(value) || 0
    };
    setMeals(updated);
  };

  const addRestriction = () => {
    const restriction = restrictionInput.trim();
    if (restriction && !dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
      setRestrictionInput('');
    }
  };

  const removeRestriction = (restriction) => {
    setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a plan title');
      return;
    }

    // Only require clientId if it's an instructor creating for a client
    if (isForClient && !clientId) {
      Alert.alert('Error', 'Client ID is missing');
      return;
    }

    if (meals.length === 0) {
      Alert.alert('Error', 'Please add at least one meal');
      return;
    }

    // Validate meals have foods
    for (let i = 0; i < meals.length; i++) {
      if (!meals[i].foods || meals[i].foods.length === 0) {
        Alert.alert('Error', `Please add at least one food item to ${meals[i].mealType}`);
        return;
      }
      // Validate food names
      for (let j = 0; j < meals[i].foods.length; j++) {
        if (!meals[i].foods[j].name.trim()) {
          Alert.alert('Error', `Please enter a name for all food items in ${meals[i].mealType}`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      const payload = {
        // Only include userId if it's for a client (instructor creating for client)
        // Otherwise, backend will use the logged-in user's ID
        ...(isForClient && clientId ? { userId: clientId } : {}),
        title: title.trim(),
        description: description.trim() || undefined,
        meals: meals.map(meal => ({
          mealType: meal.mealType,
          name: meal.name.trim() || undefined,
          time: meal.time.trim() || undefined,
          foods: meal.foods.map(food => ({
            name: food.name.trim(),
            quantity: food.quantity || 0,
            unit: food.unit.trim() || undefined,
            calories: food.calories || 0,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fats: food.fats || 0
          })),
          instructions: meal.instructions.trim() || undefined
        })),
        dailyCalories: dailyCalories ? parseFloat(dailyCalories) : undefined,
        dailyProtein: dailyProtein ? parseFloat(dailyProtein) : undefined,
        dailyCarbs: dailyCarbs ? parseFloat(dailyCarbs) : undefined,
        dailyFats: dailyFats ? parseFloat(dailyFats) : undefined,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        notes: notes.trim() || undefined
      };

      await nutritionAPI.createPlan(payload);
      Alert.alert('Success', 'Nutrition plan created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create nutrition plan');
    } finally {
      setSaving(false);
    }
  };

  if (saving) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingWrapper style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create Nutrition Plan</Text>
        {isForClient && clientName && (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>For: {clientName}</Text>
        )}
        {!isForClient && (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Create your personal nutrition plan</Text>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Plan Title *"
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Description (optional)"
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Targets (optional)</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Calories"
            placeholderTextColor={colors.textSecondary}
            value={dailyCalories}
            onChangeText={setDailyCalories}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Protein (g)"
            placeholderTextColor={colors.textSecondary}
            value={dailyProtein}
            onChangeText={setDailyProtein}
            keyboardType="numeric"
          />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Carbs (g)"
            placeholderTextColor={colors.textSecondary}
            value={dailyCarbs}
            onChangeText={setDailyCarbs}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="Fats (g)"
            placeholderTextColor={colors.textSecondary}
            value={dailyFats}
            onChangeText={setDailyFats}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Meals</Text>
      <View style={styles.mealTypeButtons}>
        {MEAL_TYPES.map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.mealTypeButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => addMeal(type)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.mealTypeButtonText, { color: colors.primary }]}>Add {type.charAt(0).toUpperCase() + type.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {meals.map((meal, mealIndex) => (
        <View key={mealIndex} style={[styles.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealTypeLabel, { color: colors.primary }]}>
              {meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}
            </Text>
            <TouchableOpacity onPress={() => removeMeal(mealIndex)}>
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            placeholder="Meal name (optional)"
            placeholderTextColor={colors.textSecondary}
            value={meal.name}
            onChangeText={(value) => updateMeal(mealIndex, 'name', value)}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            placeholder="Time (e.g., 8:00 AM)"
            placeholderTextColor={colors.textSecondary}
            value={meal.time}
            onChangeText={(value) => updateMeal(mealIndex, 'time', value)}
          />

          <Text style={[styles.subsectionTitle, { color: colors.text }]}>Foods</Text>
          {meal.foods.map((food, foodIndex) => (
            <View key={foodIndex} style={[styles.foodCard, { backgroundColor: colors.backgroundSecondary }]}>
              <View style={styles.foodHeader}>
                <Text style={[styles.foodNumber, { color: colors.textSecondary }]}>Food {foodIndex + 1}</Text>
                <TouchableOpacity onPress={() => removeFoodFromMeal(mealIndex, foodIndex)}>
                  <Ionicons name="close" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Food name *"
                placeholderTextColor={colors.textSecondary}
                value={food.name}
                onChangeText={(value) => updateFood(mealIndex, foodIndex, 'name', value)}
              />
              <View style={styles.row}>
                <View style={styles.thirdInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Quantity"
                    placeholderTextColor={colors.textSecondary}
                    value={food.quantity.toString()}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'quantity', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.thirdInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Unit (g, oz, etc.)"
                    placeholderTextColor={colors.textSecondary}
                    value={food.unit}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'unit', value)}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.quarterInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Calories"
                    placeholderTextColor={colors.textSecondary}
                    value={food.calories.toString()}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'calories', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Protein"
                    placeholderTextColor={colors.textSecondary}
                    value={food.protein.toString()}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'protein', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Carbs"
                    placeholderTextColor={colors.textSecondary}
                    value={food.carbs.toString()}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'carbs', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.quarterInput}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                    placeholder="Fats"
                    placeholderTextColor={colors.textSecondary}
                    value={food.fats.toString()}
                    onChangeText={(value) => updateFood(mealIndex, foodIndex, 'fats', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addFoodButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => addFoodToMeal(mealIndex)}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.addFoodButtonText, { color: colors.primary }]}>Add Food</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.multiline, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            placeholder="Instructions (optional)"
            placeholderTextColor={colors.textSecondary}
            value={meal.instructions}
            onChangeText={(value) => updateMeal(mealIndex, 'instructions', value)}
            multiline
            numberOfLines={2}
          />
        </View>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Dietary Restrictions (optional)</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8, backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          placeholder="Add restriction"
          placeholderTextColor={colors.textSecondary}
          value={restrictionInput}
          onChangeText={setRestrictionInput}
          onSubmitEditing={addRestriction}
        />
        <Button title="Add" onPress={addRestriction} />
      </View>
      <View style={styles.chipContainer}>
        {dietaryRestrictions.map((restriction, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => removeRestriction(restriction)}
          >
            <Text style={[styles.chipText, { color: colors.text }]}>{restriction}</Text>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Dates (optional)</Text>
      <View style={styles.row}>
        <View style={styles.halfInput}>
          <DatePickerInput
            label="Start Date"
            value={startDate}
            onDateChange={setStartDate}
            placeholder="Select start date"
          />
        </View>
        <View style={styles.halfInput}>
          <DatePickerInput
            label="End Date"
            value={endDate}
            onDateChange={setEndDate}
            placeholder="Select end date"
            minDate={startDate}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
        placeholder="Additional notes"
        placeholderTextColor={colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Create Plan"
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </KeyboardAvoidingWrapper>
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
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  subsectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  quarterInput: {
    flex: 1,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  mealTypeButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  mealCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  mealTypeLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  foodCard: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  foodNumber: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  addFoodButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
  },
  buttonContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
});

export default CreateNutritionPlanScreen;

