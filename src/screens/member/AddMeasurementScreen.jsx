import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { measurementAPI } from '../../api/measurement.api';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';

// MeasurementInput component defined OUTSIDE of AddMeasurementScreen
// This prevents it from being recreated on every parent re-render
const MeasurementInput = ({ label, value, onChange, unit, icon, required = false, colors }) => (
  <View style={styles.inputGroup}>
    <View style={styles.inputLabelRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.label, { color: colors.text }]}>
        {label} {required && <Text style={[styles.required, { color: colors.error }]}>*</Text>}
      </Text>
    </View>
    <View style={[styles.inputContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={`Enter ${label.toLowerCase()}`}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textSecondary}
      />
      {unit && <Text style={[styles.unit, { color: colors.textSecondary }]}>{unit}</Text>}
    </View>
  </View>
);

const AddMeasurementScreen = () => {
  const navigation = useNavigation();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [loading, setLoading] = useState(false);

  // Form state
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [neck, setNeck] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [notes, setNotes] = useState('');

  const validateAndSubmit = async () => {
    // Weight is required
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('Validation Error', 'Weight is required and must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      const measurementData = {
        weight: parseFloat(weight),
        chest: chest ? parseFloat(chest) : undefined,
        waist: waist ? parseFloat(waist) : undefined,
        hips: hips ? parseFloat(hips) : undefined,
        leftArm: leftArm ? parseFloat(leftArm) : undefined,
        rightArm: rightArm ? parseFloat(rightArm) : undefined,
        leftThigh: leftThigh ? parseFloat(leftThigh) : undefined,
        rightThigh: rightThigh ? parseFloat(rightThigh) : undefined,
        neck: neck ? parseFloat(neck) : undefined,
        shoulders: shoulders ? parseFloat(shoulders) : undefined,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
        notes: notes.trim() || undefined
      };

      await measurementAPI.addMeasurement(measurementData);

      Alert.alert(
        'Success!',
        'Your measurement has been recorded successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (err) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to save measurement. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Add Body Measurement</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Record your weekly progress</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weight</Text>
          <MeasurementInput
            label="Weight"
            value={weight}
            onChange={setWeight}
            unit="kg"
            icon="scale-outline"
            required
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Body Measurements (cm)</Text>
          <MeasurementInput
            label="Chest"
            value={chest}
            onChange={setChest}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Waist"
            value={waist}
            onChange={setWaist}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Hips"
            value={hips}
            onChange={setHips}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Neck"
            value={neck}
            onChange={setNeck}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Shoulders"
            value={shoulders}
            onChange={setShoulders}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Arms (cm)</Text>
          <MeasurementInput
            label="Left Arm"
            value={leftArm}
            onChange={setLeftArm}
            unit="cm"
            icon="hand-left-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Right Arm"
            value={rightArm}
            onChange={setRightArm}
            unit="cm"
            icon="hand-right-outline"
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thighs (cm)</Text>
          <MeasurementInput
            label="Left Thigh"
            value={leftThigh}
            onChange={setLeftThigh}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
          <MeasurementInput
            label="Right Thigh"
            value={rightThigh}
            onChange={setRightThigh}
            unit="cm"
            icon="body-outline"
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional</Text>
          <MeasurementInput
            label="Body Fat Percentage"
            value={bodyFatPercentage}
            onChange={setBodyFatPercentage}
            unit="%"
            icon="pie-chart-outline"
            colors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes (Optional)</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
              placeholder="Add any notes about your measurement..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
          onPress={validateAndSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.white} />
              <Text style={[styles.submitButtonText, { color: colors.white }]}>Save Measurement</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          You can add one measurement per week. Make sure to measure at the same time of day for consistency.
        </Text>
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
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
  },
  form: {
    marginTop: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  required: {
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  unit: {
    paddingRight: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disclaimer: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
  },
});

export default AddMeasurementScreen;










