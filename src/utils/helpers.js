import { format as formatDateFns, parseISO } from 'date-fns';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const formatDate = (date, format = 'yyyy-MM-dd') => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDateFns(d, format);
  } catch {
    return '';
  }
};

export const calculateAge = (dateOfBirth) => {
  try {
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
};

export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount) || 0);
  } catch {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

export const getInitials = (name) => {
  if (!name) return '';
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
};

export const calculateBMI = (weightKg, heightCm) => {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) return null;
  const bmi = w / (h * h);
  return Math.round(bmi * 10) / 10;
};

/**
 * Get full URL for an uploaded file from a relative path or Cloudinary object
 * @param {String|Object} relativePath - Relative path from uploads directory (e.g., "profiles/image.jpg") or Cloudinary object with secure_url
 * @returns {String|null} - Full URL to the file, or null if path is invalid
 */
export const getFileUrl = (relativePath) => {
  if (!relativePath) return null;
  
  // Handle Cloudinary object (object with secure_url or url property)
  if (typeof relativePath === 'object') {
    if (relativePath.secure_url) {
      return relativePath.secure_url;
    }
    if (relativePath.url) {
      return relativePath.url;
    }
    // If object but no URL property, return null
    return null;
  }
  
  // Ensure it's a string
  if (typeof relativePath !== 'string') {
    return null;
  }
  
  // If it's already a full URL (http/https), return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Get API base URL from environment or constants (same logic as client.js)
  let baseUrl = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api/v1';
  
  // Handle platform-specific localhost replacement (same as client.js)
  if (Platform.OS !== 'web') {
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      const manifest = Constants.expoConfig;
      if (manifest?.hostUri) {
        const ip = manifest.hostUri.split(':')[0];
        baseUrl = baseUrl.replace('localhost', ip).replace('127.0.0.1', ip);
      } else if (Constants.debuggerHost) {
        const ip = Constants.debuggerHost.split(':')[0];
        baseUrl = baseUrl.replace('localhost', ip).replace('127.0.0.1', ip);
      }
    }
    
    // Fix localhost for Android emulator
    if (Platform.OS === 'android' && baseUrl.includes('localhost') && !Constants.debuggerHost) {
      baseUrl = baseUrl.replace('localhost', '10.0.2.2');
    }
  }
  
  // Remove /api/v1 to get the server base URL
  baseUrl = baseUrl.replace(/\/api\/v1$/, '');
  
  // Ensure relativePath doesn't start with /
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Return full URL: baseUrl + /uploads/ + path
  return `${baseUrl}/uploads/${cleanPath}`;
};


