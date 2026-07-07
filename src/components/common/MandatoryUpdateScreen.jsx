import React, { useEffect } from 'react';
import { Alert, BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import Button from './Button';
import { openStore } from '../../services/appVersion';

const MandatoryUpdateScreen = ({ versionInfo }) => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const handleUpdateNow = async () => {
    const opened = await openStore(versionInfo?.storeUrl);
    if (!opened) {
      Alert.alert(
        'Unable to open store',
        'We could not open the app store right now. Please try again in a moment.'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundSecondary }]}>
      <LinearGradient
        colors={colors.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Get Fit</Text>
        </View>
        <Text style={styles.title}>Update required</Text>
        <Text style={styles.subtitle}>
          {versionInfo?.message || 'A new version is required to continue.'}
        </Text>
        {__DEV__ && (
          <Text style={styles.versionMeta}>
            Installed {versionInfo?.installedVersion || 'unknown'} | Required {versionInfo?.minimumVersion || 'unknown'}
          </Text>
        )}
      </LinearGradient>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>A newer build is ready</Text>
        <Text style={[styles.panelBody, { color: colors.textSecondary }]}> 
          Update Get Fit from the store to keep using the app and receive the latest fixes and improvements.
        </Text>
        <Button
          title="Update now"
          onPress={handleUpdateNow}
          fullWidth
          size="lg"
          icon="download-outline"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  hero: {
    flex: 1,
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[8],
    paddingBottom: theme.spacing[6],
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -60,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: 48,
    left: -30,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: theme.spacing[5],
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize['4xl'] || 36,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
    maxWidth: 420,
  },
  versionMeta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing[3],
  },
  panel: {
    marginHorizontal: theme.spacing[4],
    marginTop: -theme.spacing[8],
    marginBottom: theme.spacing[6],
    borderRadius: 24,
    padding: theme.spacing[5],
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  panelTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '800',
    marginBottom: theme.spacing[2],
  },
  panelBody: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 22,
    marginBottom: theme.spacing[5],
  },
  button: {
    marginTop: theme.spacing[1],
  },
});

export default MandatoryUpdateScreen;
