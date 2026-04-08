import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, StatusBar, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../styles/theme';
import { useTheme } from '../../context/ThemeContext';
import { scheduleAPI } from '../../api/schedule.api';
import Button from '../../components/common/Button';
import { getFileUrl } from '../../utils/helpers';
import BackButton from '../../components/common/BackButton';

// Exercise Video Component
const ExerciseVideo = ({ url }) => {
    const source = { uri: getFileUrl(url) || url };
    const player = useVideoPlayer(source, player => {
        player.loop = true;
        player.muted = true;
        player.play();
    });

    return (
        <View style={styles.videoContainer}>
            <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={true}
            />
        </View>
    );
};

// Mock timer function
const Timer = ({ colors }) => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={[styles.timerContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.timerText, { color: colors.primary }]}>{formatTime(seconds)}</Text>
        </View>
    );
};

const WorkoutTrackerScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { schedule, day } = route.params || {};
    const { theme: dynamicTheme, isDark } = useTheme();
    const colors = dynamicTheme.colors;

    // Filter by day if we passed a specific day in a multi-day schedule
    const activeExercises = day 
        ? (schedule?.exercises || []).filter(ex => ex.scheduleDay === day) 
        : (schedule?.exercises || []);

    // Normalize exercises struct (handle different back-end formats)
    const normalizedExercises = activeExercises.map(ex => {
        // If setReps exists, use it. Otherwise convert legacy sets/reps to setReps format
        let sets = [];
        if (ex.setReps && ex.setReps.length > 0) {
            ex.setReps.forEach((sr, groupIdx) => {
                const numSets = parseInt(sr.sets || '1');
                for (let i = 0; i < numSets; i++) {
                    sets.push({
                        id: `${ex._id || ex.id}-grp-${groupIdx}-set-${i}`,
                        setNumber: sets.length + 1,
                        reps: sr.reps,
                        weight: sr.weight || '-',
                        completed: false
                    });
                }
            });
        } else {
            const numSets = parseInt(ex.sets || '3');
            const numReps = ex.reps || '10';
            sets = Array.from({ length: numSets }, (_, idx) => ({
                id: `${ex._id || ex.id}-set-${idx}`,
                setNumber: idx + 1,
                reps: numReps,
                weight: '-',
                completed: false
            }));
        }

        // exerciseId may be a populated object or a raw ObjectId string
        const populatedExercise = (ex.exerciseId && typeof ex.exerciseId === 'object') ? ex.exerciseId : null;

        // Resolve videoUrl: prefer populated exercise data, fall back to direct field
        const rawVideoUrl = populatedExercise?.videoUrl || ex.videoUrl;
        // Handle Cloudinary object format ({ secure_url: "..." })
        const resolvedVideoUrl = rawVideoUrl && typeof rawVideoUrl === 'object' && rawVideoUrl.secure_url
            ? rawVideoUrl.secure_url
            : rawVideoUrl;

        return {
            ...ex,
            displayName: populatedExercise?.name || ex.exerciseName || 'Exercise',
            videoUrl: resolvedVideoUrl,
            dailySets: sets
        };
    });

    const [exercises, setExercises] = useState(normalizedExercises);
    const [workoutComplete, setWorkoutComplete] = useState(false);

    const toggleSetComplete = (exerciseIndex, setIndex) => {
        const updatedExercises = [...exercises];
        updatedExercises[exerciseIndex].dailySets[setIndex].completed = !updatedExercises[exerciseIndex].dailySets[setIndex].completed;
        setExercises(updatedExercises);
    };

    const calculateProgress = () => {
        let totalSets = 0;
        let completedSets = 0;

        exercises.forEach(ex => {
            totalSets += ex.dailySets.length;
            completedSets += ex.dailySets.filter(s => s.completed).length;
        });

        return totalSets > 0 ? (completedSets / totalSets) : 0;
    };

    const handleFinishWorkout = () => {
        const progress = calculateProgress();
        const isFull = progress === 1;

        Alert.alert(
            "Finish Workout",
            isFull ? "Great job! You've completed all sets." : "You haven't completed all sets. Finish anyway?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Finish",
                    onPress: async () => {
                        try {
                            const scheduleId = schedule?._id || schedule?.id;
                            if (scheduleId && day) {
                                const maxDays = parseInt(schedule.scheduleType) || 1;
                                const nextDay = day >= maxDays ? 1 : day + 1;
                                await AsyncStorage.setItem(`workout_progress_${scheduleId}`, JSON.stringify({ currentDay: nextDay }));
                            }
                        } catch (e) {
                            console.error('Failed to save progression:', e);
                        }

                        // Ideally call API to save workout history/logs here
                        Alert.alert("Workout Saved", "Your progress has been recorded!", [
                            { text: "OK", onPress: () => navigation.goBack() }
                        ]);
                    }
                }
            ]
        );
    };

    const currentProgress = calculateProgress();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <BackButton style={styles.backButton} iconName="close" color={colors.text} />
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{schedule?.name || 'Workout'}</Text>
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                </View>
                <Timer colors={colors} />
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
                <View style={[styles.progressBar, { width: `${currentProgress * 100}%`, backgroundColor: colors.success }]} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {exercises.map((exercise, exIndex) => (
                    <View key={exIndex} style={[styles.exerciseCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
                        <View style={styles.exerciseHeader}>
                            <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.displayName}</Text>
                            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                        </View>

                        {/* Exercise Video */}
                        {exercise.videoUrl && (
                            <ExerciseVideo url={exercise.videoUrl} />
                        )}

                        <View style={styles.setsHeader}>
                            <Text style={[styles.colHeader, { width: 40, color: colors.textSecondary }]}>Set</Text>
                            <Text style={[styles.colHeader, { flex: 1, color: colors.textSecondary }]}>Previous</Text>
                            <Text style={[styles.colHeader, { width: 60, color: colors.textSecondary }]}>Reps</Text>
                            <Text style={[styles.colHeader, { width: 60, color: colors.textSecondary }]}>Check</Text>
                        </View>

                        {exercise.dailySets.map((set, setIndex) => (
                            <TouchableOpacity
                                key={setIndex}
                                activeOpacity={0.7}
                                onPress={() => toggleSetComplete(exIndex, setIndex)}
                                style={[
                                    styles.setRow,
                                    set.completed && [styles.setRowCompleted, { backgroundColor: colors.success + '10' }]
                                ]}
                            >
                                <View style={styles.setNumberBadge}>
                                    <Text style={[styles.setText, { color: colors.text }, set.completed && [styles.completedText, { color: colors.success }]]}>{set.setNumber}</Text>
                                </View>
                                <Text style={[styles.setText, { flex: 1, color: colors.textSecondary }, set.completed && [styles.completedText, { color: colors.success }]]}>
                                    -
                                </Text>
                                <View style={styles.repsContainer}>
                                    <Text style={[styles.setText, { fontWeight: 'bold', color: colors.text }, set.completed && [styles.completedText, { color: colors.success }]]}>{set.reps}</Text>
                                </View>
                                <View style={[styles.checkbox, { borderColor: colors.border }, set.completed && [styles.checkboxChecked, { backgroundColor: colors.success, borderColor: colors.success }]]}>
                                    {set.completed && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                <Button
                    title="Finish Workout"
                    onPress={handleFinishWorkout}
                    style={styles.finishButton}
                    variant="primary"
                    size="lg"
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    headerSubtitle: {
        fontSize: 12,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    timerText: {
        fontSize: 14,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    progressBarContainer: {
        height: 4,
        width: '100%',
    },
    progressBar: {
        height: '100%',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    exerciseCard: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    exerciseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    exerciseName: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    setsHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    colHeader: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    setRowCompleted: {},
    setNumberBadge: {
        width: 40,
        alignItems: 'center',
    },
    setText: {
        fontSize: 14,
        textAlign: 'center',
    },
    completedText: {},
    repsContainer: {
        width: 60,
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {},
    finishButton: {
        marginVertical: 20,
    },
    videoContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});

export default WorkoutTrackerScreen;
