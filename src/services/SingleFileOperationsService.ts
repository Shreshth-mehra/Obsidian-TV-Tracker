/**
 * Service for handling single-file operations
 * Provides methods for updating individual movie/TV show files
 */

import { App, Notice, requestUrl, TFile } from 'obsidian';
import { FileService } from './FileService';
import { TMDBService } from './TMDBService';
import { YAMLService } from './YAMLService';
import { TVTrackerSettings } from '../types/PluginTypes';

export class SingleFileOperationsService {
	private app: App;
	private fileService: FileService;
	private tmdbService: TMDBService;
	private yamlService: YAMLService;
	private settings: TVTrackerSettings;

	constructor(app: App, fileService: FileService, tmdbService: TMDBService, yamlService: YAMLService, settings: TVTrackerSettings) {
		this.app = app;
		this.fileService = fileService;
		this.tmdbService = tmdbService;
		this.yamlService = yamlService;
		this.settings = settings;
	}

	/**
	 * Update episode tracking for a single file
	 */
	async updateEpisodeTracking(file: TFile): Promise<void> {
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			new Notice('No YAML front matter found in file.');
			return;
		}

		const type = yaml.Type;
		const tmdbId = yaml["TMDB ID"];

		if (type !== 'Series' || !tmdbId) {
			new Notice('File is not a Series or missing TMDB ID.');
			return;
		}

		try {
			const seriesDetails = await this.tmdbService.getSeriesDetails(tmdbId);
			
			const totalEpisodes = seriesDetails.number_of_episodes;
			const totalSeasons = seriesDetails.number_of_seasons;
			let episode_runtime = seriesDetails.episode_run_time && seriesDetails.episode_run_time.length > 0 
				? seriesDetails.episode_run_time[0] 
				: null;

			if (!episode_runtime && seriesDetails.last_episode_to_air) {
				episode_runtime = seriesDetails.last_episode_to_air.runtime;
			}

			let updatedYaml = {};

			if (!('episodes_seen' in yaml)) {
				updatedYaml = {
					...yaml,
					total_episodes: totalEpisodes,
					total_seasons: totalSeasons,
					episode_runtime: episode_runtime,
					episodes_seen: 0
				};
			} else {
				updatedYaml = {
					...yaml,
					total_episodes: totalEpisodes,
					total_seasons: totalSeasons,
					episode_runtime: episode_runtime
				};
			}

			await this.fileService.updateFileYAML(file, updatedYaml as any);
			new Notice('Episode tracking data updated successfully.');
		} catch (error) {
			console.error('Error updating episode tracking:', error);
			new Notice('Error fetching data from TMDB.');
		}
	}

	/**
	 * Update streaming availability for a single file
	 */
	async updateStreamingAvailability(file: TFile): Promise<void> {
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			new Notice('No YAML front matter found in file.');
			return;
		}

		const tmdbId = yaml["TMDB ID"];
		const type = yaml.Type;

		if (!tmdbId) {
			new Notice('TMDB ID not found in file.');
			return;
		}

		try {
			const watchProviders = await this.tmdbService.getWatchProviders(
				tmdbId, 
				type === 'Movie' ? 'movie' : 'tv'
			);

			const providers = watchProviders.results[this.settings.countryAvailableOn]?.flatrate || [];
			const providerNames = providers.map(provider => provider.provider_name).join(', ');

			const updatedYaml = {
				...yaml,
				"Available On": providerNames || ''
			};

			await this.fileService.updateFileYAML(file, updatedYaml as any);
			new Notice('Streaming availability updated successfully.');
		} catch (error) {
			console.error('Error updating streaming availability:', error);
			new Notice('Error fetching data from TMDB.');
		}
	}

	/**
	 * Update properties for a single file
	 */
	async updateProperties(file: TFile): Promise<void> {
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			new Notice('No YAML front matter found in file.');
			return;
		}

		const type = yaml.Type;
		const tmdbId = yaml["TMDB ID"];

		if (!type || !tmdbId) {
			new Notice('Type or TMDB ID not found in file.');
			return;
		}

		try {
			const fullDetails = await this.tmdbService.getFullDetails(
				tmdbId, 
				type === 'Movie' ? 'movie' : 'tv'
			);

			const data = fullDetails.details;
			const originalLanguage = data.original_language;
			const overview = data.overview;

			let productionCompanies = '';
			if (data.production_companies && data.production_companies.length > 0) {
				productionCompanies = data.production_companies.slice(0, 2).map(company => company.name).join(', ');
			}

			let trailer = '';
			if (data.videos && data.videos.results.length > 0) {
				const trailerData = data.videos.results.find(video => video.type === 'Trailer');
				if (trailerData) {
					trailer = `https://www.youtube.com/watch?v=${trailerData.key}`;
				}
			}

			let budget = null;
			let revenue = null;
			let belongsToCollection = null;
			let releaseDate = null;

			if (type === 'Movie') {
				const movieData = data as any; // Cast to access movie-specific properties
				budget = movieData.budget;
				revenue = movieData.revenue;
				belongsToCollection = movieData.belongs_to_collection ? movieData.belongs_to_collection.name : null;
				releaseDate = movieData.release_date;
			}

			// Ensure title is properly quoted
			if (yaml.Title) {
				const title = yaml.Title;
				if (!title.startsWith('"') || !title.endsWith('"')) {
					yaml.Title = `"${title}"`;
				}
			}

			let updatedYaml = {};
			if (releaseDate) {
				updatedYaml = {
					...yaml,
					original_language: `"${originalLanguage}"`,
					overview: `"${YAMLService.escapeYAMLString(overview)}"`,
					trailer: `"${trailer}"`,
					budget: budget,
					revenue: revenue,
					belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
					production_company: `"${productionCompanies}"`,
					release_date: `"${releaseDate}"`,
				};
			} else {
				updatedYaml = {
					...yaml,
					original_language: `"${originalLanguage}"`,
					overview: `"${YAMLService.escapeYAMLString(overview)}"`,
					trailer: `"${trailer}"`,
					budget: budget,
					revenue: revenue,
					belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
					production_company: `"${productionCompanies}"`,
				};
			}

			await this.fileService.updateFileYAML(file, updatedYaml as any);
			new Notice('File updated with new data successfully.');
		} catch (error) {
			console.error('Error updating properties:', error);
			new Notice('Error fetching data from TMDB.');
		}
	}

	/**
	 * Add episode list to a series file
	 */
	async addEpisodeList(file: TFile): Promise<void> {
		console.log("Starting episode list update...");
		
		const fileContent = await this.app.vault.read(file);
		const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
		
		if (!frontmatter || frontmatter.Type !== 'Series') {
			new Notice('The active file is not a Series.');
			return;
		}

		if (!frontmatter["TMDB ID"]) {
			new Notice('TMDB ID is missing in the frontmatter.');
			return;
		}

		const tmdbId = frontmatter["TMDB ID"];

		try {
			const seriesDetails = await this.tmdbService.getSeriesDetails(tmdbId);
			// Get seasons data from a separate API call
			const seasonsResponse = await requestUrl({
				url: `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${this.settings.apiKey}`
			});
			const seasonsData = seasonsResponse.json;
			const seasons = seasonsData.seasons || [];
			console.log(`Found ${seasons.length} seasons total from TMDB`);

			// Parse existing content to find existing seasons and their episodes
			const existingContent = new Map<number, string>();
			let currentSeasonContent = '';
			let currentSeasonNum: number | null = null;
			
			// Split content into lines for more precise parsing
			const lines = fileContent.split('\n');
			for (const line of lines) {
				const seasonMatch = line.match(/^## Season (\d+)/);
				if (seasonMatch) {
					// If we were processing a season, save it
					if (currentSeasonNum !== null) {
						existingContent.set(currentSeasonNum, currentSeasonContent);
					}
					currentSeasonNum = parseInt(seasonMatch[1]);
					currentSeasonContent = line + '\n';
					console.log(`Found existing season ${currentSeasonNum}`);
				} else if (currentSeasonNum !== null) {
					currentSeasonContent += line + '\n';
				}
			}
			// Save the last season if exists
			if (currentSeasonNum !== null) {
				existingContent.set(currentSeasonNum, currentSeasonContent);
			}

			let newContent = fileContent;
			let hasNewContent = false;

			// Add episodes heading if it doesn't exist
			if (!newContent.includes('# Episodes')) {
				newContent = newContent + '\n# Episodes\n';
			}

			for (const season of seasons) {
				if (season.season_number > 0) {
					console.log(`Processing season ${season.season_number}`);
					const seasonDetails = await this.tmdbService.getSeasonDetails(tmdbId, season.season_number);
					
					// Get existing episode numbers for this season
					const existingEpisodes = new Set<number>();
					const existingSeasonContent = existingContent.get(season.season_number) || '';
					const episodeMatches = existingSeasonContent.matchAll(/Episode (\d+):/g);
					for (const match of episodeMatches) {
						existingEpisodes.add(parseInt(match[1]));
					}
					
					console.log(`Season ${season.season_number} has ${existingEpisodes.size} existing episodes`);
					console.log(`TMDB shows ${seasonDetails.episodes.length} total episodes`);

					let seasonContent = '';
					let hasNewEpisodesInSeason = false;

					for (const episode of seasonDetails.episodes) {
						if (!existingEpisodes.has(episode.episode_number)) {
							console.log(`Found new episode ${episode.episode_number} in season ${season.season_number}`);
							hasNewEpisodesInSeason = true;
							seasonContent += `- [ ] Episode ${episode.episode_number}: ${episode.name}\n`;
						}
					}

					if (hasNewEpisodesInSeason) {
						hasNewContent = true;
						if (existingContent.has(season.season_number)) {
							// Find the end of the existing season section
							const seasonHeaderRegex = new RegExp(`## Season ${season.season_number}[^#]*`);
							const seasonMatch = newContent.match(seasonHeaderRegex);
							if (seasonMatch && seasonMatch.index !== undefined && seasonMatch[0] !== undefined) {
								const insertPosition = seasonMatch.index + seasonMatch[0].length;
								newContent = newContent.slice(0, insertPosition) + seasonContent + newContent.slice(insertPosition);
								console.log(`Added ${seasonContent.split('\n').length - 1} new episodes to existing season ${season.season_number}`);
							}
						} else {
							// Add new season at the end
							newContent += `\n## Season ${season.season_number}\n${seasonContent}`;
							console.log(`Added new season ${season.season_number} with ${seasonContent.split('\n').length - 1} episodes`);
						}
					}
				}
			}

			if (hasNewContent && newContent !== fileContent) {
				await this.app.vault.modify(file, newContent);
				new Notice('New episodes added successfully.');
				console.log('File updated with new episodes');
			} else {
				new Notice('No new episodes found to add.');
				console.log('No new episodes found to add');
			}
		} catch (error) {
			console.error('Error fetching episode data:', error);
			new Notice('Error fetching episode data.');
		}
	}
}
