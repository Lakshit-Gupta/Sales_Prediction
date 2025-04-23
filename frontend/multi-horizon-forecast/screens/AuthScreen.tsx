import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase.config'; // Adjust the import path as necessary
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Navigation types
type RootStackParamList = {
  Auth: undefined;
  HomeScreen: undefined;
  Forecast: undefined;
  Insights: {
    forecast: { p10: number[]; p50: number[]; p90: number[] };
    store_name: string;
    item_name: string;
    history: number[];
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [storeName, setStoreName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [confirm, setConfirm] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [items, setItems] = useState<string[]>([]);
  const [showOtp, setShowOtp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Google Auth setup with Expo proxy
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '700644976114-3gooorrn2hhgorrune2e6osompd0nd8l.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@athira_12/multi-horizon-forecast-new',
    scopes: ['profile', 'email'],
  });
  
  // Load cached user state
  useEffect(() => {
    const loadUserState = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('userInfo');
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          setUserInfo(user);
          const store = user.displayName || storeName || 'Default Store';
          setStoreName(store);
          setItems([
            `${store} - Gadget X`,
            `${store} - Widget Y`,
            `${store} - Tool Z`,
          ]);
          navigation.navigate('HomeScreen');
        }
      } catch (error) {
        console.error('Load User State Error:', error);
      }
      setLoading(false);
    };
    loadUserState();
  }, [navigation]);

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const store = storeName || userCredential.user.displayName || 'Default Store';
          setStoreName(store);
          setUserInfo(userCredential.user);
          await AsyncStorage.setItem('userInfo', JSON.stringify(userCredential.user));
          Alert.alert('Success', `Logged in as ${store}`);
          navigation.navigate('HomeScreen');
        })
        .catch((error) => {
          console.error('Google Sign-In Error:', error);
          Alert.alert('Error', `Failed to sign in with Google: ${error.message}`);
        });
    } else if (response?.type === 'error') {
      console.error('Google Auth Error:', response);
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
    }
  }, [response, navigation]);

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userState) => {
      if (userState) {
        const store = storeName || userState.displayName || 'Default Store';
        setStoreName(store);
        setUserInfo(userState);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userState));
        setItems([
          `${store} - Gadget X`,
          `${store} - Widget Y`,
          `${store} - Tool Z`,
        ]);
        navigation.navigate('HomeScreen');
      } else {
        setItems([]);
        setStoreName('');
        await AsyncStorage.removeItem('userInfo');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigation]);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      if (!request) {
        Alert.alert('Error', 'Google Auth not ready. Try again.');
        return;
      }
      await promptAsync();
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', `Failed to sign in with Google: ${error.message}`);
    }
  };

  // Phone OTP: Send OTP (Placeholder)
  const handleSendOtp = async () => {
    try {
      Alert.alert('Note', 'Phone OTP requires reCAPTCHA setup. Coming in next step!');
      setShowOtp(true);
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      Alert.alert('Error', `Failed to send OTP: ${error.message}`);
    }
  };

  // Phone OTP: Verify OTP
  const handleVerifyOtp = async () => {
    try {
      if (confirm) {
        const userCredential = await confirm.confirm(otp);
        const store = storeName || 'Phone User Store';
        setStoreName(store);
        setShowOtp(false);
        setOtp('');
        setPhoneNumber('');
        setConfirm(null);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userCredential.user));
        Alert.alert('Success', `Logged in as ${store}`);
        navigation.navigate('HomeScreen');
      }
    } catch (error: any) {
      console.error('OTP Verify Error:', error);
      Alert.alert('Error', 'Invalid OTP.');
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUserInfo(null);
      setStoreName('');
      setItems([]);
      setShowOtp(false);
      setPhoneNumber('');
      setOtp('');
      setConfirm(null);
      await AsyncStorage.removeItem('userInfo');
      Alert.alert('Success', 'Signed out successfully.');
    } catch (error: any) {
      console.error('Sign Out Error:', error);
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const goToForecast = (itemName: string) => {
    navigation.navigate('Forecast');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A30', '#0B666A']} style={styles.gradientBackground}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Store Login</Text>
          {loading ? (
            <Text style={styles.welcomeText}>Loading...</Text>
          ) : (
            <View style={styles.formContainer}>
              {!userInfo ? (
                <>
                  <Text style={styles.label}>Store Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={storeName}
                    onChangeText={setStoreName}
                    placeholder="Enter store name"
                    placeholderTextColor="#97FEED66"
                  />
                  {!showOtp ? (
                    <>
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="Enter phone number (e.g., +1234567890)"
                        placeholderTextColor="#97FEED66"
                        keyboardType="phone-pad"
                      />
                      <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                        <Text style={styles.buttonText}>Send OTP</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, { opacity: request ? 1 : 0.5 }]}
                        onPress={handleGoogleSignIn}
                        disabled={!request}
                      >
                        <Text style={styles.buttonText}>Sign in with Google</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Enter OTP</Text>
                      <TextInput
                        style={styles.input}
                        value={otp}
                        onChangeText={setOtp}
                        placeholder="Enter 6-digit OTP"
                        placeholderTextColor="#97FEED66"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                        <Text style={styles.buttonText}>Verify OTP</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.welcomeText}>Welcome, {storeName}</Text>
                  <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutButtonText}>Sign Out</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          {items.length > 0 && (
            <View style={styles.itemsContainer}>
              <Text style={styles.sectionTitle}>Items in {storeName}</Text>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.itemButton}
                  onPress={() => goToForecast(item)}
                >
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  title: {
    color: '#97FEED',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 20,
    textShadowColor: 'rgba(151, 254, 237, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(5, 10, 48, 0.67)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderColor: 'rgba(151, 254, 237, 0.2)',
    borderWidth: 1,
  },
  label: {
    color: '#97FEED',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(5, 10, 48, 0.67)',
    color: '#97FEED',
    borderColor: 'rgba(151, 254, 237, 0.4)',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#0B666A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#97FEED',
    fontSize: 16,
    fontWeight: '600',
  },
  welcomeText: {
    color: '#97FEED',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  signOutButton: {
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#050A30',
    fontSize: 16,
    fontWeight: '600',
  },
  itemsContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(5, 10, 48, 0.67)',
    borderRadius: 10,
    padding: 15,
    borderColor: 'rgba(151, 254, 237, 0.2)',
    borderWidth: 1,
  },
  sectionTitle: {
    color: '#97FEED',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  itemButton: {
    backgroundColor: '#0B666A',
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  itemText: {
    color: '#97FEED',
    fontSize: 16,
  },
});

export default AuthScreen;