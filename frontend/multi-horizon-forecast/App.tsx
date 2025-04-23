// App.tsx
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import TemplateScreen from './screens/TemplateScreen';
import ForecastScreen from './screens/ForecastScreen';
import InsightsScreen from './screens/InsightsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  HomeScreen: undefined;
  TemplateScreen: undefined;
  ForecastScreen: undefined;
  InsightsScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TemplateScreen"
          component={TemplateScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForecastScreen"
          component={ForecastScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen
          name="InsightsScreen"
          component={InsightsScreen}
          options={{ headerShown: false }}
        /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;