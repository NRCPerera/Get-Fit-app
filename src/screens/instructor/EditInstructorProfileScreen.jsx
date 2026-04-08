import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { instructorAPI } from '../../api/instructor.api';
import { userAPI } from '../../api/user.api';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';

const SPECIALIZATIONS = [
  'weight-loss',
  'muscle-gain',
  'cardio',
  'yoga',
  'crossfit',
  'powerlifting',
  'rehabilitation',
  'sports-specific'
];

const EditInstructorProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { profile: initialProfile } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // User fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUri, setProfilePictureUri] = useState(null);

  // Instructor fields
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Before/After photos
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [beforePhotoUri, setBeforePhotoUri] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [afterPhotoUri, setAfterPhotoUri] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(null); // 'before', 'after', or null

  // Helper to normalize photo URL (handle both string and object formats)
  const normalizePhotoUrl = (photo) => {
    if (!photo) return null;
    if (typeof photo === 'string') return photo;
    if (typeof photo === 'object' && photo.secure_url) return photo.secure_url;
    if (typeof photo === 'object' && photo.url) return photo.url;
    return null;
  };

  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name || '');
      setPhone(initialProfile.phone || '');
      setProfilePictureUri(initialProfile.profilePicture || null);
      setBio(initialProfile.bio || '');
      setExperience(String(initialProfile.experience || ''));
      setMonthlyRate(String(initialProfile.monthlyRate || ''));
      setSpecializations(initialProfile.specializations || []);
      setIsAvailable(initialProfile.isAvailable !== undefined ? initialProfile.isAvailable : true);
      setBeforePhotoUri(normalizePhotoUrl(initialProfile.beforePhoto));
      setAfterPhotoUri(normalizePhotoUrl(initialProfile.afterPhoto));
    }
  }, [initialProfile]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePicture(result.assets[0]);
        setProfilePictureUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickTransformationPhoto = async (photoType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images || 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (photoType === 'before') {
          setBeforePhoto(asset);
          setBeforePhotoUri(asset.uri);
        } else {
          setAfterPhoto(asset);
          setAfterPhotoUri(asset.uri);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadTransformationPhoto = async (photoType) => {
    const photo = photoType === 'before' ? beforePhoto : afterPhoto;
    if (!photo) {
      Alert.alert('No Photo', 'Please select a photo first');
      return;
    }

    try {
      setUploadingPhoto(photoType);
      
      // Prepare file for upload
      const uri = photo.uri;
      let filename = 'photo.jpg';
      let imageType = 'image/jpeg';
      
      if (uri) {
        const uriParts = uri.split('/');
        const lastPart = uriParts[uriParts.length - 1];
        if (lastPart && lastPart.includes('.')) {
          filename = lastPart.split('?')[0];
        }
        
        if (photo.type && typeof photo.type === 'string' && photo.type.includes('/')) {
          imageType = photo.type.trim();
        } else {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (ext === 'png') {
            imageType = 'image/png';
          } else if (ext === 'gif') {
            imageType = 'image/gif';
          } else if (ext === 'webp') {
            imageType = 'image/webp';
          }
        }
      }
      
      await instructorAPI.uploadTransformationPhoto(
        {
          uri,
          fileName: filename,
          type: imageType,
        },
        photoType
      );
      
      // Reload profile to get the Cloudinary URL
      try {
        const profileRes = await instructorAPI.getMyProfile();
        const profileData = profileRes?.data?.instructor || profileRes?.data || profileRes;
        if (photoType === 'before') {
          setBeforePhotoUri(normalizePhotoUrl(profileData.beforePhoto));
          setBeforePhoto(null);
        } else {
          setAfterPhotoUri(normalizePhotoUrl(profileData.afterPhoto));
          setAfterPhoto(null);
        }
      } catch (reloadError) {
        // Clear local photo state even if reload fails
        if (photoType === 'before') {
          setBeforePhoto(null);
        } else {
          setAfterPhoto(null);
        }
      }
      
      Alert.alert('Success', `${photoType === 'before' ? 'Before' : 'After'} photo uploaded successfully`);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(null);
    }
  };

  const deleteTransformationPhoto = async (photoType) => {
    Alert.alert(
      'Delete Photo',
      `Are you sure you want to delete the ${photoType} photo?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUploadingPhoto(photoType);
              await instructorAPI.deleteTransformationPhoto(photoType);
              
              if (photoType === 'before') {
                setBeforePhoto(null);
                setBeforePhotoUri(null);
              } else {
                setAfterPhoto(null);
                setAfterPhotoUri(null);
              }
              
              Alert.alert('Success', 'Photo deleted successfully');
            } catch (error) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete photo');
            } finally {
              setUploadingPhoto(null);
            }
          }
        }
      ]
    );
  };

  const toggleSpecialization = (spec) => {
    setSpecializations(prev =>
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update user profile (name, phone, profile picture)
      const userUpdates = {};
      if (name.trim()) userUpdates.name = name.trim();
      if (phone.trim()) userUpdates.phone = phone.trim();

      if (Object.keys(userUpdates).length > 0) {
        await userAPI.updateProfile(userUpdates);
      }

      // Upload profile picture if changed
      if (profilePicture) {
        try {
          const formData = new FormData();
          const uri = profilePicture.uri;
          
          // Extract filename and determine type from URI or use defaults
          let filename = 'profile.jpg';
          let imageType = 'image/jpeg'; // Default
          
          // Try to get filename from URI
          if (uri) {
            const uriParts = uri.split('/');
            const lastPart = uriParts[uriParts.length - 1];
            if (lastPart && lastPart.includes('.')) {
              filename = lastPart.split('?')[0]; // Remove query params if any
            }
            
            // Determine MIME type - ImagePicker may return "image" instead of "image/jpeg"
            // Check if profilePicture.type is a valid MIME type (contains a slash)
            if (profilePicture.type && typeof profilePicture.type === 'string' && profilePicture.type.includes('/')) {
              imageType = profilePicture.type.trim();
            } else {
              // ImagePicker returned "image" or invalid type - detect from filename extension
              const ext = filename.split('.').pop()?.toLowerCase();
              if (ext === 'png') {
                imageType = 'image/png';
              } else if (ext === 'gif') {
                imageType = 'image/gif';
              } else if (ext === 'webp') {
                imageType = 'image/webp';
              } else {
                imageType = 'image/jpeg'; // Default
              }
            }
          }
          
          // Final validation - ensure type is always a valid MIME type string
          if (!imageType || typeof imageType !== 'string' || !imageType.includes('/')) {
            imageType = 'image/jpeg';
          }
          
          // FormData structure for React Native
          // Use the URI as-is (ImagePicker returns correct format for each platform)
          formData.append('image', {
            uri: uri,
            name: filename,
            type: imageType, // Must be a valid MIME type like "image/jpeg"
          });
          
          await userAPI.uploadProfilePicture(formData);
        } catch (uploadError) {
          const uploadErrorMessage = uploadError?.response?.data?.message || 
                                    uploadError?.response?.data?.error || 
                                    uploadError?.message || 
                                    'Image upload failed';
          // Don't fail the entire save if image upload fails
          Alert.alert('Warning', `Profile updated but image upload failed: ${uploadErrorMessage}. Please try uploading the image again.`);
        }
      }

      // Update instructor profile
      const instructorUpdates = {};
      
      // Bio is optional - only send if provided (don't send empty string)
      const trimmedBio = bio.trim();
      if (trimmedBio) {
        instructorUpdates.bio = trimmedBio;
      }
      
      // Experience is optional - only send if valid number
      if (experience && experience.trim() !== '') {
        const expValue = parseInt(experience);
        if (!isNaN(expValue) && expValue >= 0) {
          instructorUpdates.experience = expValue;
        }
      }
      
      // MonthlyRate is REQUIRED - always send it
      let rateValue = 0;
      if (monthlyRate && monthlyRate.trim() !== '') {
        const parsedRate = parseFloat(monthlyRate);
        if (!isNaN(parsedRate) && parsedRate >= 0) {
          rateValue = parsedRate;
        } else {
          // Invalid input, use existing value or 0
          rateValue = initialProfile?.monthlyRate || 0;
        }
      } else {
        // No input, use existing value or default to 0
        rateValue = initialProfile?.monthlyRate || 0;
      }
      instructorUpdates.monthlyRate = rateValue;
      
      // Specializations - always send array (can be empty)
      instructorUpdates.specializations = Array.isArray(specializations) ? specializations : [];
      
      // Availability - always send boolean
      instructorUpdates.isAvailable = Boolean(isAvailable);

      // Always update instructor profile
      await instructorAPI.updateProfile(instructorUpdates);

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          'Failed to update profile';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Update your instructor profile information</Text>
      </View>

      {/* Profile Picture */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Picture</Text>
        <View style={[styles.avatarSection, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            {profilePictureUri ? (
              <Image source={{ uri: profilePictureUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.changePhotoButton, { borderColor: colors.primary }]} onPress={pickImage}>
            <Ionicons name="camera-outline" size={20} color={colors.primary} />
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Instructor Information */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructor Information</Text>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell clients about yourself, your experience, and training philosophy..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
            maxLength={1000}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{bio.length}/1000</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing.sm }]}>
            <Text style={[styles.label, { color: colors.text }]}>Experience (Years)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={experience}
              onChangeText={setExperience}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Monthly Rate (LKR)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={monthlyRate}
              onChangeText={setMonthlyRate}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      {/* Specializations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Specializations</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Select your areas of expertise</Text>
        <View style={styles.specializationsContainer}>
          {SPECIALIZATIONS.map((spec) => {
            const isSelected = specializations.includes(spec);
            return (
              <TouchableOpacity
                key={spec}
                style={[
                  styles.specializationChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={() => toggleSpecialization(spec)}
              >
                <Text
                  style={[
                    styles.specializationText,
                    { color: colors.text },
                    isSelected && { color: colors.white }
                  ]}
                >
                  {spec.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.white} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Availability */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Availability</Text>
        <View style={[styles.switchRow, { backgroundColor: colors.card }]}>
          <View style={styles.switchLabel}>
            <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.switchText, { color: colors.text }]}>Available for new clients</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, { backgroundColor: colors.border }, isAvailable && { backgroundColor: colors.primary }]}
            onPress={() => setIsAvailable(!isAvailable)}
          >
            <View style={[styles.toggleThumb, { backgroundColor: colors.white }, isAvailable && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Before/After Transformation Photos */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Client Transformation Photos</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Showcase your clients' before and after transformations</Text>
        
        <View style={styles.transformationPhotosContainer}>
          {/* Before Photo */}
          <View style={styles.transformationPhotoCard}>
            <Text style={[styles.transformationPhotoLabel, { color: colors.text }]}>Before</Text>
            <TouchableOpacity
              style={[styles.transformationPhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pickTransformationPhoto('before')}
              disabled={uploadingPhoto === 'before'}
            >
              {beforePhotoUri ? (
                <Image source={{ uri: beforePhotoUri }} style={styles.transformationPhoto} />
              ) : (
                <View style={[styles.transformationPhotoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                  <Text style={[styles.transformationPhotoPlaceholderText, { color: colors.textSecondary }]}>Add Before Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {beforePhotoUri && (
              <View style={styles.transformationPhotoActions}>
                {beforePhoto && !beforePhotoUri?.startsWith('http') && (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                    onPress={() => uploadTransformationPhoto('before')}
                    disabled={uploadingPhoto === 'before'}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
                    <Text style={[styles.uploadButtonText, { color: colors.white }]}>
                      {uploadingPhoto === 'before' ? 'Uploading...' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => deleteTransformationPhoto('before')}
                  disabled={uploadingPhoto === 'before'}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* After Photo */}
          <View style={styles.transformationPhotoCard}>
            <Text style={[styles.transformationPhotoLabel, { color: colors.text }]}>After</Text>
            <TouchableOpacity
              style={[styles.transformationPhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pickTransformationPhoto('after')}
              disabled={uploadingPhoto === 'after'}
            >
              {afterPhotoUri ? (
                <Image source={{ uri: afterPhotoUri }} style={styles.transformationPhoto} />
              ) : (
                <View style={[styles.transformationPhotoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                  <Text style={[styles.transformationPhotoPlaceholderText, { color: colors.textSecondary }]}>Add After Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            {afterPhotoUri && (
              <View style={styles.transformationPhotoActions}>
                {afterPhoto && !afterPhotoUri?.startsWith('http') && (
                  <TouchableOpacity
                    style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                    onPress={() => uploadTransformationPhoto('after')}
                    disabled={uploadingPhoto === 'after'}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={colors.white} />
                    <Text style={[styles.uploadButtonText, { color: colors.white }]}>
                      {uploadingPhoto === 'after' ? 'Uploading...' : 'Upload'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => deleteTransformationPhoto('after')}
                  disabled={uploadingPhoto === 'after'}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.primary }, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving || !name.trim()}
      >
        {saving ? (
          <Text style={[styles.saveButtonText, { color: colors.white }]}>Saving...</Text>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={[styles.saveButtonText, { color: colors.white }]}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
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
  header: {
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  specializationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  specializationText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  switchText: {
    fontSize: theme.typography.fontSize.md,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  transformationPhotosContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  transformationPhotoCard: {
    flex: 1,
  },
  transformationPhotoLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  transformationPhotoButton: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  transformationPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  transformationPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  transformationPhotoPlaceholderText: {
    fontSize: theme.typography.fontSize.xs,
  },
  transformationPhotoActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  uploadButtonText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  deleteButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditInstructorProfileScreen;