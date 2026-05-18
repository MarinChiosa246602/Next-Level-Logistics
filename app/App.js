import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import SubmissionScreen from './src/screens/SubmissionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors, spacing } from './src/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: colors.white,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
  },
};

function HomeStack({ farmerId, farmId, lang, setLang, isOffline }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeTab"
        options={{ headerShown: false }}
      >
        {() => <HomeScreen navigation={null} lang={lang} setLang={setLang} isOffline={isOffline} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function SubmissionStack({ farmerId, farmId, lang, navigation }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="SubmissionTab"
        options={{ title: 'Log Harvest' }}
      >
        {(props) => <SubmissionScreen {...props} farmerId={farmerId} farmId={farmId} lang={lang} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function HistoryStack({ farmerId, lang }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="HistoryTab"
        options={{ title: 'Harvest Records' }}
      >
        {() => <HistoryScreen farmerId={farmerId} lang={lang} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainTabs({ farmerId, farmId, lang, setLang, isOffline }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          borderTopColor: colors.border,
          paddingBottom: spacing.xs,
          paddingTop: spacing.xs,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="📊" color={color} />,
        }}
      >
        {() => <HomeStack farmerId={farmerId} farmId={farmId} lang={lang} setLang={setLang} isOffline={isOffline} />}
      </Tab.Screen>

      <Tab.Screen
        name="Submission"
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ color }) => <TabIcon name="📸" color={color} />,
        }}
      >
        {() => <SubmissionStack farmerId={farmerId} farmId={farmId} lang={lang} />}
      </Tab.Screen>

      <Tab.Screen
        name="History"
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <TabIcon name="📋" color={color} />,
        }}
      >
        {() => <HistoryStack farmerId={farmerId} lang={lang} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function TabIcon({ name, color }) {
  return <Text style={{ fontSize: 20, color }}>{name}</Text>;
}

export default function App() {
  const [lang, setLang] = useState('nl');
  const [isOffline, setIsOffline] = useState(false);
  const [farmerId, setFarmerId] = useState(null);
  const [farmId, setFarmId] = useState(null);

  const handleLogin = (farmer) => {
    setFarmerId(farmer.farmer_id);
    setFarmId(farmer.farm_id);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!farmerId ? (
          <Stack.Screen
            name="Login"
            options={{ animationEnabled: false }}
          >
            {() => <LoginScreen navigation={{ navigate: (name, params) => {
              if (name === 'Home') handleLogin(params);
            }}} lang={lang} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp" options={{ animationEnabled: false }}>
            {() => <MainTabs farmerId={farmerId} farmId={farmId} lang={lang} setLang={setLang} isOffline={isOffline} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}