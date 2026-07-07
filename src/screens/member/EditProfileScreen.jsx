import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, StatusBar } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { userAPI } from '../../api/user.api';
import { updateUserProfile } from '../../store/slices/userSlice';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import KeyboardAvoidingWrapper from '../../components/common/KeyboardAvoidingWrapper';
import { screenStyles, headerStyles } from '../../styles/shared';
import BackButton from '../../components/common/BackButton';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { theme: dynamicTheme, isDark } = useTheme();
  const colors = dynamicTheme.colors;
  const { profile } = useSelector((state) => state.user);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
      if (profile) {
        setName(profile?.name || '');
        setPhone(profile?.phone || '');
      }
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

      const profileData = {};
      if (name) profileData.name = name;
      if (phone) profileData.phone = phone;

      let avatarFormData = null;
      if (avatar) {
        const fd = new FormData();

        let filename = 'avatar.jpg';
        let imageType = 'image/jpeg';

        if (avatar.uri) {
          const uriParts = avatar.uri.split('/');
          const lastPart = uriParts[uriParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            filename = lastPart.split('?')[0];
          }

          if (avatar.type && typeof avatar.type === 'string' && avatar.type.includes('/')) {
            imageType = avatar.type.trim();
          } else {
            const ext = filename.split('.').pop()?.toLowerCase();
            if (ext === 'png') imageType = 'image/png';
            else if (ext === 'gif') imageType = 'image/gif';
            else if (ext === 'webp') imageType = 'image/webp';
            else imageType = 'image/jpeg';
          }
        }

        fd.append('image', {
          uri: avatar.uri,
          name: filename,
          type: imageType,
        });

        avatarFormData = fd;
      }

      const result = await dispatch(updateUserProfile({
        profileData: Object.keys(profileData).length > 0 ? profileData : null,
        avatarFormData,
      })).unwrap();

      Alert.alert('Success', 'Profile updated successfully');
      setAvatar(null);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!current.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (current === password) {
      Alert.alert('Error', 'New password must be different from your current password');
      return;
    }
    try {
      setChanging(true);
      const response = await userAPI.changePassword({
        currentPassword: current,
        newPassword: password,
      });
      if (!response?.success) {
        Alert.alert('Error', response?.message || 'Failed to change password');
        return;
      }
      Alert.alert('Success', 'Password changed successfully');
      setCurrent('');
      setPassword('');
      setConfirm('');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to change password');
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>Update your personal information</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingWrapper
        style={screenStyles.container}
        contentContainerStyle={[screenStyles.scrollContent, { paddingTop: theme.spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <Card variant="elevated" style={styles.avatarCard}>
          <Text style={[headerStyles.sectionTitle, { color: colors.text }]}>Profile Picture</Text>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatar} resizeMode="cover" />
            ) : profile?.profilePicture ? (
              <Image
                source={{ uri: profile.profilePicture }}
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
          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword', {
              fromEditProfile: true,
              email: currentProfile?.email || '',
            })}
            activeOpacity={0.7}
            style={styles.forgotPasswordLink}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot your current password?
            </Text>
          </TouchableOpacity>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: -theme.spacing[2],
    marginBottom: theme.spacing[4],
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default EditProfileScreen;
