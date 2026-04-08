import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '../styles/theme';
import { useTheme } from '../context/ThemeContext';

// Placeholder screens
import InstructorDashboardScreen from '../screens/instructor/InstructorDashboardScreen';
import MyClientsScreen from '../screens/instructor/MyClientsScreen';
import InstructorSchedulesScreen from '../screens/instructor/InstructorSchedulesScreen';
import CreateScheduleScreen from '../screens/instructor/CreateScheduleScreen';
import ScheduleDetailScreen from '../screens/member/ScheduleDetailScreen';
import EarningsScreen from '../screens/instructor/EarningsScreen';
import InstructorProfileScreen from '../screens/instructor/InstructorProfileScreen';
import EditInstructorProfileScreen from '../screens/instructor/EditInstructorProfileScreen';
import ClientProgressScreen from '../screens/instructor/ClientProgressScreen';
import CreateNutritionPlanScreen from '../screens/instructor/CreateNutritionPlanScreen';
import NotificationsScreen from '../screens/member/NotificationsScreen';
import MessagesScreen from '../screens/common/MessagesScreen';
import ChatScreen from '../screens/common/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InstructorDashboard"
      component={InstructorDashboardScreen}
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
  </Stack.Navigator>
);

// Schedule Stack
const ScheduleStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InstructorSchedules"
      component={InstructorSchedulesScreen}
      options={{ title: 'My Schedules' }}
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
  </Stack.Navigator>
);

// Clients Stack
const ClientsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MyClients"
      component={MyClientsScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ClientProgress"
      component={ClientProgressScreen}
      options={{ title: 'Client Progress' }}
    />
    <Stack.Screen
      name="CreateNutritionPlan"
      component={CreateNutritionPlanScreen}
      options={{ title: 'Create Nutrition Plan' }}
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
      name="InstructorProfile"
      component={InstructorProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditInstructorProfileScreen}
      options={{ title: 'Edit Profile' }}
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
  </Stack.Navigator>
);

const InstructorNavigator = () => {
  const { theme: dynamicTheme } = useTheme();
  const colors = dynamicTheme.colors;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Schedules') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'cash' : 'cash-outline';
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
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ title: 'Dashboard', headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Dashboard', { screen: 'InstructorDashboard' });
          },
        })}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsStack}
        options={{ title: 'My Clients', headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Clients', { screen: 'MyClients' });
          },
        })}
      />
      <Tab.Screen
        name="Schedules"
        component={ScheduleStack}
        options={{ title: 'Schedules', headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Schedules', { screen: 'InstructorSchedules' });
          },
        })}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: 'Earnings' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: 'Profile', headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            navigation.navigate('Profile', { screen: 'InstructorProfile' });
          },
        })}
      />
    </Tab.Navigator>
  );
};

export default InstructorNavigator;









