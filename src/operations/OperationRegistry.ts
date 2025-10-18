/**
 * Registry for managing and executing bulk operations
 * Provides a centralized interface for all bulk file operations
 */

import { App } from 'obsidian';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';
import { BulkOperationBase, OperationResult } from './BulkOperationBase';
import { UpdateEpisodeTrackingOperation } from './UpdateEpisodeTrackingOperation';
import { UpdateStreamingInfoOperation } from './UpdateStreamingInfoOperation';
import { UpdatePropertiesOperation } from './UpdatePropertiesOperation';
import { UpdateTrailerLinksOperation } from './UpdateTrailerLinksOperation';

export type OperationType = 
	| 'updateEpisodeTracking'
	| 'updateStreamingInfo'
	| 'updateProperties'
	| 'addTrailerLinks'
	| 'removeTrailerLinks';

export interface OperationOptions {
	countryCode?: string;
	addLinks?: boolean;
}

export class OperationRegistry {
	private fileService: FileService;
	private tmdbService: TMDBService;
	private operations: Map<OperationType, BulkOperationBase>;

	constructor(fileService: FileService, tmdbService: TMDBService) {
		this.fileService = fileService;
		this.tmdbService = tmdbService;
		this.operations = new Map();
		this.initializeOperations();
	}

	/**
	 * Initialize all available operations
	 */
	private initializeOperations(): void {
		// These will be created on-demand to allow for configuration
	}

	/**
	 * Get or create an operation instance
	 */
	private getOperation(type: OperationType, options?: OperationOptions): BulkOperationBase {
		switch (type) {
			case 'updateEpisodeTracking':
				return new UpdateEpisodeTrackingOperation(this.fileService, this.tmdbService);
			
			case 'updateStreamingInfo':
				return new UpdateStreamingInfoOperation(
					this.fileService, 
					this.tmdbService,
					options?.countryCode || 'US'
				);
			
			case 'updateProperties':
				return new UpdatePropertiesOperation(this.fileService, this.tmdbService);
			
			case 'addTrailerLinks':
				return new UpdateTrailerLinksOperation(this.fileService, this.tmdbService, true);
			
			case 'removeTrailerLinks':
				return new UpdateTrailerLinksOperation(this.fileService, this.tmdbService, false);
			
			default:
				throw new Error(`Unknown operation type: ${type}`);
		}
	}

	/**
	 * Execute a bulk operation by type
	 */
	async execute(type: OperationType, options?: OperationOptions): Promise<OperationResult> {
		const operation = this.getOperation(type, options);
		return await operation.execute();
	}

	/**
	 * Execute multiple operations in sequence
	 */
	async executeMultiple(
		operations: Array<{ type: OperationType; options?: OperationOptions }>
	): Promise<OperationResult[]> {
		const results: OperationResult[] = [];
		
		for (const { type, options } of operations) {
			const result = await this.execute(type, options);
			results.push(result);
		}
		
		return results;
	}

	/**
	 * Update episode tracking for all series
	 */
	async updateEpisodeTracking(): Promise<OperationResult> {
		return this.execute('updateEpisodeTracking');
	}

	/**
	 * Update streaming availability for all files
	 */
	async updateStreamingInfo(countryCode: string = 'US'): Promise<OperationResult> {
		return this.execute('updateStreamingInfo', { countryCode });
	}

	/**
	 * Update properties for all files
	 */
	async updateProperties(): Promise<OperationResult> {
		return this.execute('updateProperties');
	}

	/**
	 * Add trailer and poster links to all files
	 */
	async addTrailerLinks(): Promise<OperationResult> {
		return this.execute('addTrailerLinks');
	}

	/**
	 * Remove trailer and poster links from all files
	 */
	async removeTrailerLinks(): Promise<OperationResult> {
		return this.execute('removeTrailerLinks');
	}

	/**
	 * Get available operation types
	 */
	getAvailableOperations(): OperationType[] {
		return [
			'updateEpisodeTracking',
			'updateStreamingInfo',
			'updateProperties',
			'addTrailerLinks',
			'removeTrailerLinks'
		];
	}

	/**
	 * Get description for an operation type
	 */
	getOperationDescription(type: OperationType): string {
		const descriptions: Record<OperationType, string> = {
			updateEpisodeTracking: 'Update episode count and runtime for TV series',
			updateStreamingInfo: 'Update streaming availability from TMDB',
			updateProperties: 'Update properties (overview, trailer, language, etc.)',
			addTrailerLinks: 'Add trailer and poster links to files',
			removeTrailerLinks: 'Remove trailer and poster links from files'
		};
		
		return descriptions[type] || 'Unknown operation';
	}
}

/**
 * Factory function to create an OperationRegistry with services
 */
export function createOperationRegistry(
	fileService: FileService,
	tmdbService: TMDBService
): OperationRegistry {
	return new OperationRegistry(fileService, tmdbService);
}

