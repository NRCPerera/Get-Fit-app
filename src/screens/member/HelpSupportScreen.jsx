import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    StatusBar,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/common/Card';
import BackButton from '../../components/common/BackButton';

const HelpSupportScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { theme: dynamicTheme, isDark } = useTheme();
    const colors = dynamicTheme.colors;

    const handleEmail = () => {
        Linking.openURL('mailto:amarasinghedilanka14@gmail.com?subject=Help%20Request');
    };
    const handlePhone = () => {
        Linking.openURL('tel:+94771234567');
    };

    const faqItems = [
        {
            question: 'How do I book a session with an instructor?',
            answer: 'Navigate to the Instructors tab, select your preferred instructor, and tap "Subscribe" to book sessions with them.'
        },
        {
            question: 'How can I track my workout progress?',
            answer: 'Go to Profile → Progress Tracking to log your body measurements and view your progress over time.'
        },
        {
            question: 'How do I update my membership plan?',
            answer: 'Visit Profile → Membership Plans to view available plans and upgrade or renew your membership.'
        },
        {
            question: 'Can I cancel my subscription?',
            answer: 'Yes, you can manage your subscriptions from your Profile. Contact support if you need assistance with cancellations.'
        },
        {
            question: 'How do I update my profile information?',
            answer: 'Go to Profile → Edit Profile to update your personal information, profile picture, and contact details.'
        },
    ];

    const contactMethods = [
        {
            icon: 'mail',
            label: 'Email Us',
            subtitle: 'amarasinghedilanka14@gmail.com',
            color: colors.primary,
            onPress: handleEmail
        },
        {
            icon: 'call',
            label: 'Call Us',
            subtitle: '+94 77 123 4567',
            color: colors.success,
            onPress: handlePhone
        },
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
                        <Text style={styles.headerTitle}>Help & Support</Text>
                        <Text style={styles.headerSubtitle}>We're here to help you</Text>
                    </View>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="headset" size={24} color="#FFFFFF" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Methods */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
                <View style={styles.contactGrid}>
                    {contactMethods.map((method, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.contactCard, { backgroundColor: colors.card }]}
                            onPress={method.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.contactIconContainer, { backgroundColor: method.color + '15' }]}>
                                <Ionicons name={method.icon} size={28} color={method.color} />
                            </View>
                            <Text style={[styles.contactLabel, { color: colors.text }]}>{method.label}</Text>
                            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>{method.subtitle}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
                <Card variant="elevated" style={styles.faqCard}>
                    {faqItems.map((faq, index) => (
                        <View key={index} style={styles.faqItem}>
                            <View style={styles.faqQuestion}>
                                <Ionicons name="help-circle" size={20} color={colors.primary} />
                                <Text style={[styles.faqQuestionText, { color: colors.text }]}>{faq.question}</Text>
                            </View>
                            <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>{faq.answer}</Text>
                            {index < faqItems.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                        </View>
                    ))}
                </Card>

                {/* Support Hours */}
                <Card variant="elevated" style={styles.supportHoursCard}>
                    <View style={[styles.supportHoursHeader, { borderBottomColor: colors.border }]}>
                        <Ionicons name="time" size={24} color={colors.secondary} />
                        <Text style={[styles.supportHoursTitle, { color: colors.text }]}>Support Hours</Text>
                    </View>
                    <View style={styles.supportHoursContent}>
                        <View style={styles.hoursRow}>
                            <Text style={[styles.hoursDay, { color: colors.text }]}>Monday - Friday</Text>
                            <Text style={[styles.hoursTime, { color: colors.primary }]}>8:00 AM - 8:00 PM</Text>
                        </View>
                        <View style={styles.hoursRow}>
                            <Text style={[styles.hoursDay, { color: colors.text }]}>Saturday</Text>
                            <Text style={[styles.hoursTime, { color: colors.primary }]}>9:00 AM - 6:00 PM</Text>
                        </View>
                        <View style={styles.hoursRow}>
                            <Text style={[styles.hoursDay, { color: colors.text }]}>Sunday</Text>
                            <Text style={[styles.hoursTime, { color: colors.primary }]}>10:00 AM - 4:00 PM</Text>
                        </View>
                    </View>
                </Card>

                {/* Additional Info */}
                <View style={[styles.additionalInfo, { backgroundColor: colors.primary + '10' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
                    <Text style={[styles.additionalInfoText, { color: colors.textSecondary }]}>
                        For urgent matters outside support hours, please email us and we'll respond as soon as possible.
                    </Text>
                </View>
            </ScrollView>
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
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing[3],
        marginTop: theme.spacing[2],
    },
    contactGrid: {
        flexDirection: 'row',
        gap: theme.spacing[3],
        marginBottom: theme.spacing[6],
    },
    contactCard: {
        flex: 1,
        borderRadius: 20,
        padding: theme.spacing[4],
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    contactIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing[3],
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: theme.spacing[1],
        letterSpacing: -0.2,
    },
    contactSubtitle: {
        fontSize: theme.typography.fontSize.xs,
        textAlign: 'center',
    },
    faqCard: {
        marginBottom: theme.spacing[4],
    },
    faqItem: {
        paddingVertical: theme.spacing[3],
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[2],
        marginBottom: theme.spacing[2],
    },
    faqQuestionText: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    faqAnswerText: {
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
        marginLeft: theme.spacing[7],
    },
    divider: {
        height: 1,
        marginTop: theme.spacing[3],
    },
    supportHoursCard: {
        marginBottom: theme.spacing[4],
    },
    supportHoursHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        marginBottom: theme.spacing[3],
        paddingBottom: theme.spacing[3],
        borderBottomWidth: 1,
    },
    supportHoursTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    supportHoursContent: {
        gap: theme.spacing[2],
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hoursDay: {
        fontSize: theme.typography.fontSize.md,
    },
    hoursTime: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
    },
    additionalInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing[2],
        padding: theme.spacing[4],
        borderRadius: theme.borderRadius.lg,
    },
    additionalInfoText: {
        flex: 1,
        fontSize: theme.typography.fontSize.sm,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    },
});

export default HelpSupportScreen;
