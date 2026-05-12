import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import SubmissionScreen from './src/screens/SubmissionScreen';

const Stack = createStackNavigator();

export default function App() {
  // For demo purposes, using hardcoded farmer and farm IDs
  // In a real app, these would come from authentication/login
  const farmerId = 'ae94c048-e694-4c0d-92b7-d2dcda80775c'; // From seed data
  const farmId = '3bcfc095-027b-48a7-8733-2620948f6d28'; // From seed data

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Submission">
        <Stack.Screen
          name="Submission"
          component={SubmissionScreen}
          initialParams={{ farmerId, farmId }}
          options={{
            title: 'Farmer Data Collection',
            headerStyle: {
              backgroundColor: '#4CAF50',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}