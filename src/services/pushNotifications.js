import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationAPI } from '../api/notification.api';

const isExpoGo = Constants.expoGoConfig != null;
let notificationsModulePromise = null;

const getNotificationsModule = async () => {
    if (isExpoGo) return null;

    if (!notificationsModulePromise) {
        notificationsModulePromise = import('expo-notifications');
    }

    return notificationsModulePromise;
};

// Configure how notifications are displayed when the app is in the foreground
getNotificationsModule()
    .then((Notifications) => {
        Notifications?.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    })
    .catch((error) => {
        console.warn('Unable to configure notification handler:', error);
    });

export const addNotificationReceivedListener = async (listener) => {
    const Notifications = await getNotificationsModule();
    return Notifications?.addNotificationReceivedListener(listener) || null;
};

export const addNotificationResponseReceivedListener = async (listener) => {
    const Notifications = await getNotificationsModule();
    return Notifications?.addNotificationResponseReceivedListener(listener) || null;
};

/**
 * Hook to manage push notifications
 * @param {function} onNotificationReceived - Callback when notification is received
 * @param {function} onNotificationResponse - Callback when user taps on notification
 */
export const usePushNotifications = (onNotificationReceived, onNotificationResponse) => {
    const [expoPushToken, setExpoPushToken] = useState(null);
    const [notification, setNotification] = useState(null);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        let cancelled = false;

        const setUpListeners = async () => {
            const Notifications = await getNotificationsModule();
            if (!Notifications || cancelled) return;

            notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
                setNotification(notification);
                if (onNotificationReceived) {
                    onNotificationReceived(notification);
                }
            });

            responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
                if (onNotificationResponse) {
                    onNotificationResponse(response);
                }
            });
        };

        setUpListeners().catch((error) => {
            if (!cancelled) {
                console.warn('Unable to set up notification listeners:', error);
            }
        });

        return () => {
            cancelled = true;
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [onNotificationReceived, onNotificationResponse]);

    return {
        expoPushToken,
        notification,
    };
};

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string|null>} The Expo push token or null if registration fails
 */
export const registerForPushNotificationsAsync = async () => {
    let token = null;

    const Notifications = await getNotificationsModule();
    if (!Notifications) {
        console.log('Remote push notifications are unavailable in Expo Go');
        return null;
    }

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
    }

    try {
        // Get the Expo push token
        // Using the project ID from app.json extra.eas.projectId
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: '90a966f6-cf24-4333-831a-c48108ee0a91',
        });
        token = tokenData.data;
        console.log('Expo Push Token:', token);
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
        });

        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Messages',
            description: 'Notifications for new messages',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
            sound: 'default',
        });
    }

    return token;
};

/**
 * Register push token with the backend
 * @param {string} token - The Expo push token
 */
export const registerPushTokenWithBackend = async (token) => {
    try {
        await notificationAPI.registerPushToken(token);
        console.log('Push token registered with backend');
        return true;
    } catch (error) {
        console.error('Error registering push token with backend:', error);
        return false;
    }
};

/**
 * Remove push token from backend (call on logout)
 */
export const removePushTokenFromBackend = async () => {
    try {
        await notificationAPI.removePushToken();
        console.log('Push token removed from backend');
        return true;
    } catch (error) {
        console.error('Error removing push token from backend:', error);
        return false;
    }
};

/**
 * Initialize push notifications - call after user login
 */
export const initializePushNotifications = async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
        await registerPushTokenWithBackend(token);
    }
    return token;
};
