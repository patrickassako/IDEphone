import { Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

export interface FolderPickerResult {
  success: boolean;
  folderName?: string;
  folderUri?: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
  error?: string;
}

export class FolderPickerService {
  /**
   * Open a folder picker with platform-specific implementation
   * - Android: Uses multiple file selection (SAF limitation workaround)
   * - iOS: Uses multiple file selection from Files app
   */
  static async pickFolder(): Promise<FolderPickerResult> {
    try {
      if (Platform.OS === 'android') {
        return await this.pickFolderAndroid();
      } else if (Platform.OS === 'ios') {
        return await this.pickFolderIOS();
      } else {
        return {
          success: false,
          error: 'Platform not supported',
        };
      }
    } catch (error) {
      console.error('Error picking folder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Android implementation: Multiple file selection
   * Note: Android SAF doesn't expose directory picker in expo-document-picker
   * We use multiple file selection as a workaround
   */
  private static async pickFolderAndroid(): Promise<FolderPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Cancelled' };
      }

      const files = result.assets;

      // Extract common folder name from file paths
      const folderName = this.extractFolderName(files[0].name);

      // Read all files
      const fileContents = await Promise.all(
        files.map(async (file) => ({
          path: file.name,
          content: await FileSystem.readAsStringAsync(file.uri),
        }))
      );

      return {
        success: true,
        folderName,
        files: fileContents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pick folder',
      };
    }
  }

  /**
   * iOS implementation: Multiple file selection from Files app
   * iOS doesn't provide direct folder access, so we use multiple file selection
   */
  private static async pickFolderIOS(): Promise<FolderPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Cancelled' };
      }

      const files = result.assets;

      // Extract folder name from first file
      const folderName = this.extractFolderName(files[0].name);

      // Read all files
      const fileContents = await Promise.all(
        files.map(async (file) => ({
          path: file.name,
          content: await FileSystem.readAsStringAsync(file.uri),
        }))
      );

      return {
        success: true,
        folderName,
        files: fileContents,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pick folder',
      };
    }
  }

  /**
   * Extract a reasonable folder name from a file path or name
   */
  private static extractFolderName(fileName: string): string {
    // Try to get parent folder name from path
    const parts = fileName.split('/');
    if (parts.length > 1) {
      return parts[parts.length - 2].replace(/[^a-zA-Z0-9-_]/g, '_');
    }

    // Fallback to generic name
    return 'ImportedProject_' + Date.now();
  }

  /**
   * Show instructions to the user on how to select a folder
   */
  static showFolderPickerInstructions(): void {
    const instructions = Platform.select({
      android:
        'Sur Android:\n\n' +
        '1. Sélectionnez tous les fichiers de votre projet\n' +
        '2. Vous pouvez sélectionner plusieurs fichiers à la fois\n' +
        '3. Ou utilisez un fichier ZIP pour plus de facilité',
      ios:
        'Sur iOS:\n\n' +
        '1. Ouvrez l\'app Files\n' +
        '2. Sélectionnez tous les fichiers de votre projet\n' +
        '3. Ou utilisez un fichier ZIP pour plus de facilité\n' +
        '4. Appuyez sur "Sélectionner" en haut à droite',
      default: 'Sélectionnez plusieurs fichiers de votre projet',
    });

    Alert.alert('Comment sélectionner un projet ?', instructions, [
      { text: 'OK' }
    ]);
  }
}
