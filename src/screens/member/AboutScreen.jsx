import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    StatusBar,
    Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useStyles } from '../../styles/useStyles';
import Card from '../../components/common/Card';
import BackButton from '../../components/common/BackButton';

const APP_VERSION = '1.2.7';
const BUILD_NUMBER = '1';

const AboutScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    // Get dynamic theme colors and styles
    const { colors, isDark, styles: themeStyles } = useStyles();

    const handleWebsite = () => {
        Linking.openURL('https://getfit.lk');
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://getfit.lk/privacy');
    };

    const handleTermsOfService = () => {
        Linking.openURL('https://getfit.lk/terms');
    };

    const handleInstagram = () => {
        Linking.openURL('https://instagram.com/getfit.lk');
    };

    const handleFacebook = () => {
        Linking.openURL('https://www.facebook.com/share/1BViMMePQN/');
    };

    // Use dynamic colors for features
    const features = [
        { icon: 'fitness', label: 'Workout Tracking', color: colors.primary },
        { icon: 'people', label: 'Expert Instructors', color: colors.secondary },
        { icon: 'nutrition', label: 'Nutrition Plans', color: colors.success },
        { icon: 'calendar', label: 'Schedule Management', color: colors.warning },
        { icon: 'analytics', label: 'Progress Analytics', color: colors.primary },
        { icon: 'card', label: 'Easy Payments', color: colors.secondary },
    ];

    const legalLinks = [
        { icon: 'document-text', label: 'Terms of Service', onPress: handleTermsOfService },
        { icon: 'shield-checkmark', label: 'Privacy Policy', onPress: handlePrivacyPolicy },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
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
                <View style={styles.headerTop}>
                    <BackButton style={styles.backButton} />
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>About</Text>
                        <Text style={styles.headerSubtitle}>Learn more about Get Fit</Text>
                    </View>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="information-circle" size={24} color="#FFFFFF" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo and Info */}
                <View style={styles.appInfoSection}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoGradient}
                        >
                            <Ionicons name="fitness" size={48} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                    <Text style={[styles.appName, { color: colors.text }]}>Get Fit</Text>
                    <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Your Fitness Journey Starts Here</Text>
                    <View style={[styles.versionContainer, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.versionText, { color: colors.primary }]}>Version {APP_VERSION} ({BUILD_NUMBER})</Text>
                    </View>
                </View>

                {/* About Description */}
                <Card variant="elevated" style={styles.descriptionCard}>
                    <Text style={[styles.descriptionTitle, { color: colors.text }]}>About Get Fit</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                        Get Fit is your all-in-one fitness companion designed to help you achieve your health and wellness goals.
                        Whether you're a beginner or an experienced athlete, our platform connects you with expert instructors,
                        personalized workout plans, and nutrition guidance.
                    </Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                        Our mission is to make fitness accessible, enjoyable, and sustainable for everyone.
                        Join our community and transform your lifestyle today!
                    </Text>
                </Card>

                {/* Features */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>What We Offer</Text>
                <View style={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <View key={index} style={[styles.featureItem, { backgroundColor: colors.card }]}>
                            <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '15' }]}>
                                <Ionicons name={feature.icon} size={24} color={feature.color} />
                            </View>
                            <Text style={[styles.featureLabel, { color: colors.text }]}>{feature.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Social Links */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Connect With Us</Text>
                <View style={styles.socialLinksContainer}>
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.card }]}
                        onPress={handleWebsite}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="globe" size={24} color={colors.primary} />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Website</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.card }]}
                        onPress={handleInstagram}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Instagram</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: colors.card }]}
                        onPress={handleFacebook}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                        <Text style={[styles.socialButtonText, { color: colors.text }]}>Facebook</Text>
                    </TouchableOpacity>
                </View>

                {/* Legal Links */}
                <Card variant="elevated" style={styles.legalCard}>
                    {legalLinks.map((link, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.legalItem,
                                index < legalLinks.length - 1 && [styles.legalItemBorder, { borderBottomColor: colors.border }]
                            ]}
                            onPress={link.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.legalItemLeft}>
                                <Ionicons name={link.icon} size={20} color={colors.textSecondary} />
                                <Text style={[styles.legalItemText, { color: colors.text }]}>{link.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.text }]}>Made with ❤️ in Sri Lanka</Text>
                    <Text style={[styles.copyrightText, { color: colors.textSecondary }]}>© 2026 Get Fit. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
};

// Static styles that don't depend on theme colors
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
    headerTop: {
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
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flex: 1,
    },
    scrollInner: {
        padding: theme.spacing[4],
        paddingBottom: theme.spacing[8],
    },
    appInfoSection: {
        alignItems: 'center',
        paddingVertical: theme.spacing[6],
    },
    logoContainer: {
        marginBottom: theme.spacing[4],
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: theme.spacing[1],
        letterSpacing: -0.5,
    },
    appTagline: {
        fontSize: theme.typography.fontSize.md,
        marginBottom: theme.spacing[3],
    },
    versionContainer: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.borderRadius.full,
    },
    versionText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
    descriptionCard: {
        marginBottom: theme.spacing[6],
    },
    descriptionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing[3],
    },
    descriptionText: {
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
        marginBottom: theme.spacing[3],
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing[3],
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        marginBottom: theme.spacing[6],
    },
    featureItem: {
        width: '30%',
        alignItems: 'center',
        borderRadius: 20,
        padding: theme.spacing[3],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    featureIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing[2],
    },
    featureLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    socialLinksContainer: {
        flexDirection: 'row',
        gap: theme.spacing[3],
        marginBottom: theme.spacing[6],
    },
    socialButton: {
        flex: 1,
        borderRadius: 20,
        padding: theme.spacing[4],
        alignItems: 'center',
        gap: theme.spacing[2],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    socialButtonText: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    legalCard: {
        marginBottom: theme.spacing[6],
        padding: 0,
        overflow: 'hidden',
    },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing[4],
    },
    legalItemBorder: {
        borderBottomWidth: 1,
    },
    legalItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    legalItemText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: theme.spacing[4],
    },
    footerText: {
        fontSize: theme.typography.fontSize.md,
        marginBottom: theme.spacing[1],
    },
    copyrightText: {
        fontSize: theme.typography.fontSize.sm,
    },
});

export default AboutScreen;





