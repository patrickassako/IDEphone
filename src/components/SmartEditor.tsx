import React from 'react';
import { Platform } from 'react-native';
import { MonacoEditor } from './MonacoEditor';
import { EnhancedCodeEditor } from './EnhancedCodeEditor';

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
 * - Android: Native TextInput (EnhancedCodeEditor) - Better keyboard support
 * - iOS/Web: Monaco Editor - Advanced features and syntax highlighting
 */
export const SmartEditor: React.FC<SmartEditorProps> = (props) => {
  // Use native editor on Android due to WebView keyboard issues
  // Use Monaco on iOS for advanced features
  if (Platform.OS === 'android') {
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

  return (
    <MonacoEditor
      filePath={props.filePath}
      fileName={props.fileName}
      initialContent={props.initialContent}
      language={props.language}
      onContentChange={props.onContentChange}
      onSave={props.onSave}
      readOnly={props.readOnly}
      theme={props.theme}
    />
  );
};
