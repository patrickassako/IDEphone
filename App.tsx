import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { EditorProvider } from './src/contexts/EditorContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
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
              options={{ title: 'IDEphone' }}
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
