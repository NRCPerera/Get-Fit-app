import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { medicalAPI } from '../../api/medical.api';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import BackButton from '../../components/common/BackButton';

const MedicalFormScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [form, setForm] = useState({
    heightCm: '',
    weightKg: '',
    bloodPressure: '',
    heartRate: '',
    conditions: '',
    allergies: '',
    medications: '',
    injuries: '',
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [exists, setExists] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await medicalAPI.getMedicalForm();
      const data = res?.data?.form || null;
      if (data) {
        setForm({
          heightCm: data.heightCm ? String(data.heightCm) : '',
          weightKg: data.weightKg ? String(data.weightKg) : '',
          bloodPressure: data.bloodPressure || '',
          heartRate: data.heartRate ? String(data.heartRate) : '',
          conditions: (data.conditions || []).join(', '),
          allergies: (data.allergies || []).join(', '),
          medications: (data.medications || []).join(', '),
          injuries: (data.injuries || []).join(', '),
          notes: data.notes || '',
        });
        setExists(true);
      } else {
        setForm({
          heightCm: '',
          weightKg: '',
          bloodPressure: '',
          heartRate: '',
          conditions: '',
          allergies: '',
          medications: '',
          injuries: '',
          notes: '',
        });
        setExists(false);
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load medical form');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const canSave = useMemo(() => {
    const h = parseInt(form.heightCm || '0', 10);
    const w = parseInt(form.weightKg || '0', 10);
    return h > 0 && w > 0 && !saving;
  }, [form, saving]);

  const toArray = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

  const onSave = async () => {
    try {
      setSaving(true);
      const payload = {
        heightCm: form.heightCm ? parseInt(form.heightCm, 10) : undefined,
        weightKg: form.weightKg ? parseInt(form.weightKg, 10) : undefined,
        bloodPressure: form.bloodPressure || undefined,
        heartRate: form.heartRate ? parseInt(form.heartRate, 10) : undefined,
        conditions: toArray(form.conditions),
        allergies: toArray(form.allergies),
        medications: toArray(form.medications),
        injuries: toArray(form.injuries),
        notes: form.notes || undefined,
      };
      if (exists) {
        await medicalAPI.updateMedicalForm(payload);
      } else {
        await medicalAPI.createMedicalForm(payload);
        setExists(true);
      }
      Alert.alert('Saved', 'Medical information saved successfully');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save medical information');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !exists) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

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
          <BackButton style={styles.backButton} color="#FFFFFF" />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Medical Information</Text>
            <Text style={styles.headerSubtitle}>Keep your health details up to date</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingWrapper
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
        backgroundColor={colors.background}
      >
        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Height (cm)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} keyboardType="number-pad" value={form.heightCm} onChangeText={(t) => setField('heightCm', t)} placeholder="e.g. 175" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Weight (kg)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} keyboardType="number-pad" value={form.weightKg} onChangeText={(t) => setField('weightKg', t)} placeholder="e.g. 70" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Blood Pressure</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} value={form.bloodPressure} onChangeText={(t) => setField('bloodPressure', t)} placeholder="e.g. 120/80" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Heart Rate (bpm)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} keyboardType="number-pad" value={form.heartRate} onChangeText={(t) => setField('heartRate', t)} placeholder="e.g. 70" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Conditions (comma separated)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} value={form.conditions} onChangeText={(t) => setField('conditions', t)} placeholder="e.g. Asthma" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Allergies (comma separated)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} value={form.allergies} onChangeText={(t) => setField('allergies', t)} placeholder="e.g. Peanuts" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Medications (comma separated)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} value={form.medications} onChangeText={(t) => setField('medications', t)} placeholder="e.g. Ibuprofen" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Injuries (comma separated)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary }]} value={form.injuries} onChangeText={(t) => setField('injuries', t)} placeholder="e.g. Knee pain" placeholderTextColor={colors.textSecondary} />
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, height: 100, textAlignVertical: 'top' }]} value={form.notes} onChangeText={(t) => setField('notes', t)} placeholder="Anything else we should know" placeholderTextColor={colors.textSecondary} multiline />
        </View>

        <TouchableOpacity 
          accessibilityRole="button" 
          accessibilityLabel="Save medical information" 
          onPress={onSave} 
          disabled={!canSave} 
          style={[styles.saveBtn, { backgroundColor: colors.primary }, !canSave && { opacity: 0.6 }]}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingWrapper>
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
  content: { 
    padding: theme.spacing.md || 16,
    paddingTop: theme.spacing[4],
    paddingBottom: (theme.spacing.xl || 32) + 20,
  },
  error: { 
    marginBottom: theme.spacing.md || 16,
    fontSize: theme.typography.fontSize.sm || 14,
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  card: { 
    borderRadius: 16, 
    padding: theme.spacing.lg || 20, 
    marginBottom: theme.spacing.lg || 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { 
    fontSize: theme.typography.fontSize.sm || 14,
    fontWeight: '600',
    marginBottom: theme.spacing.xs || 8, 
    marginTop: theme.spacing.md || 16,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  input: { 
    borderRadius: 12, 
    paddingHorizontal: theme.spacing.md || 16, 
    paddingVertical: theme.spacing.sm || 14,
    fontSize: theme.typography.fontSize.md || 16,
    minHeight: 48,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
  },
  saveBtn: { 
    borderRadius: 14, 
    height: 54, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginTop: theme.spacing.md || 16,
    marginBottom: theme.spacing.xl || 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: { 
    color: '#FFFFFF', 
    fontSize: theme.typography.fontSize.md || 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default MedicalFormScreen;


