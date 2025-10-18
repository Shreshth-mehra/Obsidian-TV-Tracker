/**
 * Operation to update streaming availability information
 * Fetches watch providers from TMDB for a specific country
 */

import { TFile } from 'obsidian';
import { BulkOperationBase, OperationConfig } from './BulkOperationBase';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';

export class UpdateStreamingInfoOperation extends BulkOperationBase {
	private countryCode: string;

	constructor(
		fileService: FileService, 
		tmdbService: TMDBService, 
		countryCode: string = 'US'
	) {
		const config: OperationConfig = {
			noticeTitle: 'Updating Streaming Availability',
			successMessage: 'Streaming availability updated successfully',
			errorMessage: 'Streaming availability completed with errors'
		};
		
		super(fileService, tmdbService, config);
		this.countryCode = countryCode;
	}

	/**
	 * Process a single file
	 */
	protected async processFile(file: TFile): Promise<void> {
		const frontmatter = await this.getFileFrontmatter(file);
		
		if (this.shouldSkipFile(frontmatter)) {
			throw new Error('Missing required fields');
		}

		const tmdbId = frontmatter['TMDB ID'];
		const type = frontmatter.Type === 'Movie' ? 'movie' : 'tv';

		// Fetch watch providers from TMDB
		const providers = await this.tmdbService.getWatchProviders(tmdbId, type);

		// Extract provider names for the specified country
		const providerNames = TMDBService.extractProviderNames(providers, this.countryCode);

		// Update YAML
		const updatedYaml = {
			...frontmatter,
			'Available On': providerNames
		};

		await this.updateFileYAML(file, updatedYaml);
	}

	/**
	 * Set the country code for provider lookups
	 */
	setCountryCode(countryCode: string): void {
		this.countryCode = countryCode;
	}
}

