import { App, Plugin, Notice, requestUrl, TFile, TFolder } from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';
import { TVTrackerSettingsTab } from './src/modals/SettingsTab';
import { SearchModal } from './src/modals/SearchModal';
import { Commands } from './src/commands/Commands';


interface TVTrackerSettings {
	
	movieFolderPath: string;
	numberOfColumns: number;           
    numberOfResults: number;            
    toggleFittedImages: boolean;  
	hideLegend: boolean;
	hideMetrics: boolean;
	hideBudgetMetrics: boolean;
	hideGenreTasteIndexMetrics: boolean;           
    imageFolderPath: string;   
	apiKey: string;
	topGenresNumber: number;
	topActorsNumber: number;
	topDirectorsNumber: number;
	topYearsNumber: number;
	topProductionCompaniesNumber: number;
	topCollectionsNumber :number;
	showTrailerAndPosterLinks: boolean;
	topPerformersNumber:number;
	minMoviesForMetrics: number;
	minMoviesForMetricsDirectors: number;
	minMoviesForMetricsCollections: number;
	minMoviesForMetricsYears: number;
	movieMetricsHeadingColor: string;
    movieMetricsSubheadingColor: string;
	budgetMetricsSubheadingColor: string;
    movieCardColor: string;
	metricsHeading: string;
	defaultLanguageFilters: string;
	defaultPropertiesToShow: string;
	clickForInfo: boolean;
	showEPSeen: boolean;
	defaultSortingMode: string;
	maxMoviesFromCollection: number;
	themeMode: string;
	title: string;
	BlockBusterDefinition: number;
	countryAvailableOn: string;
}

const DEFAULT_TV_SETTINGS: TVTrackerSettings = {
	
	movieFolderPath: 'Movies',
	numberOfColumns: 6,               
    numberOfResults: 3,               
    toggleFittedImages: true,  
	hideLegend: false, 
	hideMetrics: false,  
	hideBudgetMetrics: false,
	hideGenreTasteIndexMetrics: false,      
    imageFolderPath: 'Movies/Images',
	apiKey :'' ,
	topActorsNumber:5,
	topDirectorsNumber:5,
	topProductionCompaniesNumber:5,
	topGenresNumber:5,
	topCollectionsNumber:5,
	topPerformersNumber:5,
	topYearsNumber:5,
	minMoviesForMetrics:7,
	minMoviesForMetricsDirectors:5,
	minMoviesForMetricsCollections: 3,
	minMoviesForMetricsYears: 5,
	movieMetricsHeadingColor: 'lightblue', 
    movieMetricsSubheadingColor: 'orange', 
	budgetMetricsSubheadingColor: '#DB6FFC',
	movieCardColor: 'inherit',
	metricsHeading: 'For Number geeks',
	showTrailerAndPosterLinks: true,
	defaultLanguageFilters: '',
	defaultPropertiesToShow: '',
	clickForInfo: true,
	showEPSeen: true,
	defaultSortingMode: 'Rating',
	maxMoviesFromCollection: 3,
	themeMode: 'Light',
	title:'TV Tracker 🎬📽️',
	BlockBusterDefinition: 4.5,
	countryAvailableOn: 'US'
}

export default class TVTrackerPlugin extends Plugin {
	settings: TVTrackerSettings;
	systemThemeMode: string;
	activeViews: Set<TVTracker> = new Set();
	refreshTimeout: NodeJS.Timeout | null = null;
	fileWatcherRegistered = false;

	async onload() {
		await this.loadSettings();
		this.systemThemeMode = 'light'; // Default to light
		const rootElement = document.body; // or another root element of the app

		if (rootElement.classList.contains('theme-dark')) {
			this.systemThemeMode = 'dark';
		}

		this.registerView(VIEW_TV, (leaf) => {
			const view = new TVTracker(leaf, this, this.systemThemeMode);
			this.activeViews.add(view);
			return view;
		});

		this.addRibbonIcon('clapperboard','Open TV Tracker', ()=>  {
			this.activateView();
	
		});

		this.addSettingTab(new TVTrackerSettingsTab(this.app, this));
		
		// Register commands using the Commands class
		const commands = new Commands(this);
		commands.getCommands().forEach(command => {
			this.addCommand(command);
		});

		// Register for file changes in the movie folder
		this.registerFileWatcher();
	}
	onunload() {
		// Clean up the file watcher when the plugin is unloaded
		this.activeViews.clear();
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
		}
	}

	async openView() {
		// Create a new tab in the main editor for your view
		const leaf = this.app.workspace.getLeaf(true);
		const view = new TVTracker(leaf,this, this.systemThemeMode);
		leaf.setViewState({
			type: VIEW_TV,
			active: true,
		});

	}


	async activateView(){
	
		const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TV);
	
		if(existingLeaves.length === 0){
			// If there is no leaf of VIEW_TV type, create a new one
			await this.app.workspace.getLeaf(false).setViewState({
				type:VIEW_TV,
				active:true,
			});

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TV)[0]);
	} else {
        // If a leaf of VIEW_TV type already exists, simply reveal it without creating a new one
        this.app.workspace.revealLeaf(existingLeaves[0]);
    }
	}

	async removeTrailerAndPosterLinks() {
		const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
		if (!movieFolder || !(movieFolder as any).children) return;
	
		const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
		
	
		let iteration = 0;
		let successCount = 0;
		let errorCount = 0;
		const removeLinksNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);

		for (const file of files) {
			iteration += 1;
		
	
			const cache = this.app.metadataCache.getFileCache(file);
			const yaml = cache?.frontmatter;
	
	
			if (!yaml) {
				errorCount++;
				new Notice(`Error with reading YAML: ${file.path}`);
				continue;
			}
	
			const poster = yaml.Poster;
			const trailer = yaml.trailer;
			
	
			let fileContent = await this.app.vault.read(file);
	
			if (poster) {
				const posterLink = `![Poster](${poster})`;
				
				fileContent = fileContent.replace(`${posterLink}`, '\n');
			}
			if (trailer) {
				const trailerLink = `![Trailer](${trailer})`;
				fileContent = fileContent.replace(`${trailerLink}`, '\n');
			}
	
	
			try {
				await this.app.vault.modify(file, fileContent);
				successCount++;
			} catch (error) {
				console.error(`Failed to update file ${file.path}`, error);
				errorCount++;
			}
		
			removeLinksNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
	}

	removeLinksNotice.setMessage(`Processising complete. Files processed: ${iteration}, Success: ${successCount}, Errors: ${errorCount}`);;
	setTimeout(() => removeLinksNotice.hide(), 3000);
	}
	

	async addTrailerAndPoster() {
        const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
        if (!movieFolder || !(movieFolder as any).children) return;

        const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
     
        let iteration = 0;
        let successCount = 0;
        let errorCount = 0;
		const addLinksNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);

        for (const file of files) {
            iteration = iteration + 1;
          
           
            const cache = this.app.metadataCache.getFileCache(file);
            const yaml = cache?.frontmatter;

          
            if (!yaml) {
                errorCount++;
				new Notice(`Error with reading YAML: ${file.path}`);
				console.error(`Error with reading YAML: ${file.path}`);
                continue;
            }

            const poster = yaml.Poster;
            const trailer = yaml.trailer;
			
			let newContent = await this.app.vault.read(file);
			if (poster) {
				const posterLink = `![Poster](${poster})`;
				newContent = `${newContent}\n${posterLink}`;
			}
			if (trailer) {
				const trailerLink = `![Trailer](${trailer})`;
				newContent = `${newContent}\n${trailerLink}`;
			} else if (poster) {
				new Notice(`No trailer found for file: ${file.path}`);
				console.log(`No trailer found for file: ${file.path}`);
			}
		
			if (poster || trailer) {
				await this.app.vault.modify(file, newContent);
				successCount++;
				
			} 
			else {
				new Notice(`Error with reading Poster or Trailer: ${file.path}`);
				console.error(`Error with reading Poster or Trailer: ${file.path}`);
                errorCount++;
            }

			addLinksNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
        }

		addLinksNotice.setMessage(`Processising complete. Files processed: ${iteration}, Success: ${successCount}, Errors: ${errorCount}`);;
		setTimeout(() => addLinksNotice.hide(), 3000);
    }

	async updateNewProperties() {
		// Get all movie files
		const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
		if (!movieFolder || !(movieFolder as any).children) return;
	
		const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
		
		let iteration = 0;
		let successCount = 0;
		let errorCount = 0;
		const updateFilesNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);
		
		for (const file of files) {
			iteration = iteration + 1;
	
			const filePath = file.path;
	
			const cache = this.app.metadataCache.getFileCache(file);
			const yaml = cache?.frontmatter;
	
			if (!yaml) {
				errorCount++;
				continue;
			}
	
			const type = yaml.Type;
			const tmdbId = yaml["TMDB ID"];
	
			if (!type || !tmdbId) {
				errorCount++;
				continue;
			}
	
			const endpoint = type === 'Movie' ? `movie` : `tv`;
	
			// Fetch original language from TMDB API
			const response = await requestUrl({
				url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=videos`,
			});
	
			if (response.status !== 200) {
				errorCount++;
				continue;
			}
	
			const data = response.json;
	
			const originalLanguage = data.original_language;
			const overview = data.overview;
	
			let productionCompanies = '';
			if (data.production_companies && data.production_companies.length > 0) {
				productionCompanies = data.production_companies.slice(0, 2).map((company: any) => company.name).join(', ');
			}
	
			let trailer = '';
			if (data.videos && data.videos.results.length > 0) {
				const trailerData = data.videos.results.find((video: any) => video.type === 'Trailer');
				if (trailerData) {
					trailer = `https://www.youtube.com/watch?v=${trailerData.key}`;
				}
			}
	
			let budget = null;
			let revenue = null;
			let belongsToCollection = null;
			let releaseDate = null;
	
			if (type === 'Movie') {
				budget = data.budget;
				revenue = data.revenue;
				belongsToCollection = data.belongs_to_collection ? data.belongs_to_collection.name : null;
				releaseDate = data.release_date;
			}
	
			const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');
	
			if (yaml.Title) {
				const title = yaml.Title;
				if (!title.startsWith('"') || !title.endsWith('"')) {
					yaml.Title = `"${title}"`;
				} else {
					// Escape internal double quotes if the title is already quoted
					yaml.Title = `${title}`;
				}
			}
			let updatedYaml={}
			if(releaseDate){
				 updatedYaml = {
					...yaml,
					original_language: `"${originalLanguage}"`,
					overview: `"${escapeDoubleQuotes(overview)}"`,
					trailer: `"${trailer}"`,
					budget: budget,
					revenue: revenue,
					belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
					production_company: `"${productionCompanies}"`,
					release_date: `"${releaseDate}"`,
				};
			}
			else{
				updatedYaml = {
					...yaml,
					original_language: `"${originalLanguage}"`,
					overview: `"${escapeDoubleQuotes(overview)}"`,
					trailer: `"${trailer}"`,
					budget: budget,
					revenue: revenue,
					belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
					production_company: `"${productionCompanies}"`,
				};
			}
	
			
	
			// if (type === 'Movie') {
			// 	updatedYaml.release_date = 
			// }
	
			const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n')}\n---`;
	
			const fileContent = await this.app.vault.read(file);
	
			const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;
	
			if (yamlRegex.test(fileContent)) {
				const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
	
				// Save the updated content back to the file
				await this.app.vault.modify(file, updatedFileContent);
				successCount++;
			} else {
				console.error("YAML front matter not found in file:", file.path);
				errorCount++;
			}
	
			updateFilesNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
		}
	
		updateFilesNotice.setMessage(`Processing Complete. New properties added for ${successCount} files. ${errorCount} files encountered errors.`);
		setTimeout(() => updateFilesNotice.hide(), 3000);
	}
	
	async updateEPTracking() {
		// Get all series files
		const seriesFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
		if (!seriesFolder || !(seriesFolder as any).children) return;
	
		const files = (seriesFolder as any).children.filter((file: any) => file.extension === 'md');
		let iteration = 0;
		let successCount = 0;
		let errorCount = 0;
		const updateFilesNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);
		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');
		for (const file of files) {
			iteration++;
			const filePath = file.path;
			const cache = this.app.metadataCache.getFileCache(file);
			const yaml = cache?.frontmatter;
	
			if (!yaml) {
				errorCount++;
				console.error("YAML front matter not found in file:", file.path)
				continue;
			}
	
			const type = yaml.Type;
			const tmdbId = yaml["TMDB ID"];
	
			if (type !== 'Series' || !tmdbId) {
				continue;
			}

			
			const response = await requestUrl({
				url: `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=last_episode_to_air`,
				method: 'GET',
			});
	
			if (response.status !== 200) {
				errorCount++;
				console.error("Bad response from TMDB", file.path)
				continue;
			}
	
			const data = response.json;
			const totalEpisodes = data.number_of_episodes;
			const totalSeasons = data.number_of_seasons;
			let episode_runtime = data.episode_run_time && data.episode_run_time.length > 0 ? data.episode_run_time[0] : null;
	
			if (!episode_runtime && data.last_episode_to_air) {
				episode_runtime = data.last_episode_to_air.runtime;
			}
		
	
			let updatedYaml ={}
	
			// Only add episodes_seen if it doesn't already exist
			if (!('episodes_seen' in yaml)) {
				updatedYaml = {
					...yaml,
					total_episodes: totalEpisodes,
					total_seasons: totalSeasons,
					episode_runtime: episode_runtime,
					episodes_seen: 0
				};
			}
			else {
				 updatedYaml = {
					...yaml,
					total_episodes: totalEpisodes,
					total_seasons: totalSeasons,
					episode_runtime: episode_runtime
				};
			}
	
			const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
				const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
				return `${key}: ${escapedValue}`;
			}).join('\n')}\n---`;
	
			const fileContent = await this.app.vault.read(file);
	
			const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;
	
			if (yamlRegex.test(fileContent)) {
				const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
				await this.app.vault.modify(file, updatedFileContent);
				successCount++;
			} else {
				console.error("YAML front matter not found in file:", file.path);
				errorCount++;
			}
	
			updateFilesNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
		}
	
		updateFilesNotice.setMessage(`Processing Complete. New properties added for ${successCount} files. ${errorCount} files encountered errors.`);
		setTimeout(() => updateFilesNotice.hide(), 3000);
	}

	async updateAvailableOn() {
		const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
		if (!movieFolder || !(movieFolder as any).children) return;

		const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
		// Take only first 5 files
		//const filesToProcess = files.slice(0, 20);
		const filesToProcess = files;
		
		let successCount = 0;
		let errorCount = 0;
		const updateFilesNotice = new Notice(`Processed files: ${successCount}/${filesToProcess.length}\n Errors: ${errorCount}`, 0);
		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');

		for (const file of filesToProcess) {
			try {
				//console.log("Processing file:", file.path);
				const cache = this.app.metadataCache.getFileCache(file);
				const yaml = cache?.frontmatter;

				if (!yaml) {
					errorCount++;
					console.error("YAML front matter not found in file:", file.path);
					continue;
				}

				const tmdbId = yaml["TMDB ID"];
				const type = yaml.Type;

				if (!tmdbId) {
					console.log("Skipping file - no TMDB ID found:", file.path);
					continue;
				}

				const endpoint = type === 'Movie' ? 'movie' : 'tv';
				let response;
				try {
					response = await requestUrl({
						url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers?api_key=${this.settings.apiKey}`,
					});
				} catch (error) {
					console.error(`API call failed for file ${file.path}:`, error);
					errorCount++;
					continue;
				}
				
				if (response.status !== 200) {
					console.error(`Bad response from TMDB for file ${file.path}. Status: ${response.status}`);
					errorCount++;
					continue;
				}

				const data = response.json;
				const countryCode = this.settings.countryAvailableOn;
				const providers = data.results[countryCode]?.flatrate || [];

				const providerNames = providers.map((provider: any) => provider.provider_name).join(', ');
				
				let updatedYaml = {
					...yaml,
					"Available On": providerNames || ''
				};

				const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
					const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
					return `${key}: ${escapedValue}`;
				}).join('\n')}\n---`;

				const fileContent = await this.app.vault.read(file);
				const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

				if (yamlRegex.test(fileContent)) {
					const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
					await this.app.vault.modify(file, updatedFileContent);
					successCount++;
					console.log("Successfully updated file:", file.path);
				} else {
					console.error("YAML front matter not found in file:", file.path);
					errorCount++;
				}
			} catch (error) {
				console.error(`Error processing file ${file.path}:`, error);
				errorCount++;
			}

			updateFilesNotice.setMessage(`Processed files: ${successCount}/${filesToProcess.length}\n Errors: ${errorCount}`);
		}

		updateFilesNotice.setMessage(`Processing Complete. Streaming availability updated for ${successCount} files. ${errorCount} files encountered errors. Please see console for more details on the errors.`);
		setTimeout(() => updateFilesNotice.hide(), 3000);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_TV_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async addEpisodeListToCurrentFile(activeFile:TFile) {
		console.log("Starting episode list update...");
		
		const fileContent = await this.app.vault.read(activeFile);
		const frontmatter = this.app.metadataCache.getFileCache(activeFile)?.frontmatter;
		
		if (!frontmatter || frontmatter.Type !== 'Series') {
			new Notice('The active file is not a Series.');
			return;
		}

		if (!frontmatter["TMDB ID"]) {
			new Notice('TMDB ID is missing in the frontmatter.');
			return;
		}

		const tmdbId = frontmatter["TMDB ID"];
		const apiKey = this.settings.apiKey;
		const url = `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&append_to_response=episodes`;

		try {
			const response = await requestUrl({ url });
			const data = response.json;
			const seasons = data.seasons || [];
			console.log(`Found ${seasons.length} seasons total from TMDB`);

			// Parse existing content to find existing seasons and their episodes
			const existingContent = new Map(); // Map<season_number, Set<episode_number>>
			let currentSeasonContent = '';
			let currentSeasonNum = null;
			
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
					const seasonDetails = await requestUrl({
						url: `https://api.themoviedb.org/3/tv/${tmdbId}/season/${season.season_number}?api_key=${apiKey}`
					});
					const seasonData = seasonDetails.json;
					
					// Get existing episode numbers for this season
					const existingEpisodes = new Set();
					const existingSeasonContent = existingContent.get(season.season_number) || '';
					const episodeMatches = existingSeasonContent.matchAll(/Episode (\d+):/g);
					for (const match of episodeMatches) {
						existingEpisodes.add(parseInt(match[1]));
					}
					
					console.log(`Season ${season.season_number} has ${existingEpisodes.size} existing episodes`);
					console.log(`TMDB shows ${seasonData.episodes.length} total episodes`);

					let seasonContent = '';
					let hasNewEpisodesInSeason = false;

					for (const episode of seasonData.episodes) {
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
				await this.app.vault.modify(activeFile, newContent);
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

	// Method to register a view for updates
	registerViewForUpdates(view: TVTracker) {
		this.activeViews.add(view);
	}
	
	// Method to unregister a view
	unregisterView(view: TVTracker) {
		this.activeViews.delete(view);
	}
	
	// Method to refresh all active views
	async refreshAllViews() {
		// Debounce the refresh to avoid multiple rapid refreshes
		if (this.refreshTimeout) {
			clearTimeout(this.refreshTimeout);
		}
		
		this.refreshTimeout = setTimeout(async () => {
			console.log("Refreshing all views, active views count:", this.activeViews.size);
			for (const view of this.activeViews) {
				await view.refreshData();
			}
		}, 500); // 500ms debounce
	}
	
	// Register for file changes in the movie folder
	registerFileWatcher() {
		if (this.fileWatcherRegistered) return;
		
		// Register for file changes in the movie folder
		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				if (file instanceof TFile && 
					file.path.startsWith(this.settings.movieFolderPath) && 
					file.extension === 'md') {
					console.log("File modified:", file.path);
					await this.refreshAllViews();
				}
			})
		);
		
		// Register for file creation in the movie folder
		this.registerEvent(
			this.app.vault.on('create', async (file) => {
				if (file instanceof TFile && 
					file.path.startsWith(this.settings.movieFolderPath) && 
					file.extension === 'md') {
					console.log("File created:", file.path);
					await this.refreshAllViews();
				}
			})
		);
		
		// Register for file deletion in the movie folder
		this.registerEvent(
			this.app.vault.on('delete', async (file) => {
				if (file instanceof TFile && 
					file.path.startsWith(this.settings.movieFolderPath) && 
					file.extension === 'md') {
					console.log("File deleted:", file.path);
					await this.refreshAllViews();
				}
			})
		);
		
		this.fileWatcherRegistered = true;
	}
	
	// Method to get the current movie data
	async getMovieData(): Promise<any[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
		const moviesData = [];
		
		if (folder instanceof TFolder) {
			// Iterate through the children of the folder
			for (const file of folder.children) {
				// Ensure the file is a markdown file
				if (file instanceof TFile && file.extension === 'md') {
					const cache = this.app.metadataCache.getFileCache(file);
					if (cache?.frontmatter && cache.frontmatter["TMDB ID"]) {
						const movieInfo = {
							...cache.frontmatter,
							filePath: file.path
						};
						moviesData.push(movieInfo);
					}
				}
			}
		}
		
		return moviesData;
	}

	// Add new methods for single file updates
	async updateEPTrackingForFile(file: TFile) {
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

		const response = await requestUrl({
			url: `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=last_episode_to_air`,
			method: 'GET',
		});

		if (response.status !== 200) {
			new Notice('Error fetching data from TMDB.');
			return;
		}

		const data = response.json;
		const totalEpisodes = data.number_of_episodes;
		const totalSeasons = data.number_of_seasons;
		let episode_runtime = data.episode_run_time && data.episode_run_time.length > 0 ? data.episode_run_time[0] : null;

		if (!episode_runtime && data.last_episode_to_air) {
			episode_runtime = data.last_episode_to_air.runtime;
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

		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');
		const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
			const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
			return `${key}: ${escapedValue}`;
		}).join('\n')}\n---`;

		const fileContent = await this.app.vault.read(file);
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

		if (yamlRegex.test(fileContent)) {
			const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
			await this.app.vault.modify(file, updatedFileContent);
			new Notice('Episode tracking data updated successfully.');
		} else {
			new Notice('YAML front matter not found in file.');
		}
	}

	async updateAvailableOnForFile(file: TFile) {
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

		const endpoint = type === 'Movie' ? 'movie' : 'tv';
		const response = await requestUrl({
			url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers?api_key=${this.settings.apiKey}`,
		});

		if (response.status !== 200) {
			new Notice('Error fetching data from TMDB.');
			return;
		}

		const data = response.json;
		const countryCode = this.settings.countryAvailableOn;
		const providers = data.results[countryCode]?.flatrate || [];
		const providerNames = providers.map((provider: any) => provider.provider_name).join(', ');

		let updatedYaml = {
			...yaml,
			"Available On": providerNames || ''
		};

		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');
		const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
			const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
			return `${key}: ${escapedValue}`;
		}).join('\n')}\n---`;

		const fileContent = await this.app.vault.read(file);
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

		if (yamlRegex.test(fileContent)) {
			const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
			await this.app.vault.modify(file, updatedFileContent);
			new Notice('Streaming availability updated successfully.');
		} else {
			new Notice('YAML front matter not found in file.');
		}
	}

	async updateNewPropertiesForFile(file: TFile) {
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

		const endpoint = type === 'Movie' ? `movie` : `tv`;
		const response = await requestUrl({
			url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=videos`,
		});

		if (response.status !== 200) {
			new Notice('Error fetching data from TMDB.');
			return;
		}

		const data = response.json;
		const originalLanguage = data.original_language;
		const overview = data.overview;

		let productionCompanies = '';
		if (data.production_companies && data.production_companies.length > 0) {
			productionCompanies = data.production_companies.slice(0, 2).map((company: any) => company.name).join(', ');
		}

		let trailer = '';
		if (data.videos && data.videos.results.length > 0) {
			const trailerData = data.videos.results.find((video: any) => video.type === 'Trailer');
			if (trailerData) {
				trailer = `https://www.youtube.com/watch?v=${trailerData.key}`;
			}
		}

		let budget = null;
		let revenue = null;
		let belongsToCollection = null;
		let releaseDate = null;

		if (type === 'Movie') {
			budget = data.budget;
			revenue = data.revenue;
			belongsToCollection = data.belongs_to_collection ? data.belongs_to_collection.name : null;
			releaseDate = data.release_date;
		}

		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');

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
				overview: `"${escapeDoubleQuotes(overview)}"`,
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
				overview: `"${escapeDoubleQuotes(overview)}"`,
				trailer: `"${trailer}"`,
				budget: budget,
				revenue: revenue,
				belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
				production_company: `"${productionCompanies}"`,
			};
		}

		const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n')}\n---`;

		const fileContent = await this.app.vault.read(file);
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

		if (yamlRegex.test(fileContent)) {
			const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
			await this.app.vault.modify(file, updatedFileContent);
			new Notice('File updated with new data successfully.');
		} else {
			new Notice('YAML front matter not found in file.');
		}
	}

}



