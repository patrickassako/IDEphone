import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GitService } from '../services/GitService';
import { PreferencesService, EditorTheme } from '../services/PreferencesService';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [githubToken, setGithubToken] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<EditorTheme>(
    PreferencesService.getEditorTheme()
  );

  const handleSaveGitHubToken = () => {
    if (!githubToken.trim()) {
      Alert.alert('Error', 'Please enter a GitHub token');
      return;
    }

    // Store the token
    GitService.setGitHubToken(githubToken);

    Alert.alert(
      'Success',
      'GitHub token saved. You can now clone private repositories.',
      [{ text: 'OK' }]
    );
  };

  const handleThemeChange = (theme: EditorTheme) => {
    setSelectedTheme(theme);
    PreferencesService.setEditorTheme(theme);
    Alert.alert('Success', `Editor theme changed to ${theme}. Reopen files to see the change.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GitHub Authentication</Text>
        <Text style={styles.description}>
          To clone private repositories, you need a GitHub Personal Access Token.
        </Text>
        <Text style={styles.description}>
          Generate one at: github.com → Settings → Developer settings → Personal access tokens
        </Text>
        <Text style={styles.label}>GitHub Token (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="ghp_xxxxxxxxxxxx"
          placeholderTextColor="#666"
          value={githubToken}
          onChangeText={setGithubToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGitHubToken}>
          <Ionicons name="logo-github" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>Save GitHub Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reposButton}
          onPress={() => navigation.navigate('GitHubRepos' as never)}
        >
          <Ionicons name="list" size={20} color="#4A90E2" />
          <Text style={styles.reposButtonText}>Browse My Repositories</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editor Preferences</Text>
        <Text style={styles.description}>
          Choose your preferred editor theme (Monaco Editor)
        </Text>
        <Text style={styles.label}>Theme</Text>

        <TouchableOpacity
          style={[
            styles.themeOption,
            selectedTheme === 'vs-dark' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('vs-dark')}
        >
          <Ionicons
            name={selectedTheme === 'vs-dark' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>Dark (VS Code)</Text>
            <Text style={styles.themeDescription}>
              Dark theme optimized for low-light environments
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            selectedTheme === 'vs-light' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('vs-light')}
        >
          <Ionicons
            name={selectedTheme === 'vs-light' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>Light (VS Code)</Text>
            <Text style={styles.themeDescription}>
              Light theme for bright environments
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            selectedTheme === 'hc-black' && styles.themeOptionSelected,
          ]}
          onPress={() => handleThemeChange('hc-black')}
        >
          <Ionicons
            name={selectedTheme === 'hc-black' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>High Contrast</Text>
            <Text style={styles.themeDescription}>
              High contrast theme for better visibility
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>IDEphone v1.0.0</Text>
        <Text style={styles.aboutText}>Mobile Code Editor with Monaco</Text>
        <Text style={styles.aboutText}>Powered by VS Code Editor</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 15,
  },
  label: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#2D2D2D',
    color: '#FFF',
    padding: 12,
    borderRadius: 5,
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 5,
    marginTop: 15,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  description: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
  },
  aboutText: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 5,
  },
  reposButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4A90E2',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  reposButtonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#2D2D2D',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    borderColor: '#4A90E2',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  themeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  themeTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  themeDescription: {
    color: '#AAA',
    fontSize: 12,
  },
});
