// API Configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// User Roles
export const ROLES = {
  MEMBER: 'member',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
};

// Exercise Categories
export const EXERCISE_CATEGORIES = {
  CARDIO: 'cardio',
  STRENGTH: 'strength',
  FLEXIBILITY: 'flexibility',
  BALANCE: 'balance',
  SPORTS: 'sports',
  FUNCTIONAL: 'functional',
};

// Exercise Difficulty Levels
export const EXERCISE_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

// Muscle Groups
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  ARMS: 'arms',
  LEGS: 'legs',
  CORE: 'core',
  GLUTES: 'glutes',
  CALVES: 'calves',
};

// Days of the Week
export const DAYS_OF_WEEK = {
  MONDAY: 'monday',
  TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday',
  THURSDAY: 'thursday',
  FRIDAY: 'friday',
  SATURDAY: 'saturday',
  SUNDAY: 'sunday',
};

// Meal Types
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// File Upload
export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
  EMAIL_REGEX: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Gym Management',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@gymmanagement.com',
  PRIVACY_POLICY_URL: 'https://gymmanagement.com/privacy',
  TERMS_OF_SERVICE_URL: 'https://gymmanagement.com/terms',
};









