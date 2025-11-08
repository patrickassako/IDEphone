import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { EditorProvider } from './src/contexts/EditorContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Repository } from './src/types';

const Stack = createStackNavigator();

export default function App() {
  const [currentProject, setCurrentProject] = useState<Repository | null>(null);

  const handleProjectSelect = (repo: Repository) => {
    setCurrentProject(repo);
  };

  return (
    <SafeAreaProvider>
      <EditorProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2D2D2D',
              },
              headerTintColor: '#FFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen
              name="Home"
              options={({ navigation }) => ({
                title: 'IDEphone',
                headerRight: () => (
                  <TouchableOpacity
                    style={{ marginRight: 15 }}
                    onPress={() => navigation.navigate('Settings')}
                  >
                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                  </TouchableOpacity>
                ),
              })}
            >
              {(props) => (
                <HomeScreen
                  {...props}
                  onProjectSelect={(repo) => {
                    handleProjectSelect(repo);
                    props.navigation.navigate('Editor');
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={{
                title: currentProject?.name || 'Editor',
                headerBackTitle: 'Projects',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                headerBackTitle: 'Home',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </EditorProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
});
