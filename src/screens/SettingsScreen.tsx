import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GitService } from '../services/GitService';
import { PreferencesService, EditorTheme } from '../services/PreferencesService';
import { AIService, AIProviderType } from '../services/ai';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [githubToken, setGithubToken] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<EditorTheme>(
    PreferencesService.getEditorTheme()
  );
  const [androidSyntaxHighlighting, setAndroidSyntaxHighlighting] = useState(
    PreferencesService.getUseSyntaxHighlightingOnAndroid()
  );

  // AI Settings
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProviderType>('claude');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  useEffect(() => {
    // Load AI settings on mount
    const loadAISettings = async () => {
      const enabled = await AIService.isEnabled();
      setAiEnabled(enabled);
      setAiProvider(AIService.getProviderType());
    };
    loadAISettings();
  }, []);

  const handleSaveAIApiKey = async () => {
    console.log('[Settings] Save AI API Key clicked');
    if (!aiApiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setIsValidatingKey(true);
    console.log('[Settings] Validating key for provider:', aiProvider);

    try {
      // Validate API key (will throw error if invalid)
      await AIService.validateApiKey(aiApiKey, aiProvider);

      console.log('[Settings] API key validated successfully');

      // Save configuration
      await AIService.configure({
        provider: aiProvider,
        apiKey: aiApiKey,
      });

      await AIService.setEnabled(true);
      setAiEnabled(true);

      const providerName =
        aiProvider === 'claude' ? 'Claude' :
        aiProvider === 'gemini' ? 'Gemini' :
        aiProvider === 'groq' ? 'Groq' :
        aiProvider === 'deepseek' ? 'DeepSeek' :
        aiProvider === 'mistral' ? 'Mistral' :
        aiProvider;
      Alert.alert(
        'Success',
        `${providerName} AI configured successfully! You can now use AI features in the editor.`,
        [{ text: 'OK' }]
      );

      setAiApiKey(''); // Clear the input for security
    } catch (error: any) {
      console.error('[Settings] Validation error:', error);
      Alert.alert('Error', error.message || 'Failed to validate API key');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleAIToggle = async (value: boolean) => {
    if (value && !AIService.isConfigured()) {
      Alert.alert(
        'AI Not Configured',
        'Please configure your AI API key first.',
        [{ text: 'OK' }]
      );
      return;
    }

    await AIService.setEnabled(value);
    setAiEnabled(value);
  };

  const handleClearAIConfig = async () => {
    Alert.alert(
      'Clear AI Configuration',
      'Are you sure you want to remove your AI API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AIService.clearConfiguration();
            await AIService.setEnabled(false);
            setAiEnabled(false);
            setAiApiKey('');
            Alert.alert('Success', 'AI configuration cleared');
          },
        },
      ]
    );
  };

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

  const handleAndroidSyntaxToggle = (value: boolean) => {
    setAndroidSyntaxHighlighting(value);
    PreferencesService.setUseSyntaxHighlightingOnAndroid(value);
    if (value) {
      Alert.alert(
        'Android Syntax Highlighting Enabled',
        'You will now have syntax highlighting on Android. Note: keyboard behavior may be less stable than native editor. Reopen files to see changes.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Android Syntax Highlighting Disabled',
        'You will use the native editor on Android with perfect keyboard but no syntax highlighting. Reopen files to see changes.',
        [{ text: 'OK' }]
      );
    }
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
        <Text style={styles.sectionTitle}>🤖 AI Assistant</Text>
        <Text style={styles.description}>
          Enable AI-powered code assistance. Get help fixing bugs, explaining code, refactoring, and more. Choose from multiple AI providers.
        </Text>

        <View style={styles.switchContainer}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchTitle}>Enable AI Assistant</Text>
            <Text style={styles.switchDescription}>
              {AIService.isConfigured()
                ? `Using ${
                    aiProvider === 'claude' ? 'Claude' :
                    aiProvider === 'gemini' ? 'Gemini' :
                    aiProvider === 'groq' ? 'Groq' :
                    aiProvider === 'deepseek' ? 'DeepSeek' :
                    aiProvider === 'mistral' ? 'Mistral' :
                    aiProvider
                  } AI`
                : 'Configure API key to enable'}
            </Text>
          </View>
          <Switch
            value={aiEnabled}
            onValueChange={handleAIToggle}
            trackColor={{ false: '#767577', true: '#4A90E2' }}
            thumbColor={aiEnabled ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <Text style={styles.label}>AI Provider</Text>
        <TouchableOpacity
          style={[
            styles.themeOption,
            aiProvider === 'claude' && styles.themeOptionSelected,
          ]}
          onPress={() => setAiProvider('claude')}
        >
          <Ionicons
            name={aiProvider === 'claude' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>Claude (Anthropic)</Text>
            <Text style={styles.themeDescription}>
              Best for code. 200K context. Recommended.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            aiProvider === 'gemini' && styles.themeOptionSelected,
          ]}
          onPress={() => setAiProvider('gemini')}
        >
          <Ionicons
            name={aiProvider === 'gemini' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>Gemini (Google)</Text>
            <Text style={styles.themeDescription}>
              Free tier available. 1M context. Great alternative.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            aiProvider === 'groq' && styles.themeOptionSelected,
          ]}
          onPress={() => setAiProvider('groq')}
        >
          <Ionicons
            name={aiProvider === 'groq' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>⚡ Groq</Text>
            <Text style={styles.themeDescription}>
              Ultra-fast inference. Free tier. 300+ tokens/sec. Llama 3.3 70B.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            aiProvider === 'deepseek' && styles.themeOptionSelected,
          ]}
          onPress={() => setAiProvider('deepseek')}
        >
          <Ionicons
            name={aiProvider === 'deepseek' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>💰 DeepSeek</Text>
            <Text style={styles.themeDescription}>
              Ultra-low cost. $0.07 per 200K tokens. GPT-4 level performance.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            aiProvider === 'mistral' && styles.themeOptionSelected,
          ]}
          onPress={() => setAiProvider('mistral')}
        >
          <Ionicons
            name={aiProvider === 'mistral' ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color="#4A90E2"
          />
          <View style={styles.themeInfo}>
            <Text style={styles.themeTitle}>💻 Mistral Codestral</Text>
            <Text style={styles.themeDescription}>
              Specialized for code. Quasi-free API. Perfect for IDEphone.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>API Key</Text>
        <Text style={styles.description}>
          {aiProvider === 'claude' && 'Get your key at: console.anthropic.com'}
          {aiProvider === 'openai' && 'Get your key at: platform.openai.com'}
          {aiProvider === 'gemini' && 'Get your key at: aistudio.google.com/apikey'}
          {aiProvider === 'groq' && 'Get your FREE key at: console.groq.com'}
          {aiProvider === 'deepseek' && 'Get your key at: platform.deepseek.com'}
          {aiProvider === 'mistral' && 'Get your key at: console.mistral.ai'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={
            aiProvider === 'claude' ? 'sk-ant-api03-...' :
            aiProvider === 'openai' ? 'sk-...' :
            aiProvider === 'gemini' ? 'AIza...' :
            aiProvider === 'groq' ? 'gsk_...' :
            aiProvider === 'deepseek' ? 'sk-...' :
            aiProvider === 'mistral' ? 'api-key...' :
            'Enter your API key'
          }
          placeholderTextColor="#666"
          value={aiApiKey}
          onChangeText={setAiApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.saveButton, isValidatingKey && styles.buttonDisabled]}
          onPress={handleSaveAIApiKey}
          disabled={isValidatingKey}
        >
          <Ionicons name="sparkles" size={20} color="#FFF" />
          <Text style={styles.saveButtonText}>
            {isValidatingKey ? 'Validating...' : 'Save & Validate API Key'}
          </Text>
        </TouchableOpacity>

        {AIService.isConfigured() && (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearAIConfig}
          >
            <Ionicons name="trash-outline" size={20} color="#FF4444" />
            <Text style={styles.dangerButtonText}>Clear AI Configuration</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editor Preferences</Text>
        <Text style={styles.description}>
          Choose your preferred editor theme and settings
        </Text>

        {Platform.OS === 'android' && (
          <>
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchTitle}>Syntax Highlighting (Android)</Text>
                <Text style={styles.switchDescription}>
                  Enable color highlighting. May affect keyboard stability.
                </Text>
              </View>
              <Switch
                value={androidSyntaxHighlighting}
                onValueChange={handleAndroidSyntaxToggle}
                trackColor={{ false: '#767577', true: '#4A90E2' }}
                thumbColor={androidSyntaxHighlighting ? '#FFF' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.warningText}>
              ⚠️ If you experience keyboard issues, disable this option
            </Text>
          </>
        )}

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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 5,
    marginBottom: 10,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  switchDescription: {
    color: '#AAA',
    fontSize: 12,
  },
  warningText: {
    color: '#FFA500',
    fontSize: 12,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF4444',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
  },
  dangerButtonText: {
    color: '#FF4444',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
