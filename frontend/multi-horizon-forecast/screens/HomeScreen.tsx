import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import type { StackNavigationProp } from '@react-navigation/stack';
import TemplateScreen from './TemplateScreen';

type RootStackParamList = {
  HomeScreen: undefined;
  TemplateScreen: undefined;
  ForecastScreen: undefined;
  InsightsScreen: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PARTICLE_COUNT = 20;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const opacities = Array.from({ length: PARTICLE_COUNT }, () => useSharedValue(0));
  const positions = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * Dimensions.get('window').width,
    y: Math.random() * Dimensions.get('window').height,
  }));

  React.useEffect(() => {
    opacities.forEach((opacity, index) => {
      const animate = () => {
        opacity.value = withTiming(Math.random(), {
          duration: 2000 + Math.random() * 2000,
          easing: Easing.inOut(Easing.ease),
        });
        setTimeout(animate, 2000 + Math.random() * 2000);
      };
      setTimeout(animate, index * 300);
    });
  }, [opacities]);

  const particleStyles = opacities.map((opacity, index) =>
    useAnimatedStyle(() => ({
      position: 'absolute',
      width: 3 + Math.random() * 4,
      height: 3 + Math.random() * 4,
      backgroundColor: '#97FEED',
      borderRadius: 5,
      opacity: opacity.value,
      transform: [
        { translateX: positions[index].x },
        { translateY: positions[index].y },
      ],
    }))
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#050A30', '#0B666A']}
        style={styles.gradientBackground}
      >
        {particleStyles.map((style, index) => (
          <Animated.View key={index} style={[style, styles.particleShadow]} />
        ))}
        <Text style={styles.title}>Multi-Horizon Forecast</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonShadow]}
            onPress={() => navigation.navigate('TemplateScreen')}
          >
            <LinearGradient
              colors={['#0B666A', '#97FEED22']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Data Template</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonShadow]}
            onPress={() => navigation.navigate('ForecastScreen')}
          >
            <LinearGradient
              colors={['#0B666A', '#97FEED22']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Forecasting</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonShadow]}
            onPress={() => navigation.navigate('InsightsScreen')}
          >
            <LinearGradient
              colors={['#0B666A', '#97FEED22']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Insights</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const { width } = Dimensions.get('window');
const buttonWidth = width * 0.8;
const buttonHeight = buttonWidth / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#97FEED',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 40,
    textShadowColor: '#97FEED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: buttonWidth,
    height: buttonHeight,
    borderWidth: 2,
    borderColor: '#97FEED',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonShadow: {
    shadowColor: '#97FEED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#97FEED',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: '#97FEED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  particleShadow: {
    shadowColor: '#97FEED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});

export default HomeScreen;