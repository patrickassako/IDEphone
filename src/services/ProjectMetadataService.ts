/**
 * Project Metadata Service
 * Stores and retrieves project metadata including deployment URLs
 * Uses AsyncStorage for persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProjectMetadata, ProjectDeployment } from '../types';

const METADATA_KEY = '@idephone_project_metadata';

export class ProjectMetadataService {
  /**
   * Get metadata for a specific project
   */
  static async getProjectMetadata(projectPath: string): Promise<ProjectMetadata | null> {
    try {
      const allMetadata = await this.getAllMetadata();
      return allMetadata.find(m => m.path === projectPath) || null;
    } catch (error) {
      console.error('Error getting project metadata:', error);
      return null;
    }
  }

  /**
   * Save/update project metadata
   */
  static async saveProjectMetadata(metadata: ProjectMetadata): Promise<void> {
    try {
      const allMetadata = await this.getAllMetadata();
      const index = allMetadata.findIndex(m => m.path === metadata.path);

      if (index >= 0) {
        allMetadata[index] = {
          ...allMetadata[index],
          ...metadata,
          updatedAt: Date.now(),
        };
      } else {
        allMetadata.push({
          ...metadata,
          createdAt: metadata.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
      }

      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(allMetadata));
    } catch (error) {
      console.error('Error saving project metadata:', error);
      throw error;
    }
  }

  /**
   * Save deployment info for a project
   */
  static async saveDeployment(
    projectPath: string,
    deployment: ProjectDeployment
  ): Promise<void> {
    try {
      const metadata = await this.getProjectMetadata(projectPath);

      if (metadata) {
        metadata.deployment = deployment;
        metadata.updatedAt = Date.now();
        await this.saveProjectMetadata(metadata);
      } else {
        // Create new metadata with deployment
        const projectName = projectPath.split('/').pop() || 'Unknown';
        await this.saveProjectMetadata({
          name: projectName,
          path: projectPath,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          deployment,
        });
      }

      console.log(`✅ Saved deployment for ${projectPath}:`, deployment.url);
    } catch (error) {
      console.error('Error saving deployment:', error);
      throw error;
    }
  }

  /**
   * Get deployment info for a project
   */
  static async getDeployment(projectPath: string): Promise<ProjectDeployment | null> {
    try {
      const metadata = await this.getProjectMetadata(projectPath);
      return metadata?.deployment || null;
    } catch (error) {
      console.error('Error getting deployment:', error);
      return null;
    }
  }

  /**
   * Update deployment status
   */
  static async updateDeploymentStatus(
    projectPath: string,
    status: ProjectDeployment['status']
  ): Promise<void> {
    try {
      const metadata = await this.getProjectMetadata(projectPath);

      if (metadata?.deployment) {
        metadata.deployment.status = status;
        metadata.deployment.lastChecked = Date.now();
        await this.saveProjectMetadata(metadata);
      }
    } catch (error) {
      console.error('Error updating deployment status:', error);
    }
  }

  /**
   * Get all project metadata
   */
  static async getAllMetadata(): Promise<ProjectMetadata[]> {
    try {
      const data = await AsyncStorage.getItem(METADATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting all metadata:', error);
      return [];
    }
  }

  /**
   * Delete project metadata
   */
  static async deleteProjectMetadata(projectPath: string): Promise<void> {
    try {
      const allMetadata = await this.getAllMetadata();
      const filtered = allMetadata.filter(m => m.path !== projectPath);
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting project metadata:', error);
      throw error;
    }
  }

  /**
   * Clear all metadata (for debugging)
   */
  static async clearAllMetadata(): Promise<void> {
    try {
      await AsyncStorage.removeItem(METADATA_KEY);
      console.log('✅ Cleared all project metadata');
    } catch (error) {
      console.error('Error clearing metadata:', error);
      throw error;
    }
  }
}
