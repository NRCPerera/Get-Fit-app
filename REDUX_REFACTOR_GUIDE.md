# Redux Data Sync Refactoring - Complete Guide

## Objective
Apply single Redux pattern across all server-backed data to eliminate "stale data until manual refresh" bug.

## What's Already Done ✅

### Store Configuration
- ✅ [src/store/index.js](src/store/index.js) - All 13 slices registered
- ✅ [App.js](App.js) - Dispatches all 13 data fetch thunks on startup

### Redux Slices (All with async thunks + error handling)

**New Slices:**
1. [src/store/slices/membershipSlice.js](src/store/slices/membershipSlice.js)
2. [src/store/slices/paymentSlice.js](src/store/slices/paymentSlice.js)
3. [src/store/slices/measurementSlice.js](src/store/slices/measurementSlice.js)
4. [src/store/slices/medicalSlice.js](src/store/slices/medicalSlice.js)
5. [src/store/slices/notificationSlice.js](src/store/slices/notificationSlice.js)
6. [src/store/slices/workoutSlice.js](src/store/slices/workoutSlice.js)

**Enhanced Existing Slices:**
1. [src/store/slices/exerciseSlice.js](src/store/slices/exerciseSlice.js) - Added fetchExercises
2. [src/store/slices/scheduleSlice.js](src/store/slices/scheduleSlice.js) - Added CRUD thunks
3. [src/store/slices/instructorSlice.js](src/store/slices/instructorSlice.js) - Added async thunks
4. [src/store/slices/nutritionSlice.js](src/store/slices/nutritionSlice.js) - Added CRUD thunks
5. [src/store/slices/userSlice.js](src/store/slices/userSlice.js) - Reference implementation
6. [src/store/slices/authSlice.js](src/store/slices/authSlice.js) - No changes needed
7. [src/store/slices/uiSlice.js](src/store/slices/uiSlice.js) - No changes needed

## Pattern for Screen Refactoring

Every screen follows this pattern:

### 1. Update Imports
```javascript
// REMOVE:
import { membershipAPI } from '../../api/membership.api';

// ADD:
import { useDispatch, useSelector } from 'react-redux';
import { fetchMembershipPlans, fetchMyMemberships } from '../../store/slices/membershipSlice';
```

### 2. Replace useState with useSelector
```javascript
// BEFORE:
const [plans, setPlans] = useState([]);
const [memberships, setMemberships] = useState(null);

// AFTER:
const { plans, myMemberships } = useSelector(state => state.membership);
const dispatch = useDispatch();
```

### 3. Remove useEffect data loading
```javascript
// REMOVE THIS:
useEffect(() => {
  membershipAPI.getPlans().then(res => setPlans(res.data.items));
}, []);

// Data is already loaded in App.js! Just subscribe above.
```

### 4. Update refresh handler
```javascript
// BEFORE:
const onRefresh = () => {
  membershipAPI.getPlans().then(res => setPlans(res.data.items));
};

// AFTER:
const onRefresh = async () => {
  await dispatch(fetchMembershipPlans()).unwrap();
};
```

### 5. Replace API calls with thunk dispatch
```javascript
// BEFORE:
const handlePurchase = async (planId) => {
  await membershipAPI.purchaseMembership(planId);
  setMemberships(await membershipAPI.getMyMemberships());
};

// AFTER:
const handlePurchase = async (planId) => {
  await dispatch(purchaseMembership(planId)).unwrap();
  // myMemberships auto-updates from Redux!
};
```

## Screens to Refactor (13 Total)

### HIGH PRIORITY (Core Functionality - 5 screens)

| Screen | File | Redux Slice | Status |
|--------|------|------------|--------|
| Home | [src/screens/member/HomeScreen.jsx](src/screens/member/HomeScreen.jsx) | user, membership, schedule, payment, workout | 🟡 Started |
| Exercise Library | [src/screens/member/ExerciseLibraryScreen.jsx](src/screens/member/ExerciseLibraryScreen.jsx) | exercise | ⏳ TODO |
| Membership Plans | [src/screens/member/MembershipPlansScreen.jsx](src/screens/member/MembershipPlansScreen.jsx) | membership | ⏳ TODO |
| Create Schedule | [src/screens/member/CreateScheduleScreen.jsx](src/screens/member/CreateScheduleScreen.jsx) | exercise, schedule | ⏳ TODO |
| Edit Schedule | [src/screens/member/EditScheduleScreen.jsx](src/screens/member/EditScheduleScreen.jsx) | schedule | ⏳ TODO |

### MEDIUM PRIORITY (Personal Data - 5 screens)

| Screen | File | Redux Slice | Status |
|--------|------|------------|--------|
| Add Measurement | [src/screens/member/AddMeasurementScreen.jsx](src/screens/member/AddMeasurementScreen.jsx) | measurement | ⏳ TODO |
| Medical Form | [src/screens/member/MedicalFormScreen.jsx](src/screens/member/MedicalFormScreen.jsx) | medical | ⏳ TODO |
| Nutrition | [src/screens/member/NutritionScreen.jsx](src/screens/member/NutritionScreen.jsx) | nutrition | ⏳ TODO |
| Nutrition Detail | [src/screens/member/NutritionDetailScreen.jsx](src/screens/member/NutritionDetailScreen.jsx) | nutrition | ⏳ TODO |
| Payment History | [src/screens/instructor/PaymentHistoryScreen.jsx](src/screens/instructor/PaymentHistoryScreen.jsx) | payment | ⏳ TODO |

### LOWER PRIORITY (Lists & Details - 3 screens)

| Screen | File | Redux Slice | Status |
|--------|------|------------|--------|
| Instructor List | [src/screens/member/InstructorListScreen.jsx](src/screens/member/InstructorListScreen.jsx) | instructor | ⏳ TODO |
| Instructor Detail | [src/screens/member/InstructorDetailScreen.jsx](src/screens/member/InstructorDetailScreen.jsx) | instructor | ⏳ TODO |
| Notifications | [src/screens/common/NotificationsScreen.jsx](src/screens/common/NotificationsScreen.jsx) | notification | ⏳ TODO |

## Quick Refactoring Checklist per Screen

For each screen:
- [ ] Remove API module imports
- [ ] Add Redux imports (useDispatch, useSelector, thunks)
- [ ] Replace useState with useSelector
- [ ] Remove useEffect data loading
- [ ] Update refresh/onLoad handlers to use dispatch
- [ ] Replace all API calls with dispatch(thunk()).unwrap()
- [ ] Test component - data should appear without manual refresh

## Validation Tests

After refactoring each screen:
1. ✅ Screen loads data automatically (no manual refresh needed)
2. ✅ Data persists when navigating away and returning
3. ✅ Manual refresh updates from server
4. ✅ Errors show user-friendly messages
5. ✅ No console errors or warnings

## Architecture Benefits

After completion:
- ✅ Single source of truth for all server data
- ✅ Automatic data sync across all screens
- ✅ No more "stale data until refresh" bugs
- ✅ Consistent error handling
- ✅ Optimized network requests (fetch once, use everywhere)
- ✅ Easy to add loading states, offline support, data caching

## Example: Complete Refactoring of MembershipPlansScreen

### Before
```javascript
const [plans, setPlans] = useState([]);
const [myMemberships, setMyMemberships] = useState(null);

useEffect(() => {
  membershipAPI.getPlans().then(res => {
    setPlans(res.data.items);
  });
  membershipAPI.getMyMemberships().then(res => {
    setMyMemberships(res.data);
  });
}, []);

const handlePurchase = async (planId) => {
  await membershipAPI.purchaseMembership(planId);
  // Manually refresh
  const res = await membershipAPI.getMyMemberships();
  setMyMemberships(res.data);
};
```

### After
```javascript
import { useDispatch, useSelector } from 'react-redux';
import { fetchMembershipPlans, fetchMyMemberships, purchaseMembership } from '../../store/slices/membershipSlice';

const { plans, myMemberships } = useSelector(state => state.membership);
const dispatch = useDispatch();

// No useEffect needed - data loaded in App.js!

const handlePurchase = async (planId) => {
  await dispatch(purchaseMembership(planId)).unwrap();
  // myMemberships auto-updates from Redux!
};

const onRefresh = async () => {
  await dispatch(fetchMembershipPlans()).unwrap();
  await dispatch(fetchMyMemberships()).unwrap();
};
```

## Next Steps

1. Pick highest priority screen (HomeScreen - already started)
2. Follow pattern for each remaining screen
3. Test each refactored screen
4. Verify no console errors
5. All 13 screens should be done within 4-5 refactoring sessions

## Files Summary

**Total Files Modified/Created: 20**
- Store: 2 files (store/index.js, App.js)
- Redux Slices: 13 files (new + enhanced)
- Screens: 1 file started (HomeScreen), 13 remaining

**Pattern Consistency:** All slices follow identical async thunk pattern with pending/fulfilled/rejected handlers and automatic refetch on mutations.
