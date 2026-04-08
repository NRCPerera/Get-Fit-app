# Gym Management System - Mobile App

A comprehensive mobile application for gym management built with React Native and Expo.

## Features

- **User Authentication**: Login, registration, and password recovery
- **Role-Based Access**: Different interfaces for members, instructors, and admins
- **Exercise Library**: Browse exercises with categories and difficulty levels
- **Training Schedules**: Create and manage workout schedules
- **Nutrition Plans**: View and track nutrition plans
- **Instructor Profiles**: Browse instructors and view reviews
- **Payment Integration**: Stripe payment processing
- **Medical Forms**: Health information collection
- **Notifications**: Real-time push notifications
- **Offline Support**: Basic offline functionality

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **Payments**: Stripe React Native
- **Forms**: Formik with Yup validation
- **Charts**: React Native Chart Kit
- **Calendar**: React Native Calendars
- **Storage**: Expo Secure Store
- **Notifications**: Expo Notifications

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values

5. Start the development server:
   ```bash
   npm start
   ```

6. Run on specific platforms:
   ```bash
   npm run android  # Android
   npm run ios      # iOS
   npm run web      # Web
   ```

## Environment Variables

- `API_URL`: Backend API URL
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID

## Project Structure

```
src/
├── api/              # API client and endpoints
├── assets/           # Images, icons, fonts
├── components/       # Reusable components
│   ├── common/       # Common UI components
│   ├── exercise/     # Exercise-related components
│   ├── schedule/     # Schedule-related components
│   ├── instructor/   # Instructor-related components
│   ├── nutrition/    # Nutrition-related components
│   ├── payment/      # Payment-related components
│   └── forms/        # Form components
├── navigation/       # Navigation configuration
├── screens/          # Screen components
│   ├── auth/         # Authentication screens
│   ├── member/       # Member screens
│   ├── instructor/   # Instructor screens
│   └── admin/        # Admin screens
├── store/            # Redux store and slices
├── hooks/            # Custom React hooks
├── utils/            # Utility functions
├── styles/           # Style definitions
└── services/         # External services
```

## User Roles

### Member
- View and manage profile
- Browse exercise library
- Create and manage schedules
- Browse instructors
- Make payments
- Submit medical forms
- View nutrition plans

### Instructor
- Manage instructor profile
- View assigned clients
- Create schedules for clients
- Create nutrition plans
- View earnings
- Manage availability

### Admin
- Manage all users
- Manage exercises
- View analytics
- Manage payments
- System administration

## Development

- **Start development server**: `npm start`
- **Run on Android**: `npm run android`
- **Run on iOS**: `npm run ios`
- **Run on Web**: `npm run web`
- **Build for production**: `expo build`

## License

ISC
















