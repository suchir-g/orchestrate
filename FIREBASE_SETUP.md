# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter project name
   - Enable/disable Google Analytics (optional)
   - Accept terms and create project

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (</>) to add a web app
2. Register your app with a nickname (e.g., "Orchestrate Web")
3. **Copy the Firebase configuration object** - you'll need these values!

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and fill in your Firebase configuration values:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIzaSy...
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEFG
   ```

## Step 4: Enable Google Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Click **Enable**
4. Select a support email
5. Click **Save**

## Step 5: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development) or **Start in production mode**
4. Select a location (choose closest to your users)
5. Click **Enable**

### Recommended Firestore Security Rules (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Events - anyone can read, only authenticated users can write
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Orders - users can only read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null &&
                         resource.data.userId == request.auth.uid;
    }

    // Tickets - users can only read/write their own tickets
    match /tickets/{ticketId} {
      allow read, write: if request.auth != null &&
                         resource.data.userId == request.auth.uid;
    }

    // Shipments - similar to orders
    match /shipments/{shipmentId} {
      allow read, write: if request.auth != null &&
                         resource.data.userId == request.auth.uid;
    }
  }
}
```

## Step 6: Enable Firebase Storage (Optional)

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose security rules (start in test mode for development)
4. Select a location
5. Click **Done**

## Step 7: Update Your Code to Use Firebase Auth

### Option A: Update BlockchainContext to include Firebase Auth

Add Firebase auth alongside blockchain auth in `src/context/BlockchainContext.js`:

```javascript
import { signInWithGoogle, logout, onAuthStateChange } from '../services/firebaseAuthService';

// Add to state
const [firebaseUser, setFirebaseUser] = useState(null);

// Listen to Firebase auth changes
useEffect(() => {
  const unsubscribe = onAuthStateChange((user) => {
    setFirebaseUser(user);
  });
  return () => unsubscribe();
}, []);

// Add Firebase login method
const loginWithGoogle = async () => {
  const { user, error } = await signInWithGoogle();
  if (error) {
    console.error('Login error:', error);
  }
};
```

### Option B: Create a separate AuthContext

Create `src/context/AuthContext.js`:

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInWithGoogle, logout, onAuthStateChange } from '../services/firebaseAuthService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { user, error } = await signInWithGoogle();
    return { user, error };
  };

  const signOut = async () => {
    await logout();
  };

  const value = {
    user,
    loading,
    loginWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

## Step 8: Using Firebase in Your Components

### Authentication Example:

```javascript
import { signInWithGoogle, logout } from '../services/firebaseAuthService';

const handleGoogleLogin = async () => {
  const { user, error } = await signInWithGoogle();
  if (error) {
    toast.error('Login failed: ' + error);
  } else {
    toast.success('Logged in successfully!');
  }
};

const handleLogout = async () => {
  await logout();
  toast.success('Logged out successfully!');
};
```

### Database Example:

```javascript
import { createEvent, getAllEvents, listenToEvents } from '../services/firebaseDbService';

// Create an event
const handleCreateEvent = async () => {
  const { id, error } = await createEvent({
    name: 'Tech Conference 2024',
    date: '2024-03-15',
    location: 'NYC',
    userId: user.uid
  });

  if (error) {
    toast.error('Error creating event: ' + error);
  } else {
    toast.success('Event created!');
  }
};

// Get all events
const fetchEvents = async () => {
  const { data, error } = await getAllEvents();
  if (data) {
    setEvents(data);
  }
};

// Real-time listener
useEffect(() => {
  const unsubscribe = listenToEvents((events) => {
    setEvents(events);
  });
  return () => unsubscribe();
}, []);
```

## Step 9: Test Your Setup

1. Start your development server:
   ```bash
   npm start
   ```

2. Try logging in with Google
3. Check Firebase Console > Authentication to see the new user
4. Try creating data and check Firestore Database

## Troubleshooting

### "Firebase not configured" error
- Make sure all environment variables are set in `.env`
- Restart your development server after changing `.env`

### Google Sign-in popup blocked
- Check browser popup blocker settings
- Try using `signInWithRedirect` instead of `signInWithPopup`

### Permission denied errors
- Check your Firestore security rules
- Make sure the user is authenticated
- Verify `userId` field matches `auth.uid`

### CORS errors
- Add your domain to authorized domains in Firebase Console > Authentication > Settings

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
