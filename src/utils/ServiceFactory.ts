/**
 * Factory class to create and manage service instances
 * This ensures services are properly initialized and can be easily accessed
 */

import { App } from 'obsidian';
import { TMDBService } from '../services/TMDBService';
import { FileService } from '../services/FileService';
import { YAMLService } from '../services/YAMLService';
import { TVTrackerSettings } from '../types/PluginTypes';

export class ServiceFactory {
	private static tmdbService: TMDBService | null = null;
	private static fileService: FileService | null = null;

	/**
	 * Initialize TMDB Service
	 */
	static initTMDBService(apiKey: string): TMDBService {
		if (!this.tmdbService || this.tmdbService['apiKey'] !== apiKey) {
			this.tmdbService = new TMDBService(apiKey);
		}
		return this.tmdbService;
	}

	/**
	 * Get TMDB Service instance
	 */
	static getTMDBService(): TMDBService {
		if (!this.tmdbService) {
			throw new Error('TMDB Service not initialized. Call initTMDBService first.');
		}
		return this.tmdbService;
	}

	/**
	 * Initialize File Service
	 */
	static initFileService(app: App, movieFolderPath: string): FileService {
		if (!this.fileService) {
			this.fileService = new FileService(app, movieFolderPath);
		} else {
			this.fileService.setMovieFolderPath(movieFolderPath);
		}
		return this.fileService;
	}

	/**
	 * Get File Service instance
	 */
	static getFileService(): FileService {
		if (!this.fileService) {
			throw new Error('File Service not initialized. Call initFileService first.');
		}
		return this.fileService;
	}

	/**
	 * Get YAML Service (stateless, no initialization needed)
	 */
	static getYAMLService(): typeof YAMLService {
		return YAMLService;
	}

	/**
	 * Initialize all services at once
	 */
	static initializeAll(app: App, settings: TVTrackerSettings): void {
		this.initTMDBService(settings.apiKey);
		this.initFileService(app, settings.movieFolderPath);
	}

	/**
	 * Update services when settings change
	 */
	static updateSettings(settings: Partial<TVTrackerSettings>): void {
		if (settings.apiKey && this.tmdbService) {
			this.tmdbService.setApiKey(settings.apiKey);
		}
		if (settings.movieFolderPath && this.fileService) {
			this.fileService.setMovieFolderPath(settings.movieFolderPath);
		}
	}

	/**
	 * Reset all services (useful for testing)
	 */
	static reset(): void {
		this.tmdbService = null;
		this.fileService = null;
	}
}

