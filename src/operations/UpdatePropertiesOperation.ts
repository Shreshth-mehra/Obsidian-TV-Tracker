/**
 * Operation to update movie/series properties with new data from TMDB
 * Updates: original_language, overview, trailer, budget, revenue, 
 * belongs_to_collection, production_company, release_date
 */

import { TFile } from 'obsidian';
import { BulkOperationBase, OperationConfig } from './BulkOperationBase';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';

export class UpdatePropertiesOperation extends BulkOperationBase {
	constructor(fileService: FileService, tmdbService: TMDBService) {
		const config: OperationConfig = {
			noticeTitle: 'Updating Properties',
			successMessage: 'Properties updated successfully',
			errorMessage: 'Properties update completed with errors'
		};
		
		super(fileService, tmdbService, config);
	}

	/**
	 * Process a single file
	 */
	protected async processFile(file: TFile): Promise<void> {
		const frontmatter = await this.getFileFrontmatter(file);
		
		if (this.shouldSkipFile(frontmatter)) {
			throw new Error('Missing required fields');
		}

		const type = frontmatter.Type;
		const tmdbId = frontmatter['TMDB ID'];
		const endpoint = type === 'Movie' ? 'movie' : 'tv';

		// Fetch details from TMDB
		const details = await (type === 'Movie' 
			? this.tmdbService.getMovieDetails(tmdbId, ['videos'])
			: this.tmdbService.getSeriesDetails(tmdbId, ['videos']));

		// Extract common properties
		const originalLanguage = details.original_language;
		const overview = details.overview;
		const trailer = TMDBService.extractTrailerUrl(details);
		const productionCompanies = TMDBService.extractProductionCompanies(details, 2);

		// Build updated YAML
		const updatedYaml: any = {
			...frontmatter,
			original_language: originalLanguage,
			overview: overview,
			trailer: trailer,
			production_company: productionCompanies
		};

		// Add movie-specific properties
		if (type === 'Movie' && 'budget' in details) {
			updatedYaml.budget = details.budget || 0;
			updatedYaml.revenue = details.revenue || 0;
			updatedYaml.belongs_to_collection = details.belongs_to_collection?.name || '';
			updatedYaml.release_date = details.release_date || '';
		}

		// Ensure Title is properly quoted
		if (updatedYaml.Title) {
			updatedYaml.Title = this.yamlService.ensureQuotedTitle(updatedYaml.Title);
		}

		await this.updateFileYAML(file, updatedYaml);
	}
}

