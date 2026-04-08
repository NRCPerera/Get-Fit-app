import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

// Import screens
import HomeScreen from '../screens/member/HomeScreen';
import ExerciseLibraryScreen from '../screens/member/ExerciseLibraryScreen';
import MySchedulesScreen from '../screens/member/MySchedulesScreen';
import InstructorListScreen from '../screens/member/InstructorListScreen';
import ProfileScreen from '../screens/member/ProfileScreen';

// Import detail screens
import ScheduleDetailScreen from '../screens/member/ScheduleDetailScreen';
import CustomWorkoutDetailScreen from '../screens/member/CustomWorkoutDetailScreen';
import CreateScheduleScreen from '../screens/member/CreateScheduleScreen';
import EditScheduleScreen from '../screens/member/EditScheduleScreen';
import InstructorDetailScreen from '../screens/member/InstructorDetailScreen';
import { PaymentScreen } from '../screens/member/PaymentScreen';
import SubscriptionPaymentScreen from '../screens/member/SubscriptionPaymentScreen';
import PaymentHistoryScreen from '../screens/member/PaymentHistoryScreen';
import { NutritionScreen } from '../screens/member/NutritionScreen';
import NutritionDetailScreen from '../screens/member/NutritionDetailScreen';
import CreateNutritionPlanScreen from '../screens/instructor/CreateNutritionPlanScreen';
import MedicalFormScreen from '../screens/member/MedicalFormScreen';
import EditProfileScreen from '../screens/member/EditProfileScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import ProgressTrackingScreen from '../screens/member/ProgressTrackingScreen';
import AddMeasurementScreen from '../screens/member/AddMeasurementScreen';
import MembershipPlansScreen from '../screens/member/MembershipPlansScreen';
import HelpSupportScreen from '../screens/member/HelpSupportScreen';
import AboutScreen from '../screens/member/AboutScreen';
import MessagesScreen from '../screens/common/MessagesScreen';
import ChatScreen from '../screens/common/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="CustomWorkoutDetail"
      component={CustomWorkoutDetailScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WorkoutTracker"
      component={require('../screens/member/WorkoutTrackerScreen').default}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MembershipPlans"
      component={MembershipPlansScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProgressTracking"
      component={ProgressTrackingScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Exercise Stack
const ExerciseStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ExerciseLibrary"
      component={ExerciseLibraryScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Schedule Stack
const ScheduleStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MySchedules"
      component={MySchedulesScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ScheduleDetail"
      component={ScheduleDetailScreen}
      options={{ title: 'Schedule Details' }}
    />
    <Stack.Screen
      name="CreateSchedule"
      component={CreateScheduleScreen}
      options={{ title: 'Create Schedule' }}
    />
    <Stack.Screen
      name="EditSchedule"
      component={EditScheduleScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="WorkoutTracker"
      component={require('../screens/member/WorkoutTrackerScreen').default}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Instructor Stack
const InstructorStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InstructorList"
      component={InstructorListScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="InstructorDetail"
      component={InstructorDetailScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SubscriptionPayment"
      component={SubscriptionPaymentScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Payment"
      component={PaymentScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="PaymentHistory"
      component={PaymentHistoryScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MedicalForm"
      component={MedicalFormScreen}
      options={{ title: 'Medical Information' }}
    />
    <Stack.Screen
      name="Nutrition"
      component={NutritionScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="NutritionDetail"
      component={NutritionDetailScreen}
      options={{ title: 'Nutrition Details' }}
    />
    <Stack.Screen
      name="CreateNutritionPlan"
      component={CreateNutritionPlanScreen}
      options={{ title: 'Create Nutrition Plan' }}
    />
    <Stack.Screen
      name="ProgressTracking"
      component={ProgressTrackingScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddMeasurement"
      component={AddMeasurementScreen}
      options={{ title: 'Add Measurement' }}
    />
    <Stack.Screen
      name="MembershipPlans"
      component={MembershipPlansScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Notifications"
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
    <Stack.Screen
      name="HelpSupport"
      component={HelpSupportScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="About"
      component={AboutScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

const MemberNavigator = () => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'Schedules') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Instructors') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          paddingTop: 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: theme.typography.fontWeight.semibold,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen
        name="Exercises"
        component={ExerciseStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Exercises', { screen: 'ExerciseLibrary' });
          },
        })}
      />
      <Tab.Screen
        name="Schedules"
        component={ScheduleStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Schedules', { screen: 'MySchedules' });
          },
        })}
      />
      <Tab.Screen
        name="Instructors"
        component={InstructorStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Instructors', { screen: 'InstructorList' });
          },
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default MemberNavigator;


