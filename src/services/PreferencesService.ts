/**
 * Service to manage user preferences for the editor
 */
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black';

class PreferencesServiceClass {
  private editorTheme: EditorTheme = 'vs-dark';

  setEditorTheme(theme: EditorTheme): void {
    this.editorTheme = theme;
  }

  getEditorTheme(): EditorTheme {
    return this.editorTheme;
  }
}

export const PreferencesService = new PreferencesServiceClass();
