/**
 * Abstract base class for bulk file operations
 * Provides common functionality for progress tracking, error handling, and execution
 */

import { TFile, Notice } from 'obsidian';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';
import { YAMLService } from '../services/YAMLService';

export interface OperationResult {
	success: boolean;
	successCount: number;
	errorCount: number;
	totalFiles: number;
	errors: Array<{
		file: string;
		error: string;
	}>;
	skippedCount?: number;
}

export interface OperationConfig {
	showProgress?: boolean;
	noticeTitle?: string;
	successMessage?: string;
	errorMessage?: string;
}

export abstract class BulkOperationBase {
	protected fileService: FileService;
	protected tmdbService: TMDBService;
	protected yamlService: typeof YAMLService;
	protected notice: Notice | null = null;
	protected config: OperationConfig;

	constructor(
		fileService: FileService,
		tmdbService: TMDBService,
		config: Partial<OperationConfig> = {}
	) {
		this.fileService = fileService;
		this.tmdbService = tmdbService;
		this.yamlService = YAMLService;
		
		// Default configuration
		this.config = {
			showProgress: true,
			noticeTitle: 'Processing files',
			successMessage: 'Operation completed successfully',
			errorMessage: 'Operation completed with errors',
			...config
		};
	}

	/**
	 * Abstract method to be implemented by subclasses
	 * Process a single file
	 */
	protected abstract processFile(file: TFile): Promise<void>;

	/**
	 * Filter files before processing
	 * Override this to filter specific files
	 */
	protected async filterFiles(files: TFile[]): Promise<TFile[]> {
		return files;
	}

	/**
	 * Called before processing starts
	 * Override for setup logic
	 */
	protected async beforeOperation(): Promise<void> {
		// Override in subclasses if needed
	}

	/**
	 * Called after processing completes
	 * Override for cleanup logic
	 */
	protected async afterOperation(result: OperationResult): Promise<void> {
		// Override in subclasses if needed
	}

	/**
	 * Update progress notice
	 */
	protected updateProgress(current: number, total: number, success: number, errors: number): void {
		if (!this.config.showProgress || !this.notice) return;
		
		const message = `${this.config.noticeTitle}:\n` +
			`Processed: ${current}/${total}\n` +
			`Success: ${success}, Errors: ${errors}`;
		
		this.notice.setMessage(message);
	}

	/**
	 * Execute the bulk operation
	 */
	async execute(): Promise<OperationResult> {
		let successCount = 0;
		let errorCount = 0;
		let skippedCount = 0;
		const errors: Array<{ file: string; error: string }> = [];

		try {
			// Get all movie files
			const allFiles = await this.fileService.getAllMovieFiles();
			
			// Filter files
			const files = await this.filterFiles(allFiles);
			const totalFiles = files.length;

			if (totalFiles === 0) {
				return {
					success: true,
					successCount: 0,
					errorCount: 0,
					totalFiles: 0,
					errors: [],
					skippedCount: 0
				};
			}

			// Show initial progress notice
			if (this.config.showProgress) {
				this.notice = new Notice(
					`${this.config.noticeTitle}:\nProcessed: 0/${totalFiles}\nSuccess: 0, Errors: 0`,
					0
				);
			}

			// Call before hook
			await this.beforeOperation();

			// Process each file
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				
				try {
					await this.processFile(file);
					successCount++;
				} catch (error) {
					errorCount++;
					const errorMessage = error instanceof Error ? error.message : String(error);
					errors.push({
						file: file.path,
						error: errorMessage
					});
					console.error(`Error processing file ${file.path}:`, error);
				}

				// Update progress
				this.updateProgress(i + 1, totalFiles, successCount, errorCount);
			}

			// Create result
			const result: OperationResult = {
				success: errorCount === 0,
				successCount,
				errorCount,
				totalFiles,
				errors,
				skippedCount
			};

			// Call after hook
			await this.afterOperation(result);

			// Show final notice
			this.showFinalNotice(result);

			return result;

		} catch (error) {
			console.error('Bulk operation failed:', error);
			
			const result: OperationResult = {
				success: false,
				successCount,
				errorCount: errorCount + 1,
				totalFiles: 0,
				errors: [{
					file: 'Operation',
					error: error instanceof Error ? error.message : String(error)
				}],
				skippedCount
			};

			this.showFinalNotice(result);
			return result;
		} finally {
			// Hide progress notice
			if (this.notice) {
				setTimeout(() => this.notice?.hide(), 3000);
			}
		}
	}

	/**
	 * Show final completion notice
	 */
	protected showFinalNotice(result: OperationResult): void {
		if (!this.notice) {
			this.notice = new Notice('', 5000);
		}

		const message = result.success 
			? `${this.config.successMessage}\n` +
			  `Files processed: ${result.totalFiles}\n` +
			  `Success: ${result.successCount}`
			: `${this.config.errorMessage}\n` +
			  `Files processed: ${result.totalFiles}\n` +
			  `Success: ${result.successCount}, Errors: ${result.errorCount}`;

		this.notice.setMessage(message);
	}

	/**
	 * Get frontmatter from file with error handling
	 */
	protected async getFileFrontmatter(file: TFile): Promise<any> {
		const frontmatter = this.fileService.getFileFrontmatter(file);
		
		if (!frontmatter) {
			throw new Error('No YAML frontmatter found in file');
		}
		
		return frontmatter;
	}

	/**
	 * Check if file should be skipped
	 */
	protected shouldSkipFile(frontmatter: any, type?: 'Movie' | 'Series'): boolean {
		// Must have TMDB ID
		if (!frontmatter['TMDB ID']) {
			return true;
		}

		// Check type if specified
		if (type && frontmatter.Type !== type) {
			return true;
		}

		return false;
	}

	/**
	 * Safe update of file YAML
	 */
	protected async updateFileYAML(file: TFile, yaml: any): Promise<void> {
		try {
			await this.fileService.updateFileYAML(file, yaml);
		} catch (error) {
			throw new Error(`Failed to update file: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
}

