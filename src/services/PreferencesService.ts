/**
 * Service to manage user preferences for the editor
 */
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black';

class PreferencesServiceClass {
  private editorTheme: EditorTheme = 'vs-dark';
  private useSyntaxHighlightingOnAndroid: boolean = false;

  setEditorTheme(theme: EditorTheme): void {
    this.editorTheme = theme;
  }

  getEditorTheme(): EditorTheme {
    return this.editorTheme;
  }

  setUseSyntaxHighlightingOnAndroid(value: boolean): void {
    this.useSyntaxHighlightingOnAndroid = value;
  }

  getUseSyntaxHighlightingOnAndroid(): boolean {
    return this.useSyntaxHighlightingOnAndroid;
  }
}

export const PreferencesService = new PreferencesServiceClass();
