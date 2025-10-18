/**
 * Operation to update episode tracking data for TV series
 * Fetches total episodes, seasons, and episode runtime from TMDB
 */

import { TFile } from 'obsidian';
import { BulkOperationBase, OperationConfig } from './BulkOperationBase';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';

export class UpdateEpisodeTrackingOperation extends BulkOperationBase {
	constructor(fileService: FileService, tmdbService: TMDBService) {
		const config: OperationConfig = {
			noticeTitle: 'Updating Episode Tracking',
			successMessage: 'Episode tracking updated successfully',
			errorMessage: 'Episode tracking completed with errors'
		};
		
		super(fileService, tmdbService, config);
	}

	/**
	 * Filter only TV series files
	 */
	protected async filterFiles(files: TFile[]): Promise<TFile[]> {
		const seriesFiles: TFile[] = [];
		
		for (const file of files) {
			try {
				const frontmatter = this.fileService.getFileFrontmatter(file);
				
				if (frontmatter?.Type === 'Series' && frontmatter['TMDB ID']) {
					seriesFiles.push(file);
				}
			} catch (error) {
				console.error(`Error filtering file ${file.path}:`, error);
			}
		}
		
		return seriesFiles;
	}

	/**
	 * Process a single series file
	 */
	protected async processFile(file: TFile): Promise<void> {
		const frontmatter = await this.getFileFrontmatter(file);
		const tmdbId = frontmatter['TMDB ID'];

		if (!tmdbId) {
			throw new Error('Missing TMDB ID');
		}

		// Fetch series details from TMDB
		const details = await this.tmdbService.getSeriesDetails(tmdbId, ['last_episode_to_air']);

		// Get episode runtime
		let episodeRuntime = null;
		if (details.episode_run_time && details.episode_run_time.length > 0) {
			episodeRuntime = details.episode_run_time[0];
		} else if (details.last_episode_to_air?.runtime) {
			episodeRuntime = details.last_episode_to_air.runtime;
		}

		// Build updated YAML
		const updatedYaml: any = {
			...frontmatter,
			total_episodes: details.number_of_episodes,
			total_seasons: details.number_of_seasons,
			episode_runtime: episodeRuntime
		};

		// Only add episodes_seen if it doesn't already exist
		if (!('episodes_seen' in frontmatter)) {
			updatedYaml.episodes_seen = 0;
		}

		// Update the file
		await this.updateFileYAML(file, updatedYaml);
	}
}

