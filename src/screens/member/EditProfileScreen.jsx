import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { userAPI } from '../../api/user.api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import { screenStyles, headerStyles } from '../../styles/shared';
import BackButton from '../../components/common/BackButton';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getProfile();
      const data = res?.data?.user || res?.data || res;
      setCurrentProfile(data);
      setName(data?.name || '');
      setPhone(data?.phone || '');
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType?.Images || 'images',
      allowsEditing: true,
      quality: 0.7
    });
    if (!res.canceled) setAvatar(res.assets[0]);
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      if (name || phone) {
        await userAPI.updateProfile({ name: name || undefined, phone: phone || undefined });
      }
      if (avatar) {
        const fd = new FormData();

        // Extract filename and determine MIME type
        let filename = 'avatar.jpg';
        let imageType = 'image/jpeg'; // Default

        if (avatar.uri) {
          const uriParts = avatar.uri.split('/');
          const lastPart = uriParts[uriParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            filename = lastPart.split('?')[0]; // Remove query params if any
          }

          // Determine MIME type - ImagePicker may return "image" instead of "image/jpeg"
          if (avatar.type && typeof avatar.type === 'string' && avatar.type.includes('/')) {
            imageType = avatar.type.trim();
          } else {
            // Detect from filename extension
            const ext = filename.split('.').pop()?.toLowerCase();
            if (ext === 'png') imageType = 'image/png';
            else if (ext === 'gif') imageType = 'image/gif';
            else if (ext === 'webp') imageType = 'image/webp';
            else imageType = 'image/jpeg'; // Default
          }
        }

        // Backend expects field name 'image', not 'avatar'
        fd.append('image', {
          uri: avatar.uri,
          name: filename,
          type: imageType, // Must be a valid MIME type like "image/jpeg"
        });

        await userAPI.uploadProfilePicture(fd);
      }
      Alert.alert('Success', 'Profile updated successfully');
      setAvatar(null);
      await loadProfile();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!current || !password || password !== confirm) {
      Alert.alert('Error', 'Please check your password inputs');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    try {
      setChanging(true);
      await userAPI.changePassword({ currentPassword: current, newPassword: password });
      Alert.alert('Success', 'Password changed successfully');
      setCurrent('');
      setPassword('');
      setConfirm('');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingWrapper
      style={[screenStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[screenStyles.scrollContent, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <BackButton style={styles.backButton} iconName="arrow-back" color={colors.text} />
        <Text style={[headerStyles.title, { color: colors.text }]}>Edit Profile</Text>
        <Text style={[headerStyles.subtitle, { color: colors.textSecondary }]}>Update your personal information</Text>
      </View>

      {/* Avatar Section */}
      <Card variant="elevated" style={styles.avatarCard}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Profile Picture</Text>
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar.uri }} style={styles.avatar} resizeMode="cover" />
          ) : currentProfile?.profilePicture ? (
            <Image
              source={{ uri: currentProfile.profilePicture }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="person" size={48} color={colors.textTertiary} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.changeAvatarButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
            onPress={pickAvatar}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        <Button
          title="Choose Image"
          onPress={pickAvatar}
          variant="outline"
          size="md"
          icon="image-outline"
          fullWidth
          style={styles.chooseImageButton}
        />
      </Card>

      {/* Basic Info */}
      <Card variant="elevated" style={styles.formCard}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
          autoCapitalize="words"
        />
        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />
        <Button
          title={saving ? 'Saving...' : 'Save Changes'}
          onPress={saveProfile}
          loading={saving}
          fullWidth
          icon="checkmark-circle-outline"
          style={styles.saveButton}
        />
      </Card>

      {/* Change Password */}
      <Card variant="elevated" style={styles.formCard}>
        <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Change Password</Text>
        <Input
          label="Current Password"
          placeholder="Enter current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          showPasswordToggle
          leftIcon="lock-closed-outline"
        />
        <Input
          label="New Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          showPasswordToggle
          leftIcon="lock-closed-outline"
          helperText="Password must be at least 8 characters"
        />
        <Input
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          showPasswordToggle
          leftIcon="lock-closed-outline"
          error={confirm && password !== confirm ? 'Passwords do not match' : null}
        />
        <Button
          title={changing ? 'Updating...' : 'Update Password'}
          onPress={changePassword}
          loading={changing}
          fullWidth
          icon="key-outline"
          style={styles.saveButton}
        />
      </Card>
    </KeyboardAvoidingWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[4],
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing[4],
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  chooseImageButton: {
    marginTop: theme.spacing[2],
  },
  formCard: {
    marginBottom: theme.spacing[6],
  },
  saveButton: {
    marginTop: theme.spacing[2],
  },
});

export default EditProfileScreen;
