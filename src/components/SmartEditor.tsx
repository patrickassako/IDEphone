import React from 'react';
import { Platform } from 'react-native';
import { LightEditor } from './LightEditor';
import { EnhancedCodeEditor } from './EnhancedCodeEditor';
import { PreferencesService } from '../services/PreferencesService';

interface SmartEditorProps {
  filePath: string;
  fileName: string;
  initialContent?: string;
  language?: string;
  onContentChange?: (content: string, isDirty: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'vs-light' | 'hc-black';
}

/**
 * Smart Editor - Uses platform-specific editor for best experience
 * - Android: Native TextInput (EnhancedCodeEditor) by default OR LightEditor if user enables
 * - iOS/Web: LightEditor (Prism.js) - Syntax highlighting that actually works
 */
export const SmartEditor: React.FC<SmartEditorProps> = (props) => {
  const editorTheme = props.theme === 'vs-light' ? 'light' : 'dark';

  // On Android, check user preference
  if (Platform.OS === 'android') {
    const useSyntaxHighlighting = PreferencesService.getUseSyntaxHighlightingOnAndroid();

    if (useSyntaxHighlighting) {
      // User chose syntax highlighting (may have keyboard issues)
      return (
        <LightEditor
          filePath={props.filePath}
          fileName={props.fileName}
          initialContent={props.initialContent}
          language={props.language}
          onContentChange={props.onContentChange}
          onSave={props.onSave}
          readOnly={props.readOnly}
          theme={editorTheme}
        />
      );
    } else {
      // Default: Native editor (best keyboard)
      return (
        <EnhancedCodeEditor
          filePath={props.filePath}
          fileName={props.fileName}
          initialContent={props.initialContent}
          onContentChange={props.onContentChange}
          onSave={props.onSave}
          readOnly={props.readOnly}
        />
      );
    }
  }

  // Use LightEditor on iOS - simple and works reliably
  return (
    <LightEditor
      filePath={props.filePath}
      fileName={props.fileName}
      initialContent={props.initialContent}
      language={props.language}
      onContentChange={props.onContentChange}
      onSave={props.onSave}
      readOnly={props.readOnly}
      theme={editorTheme}
    />
  );
};
