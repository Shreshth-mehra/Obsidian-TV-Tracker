import { App, Plugin, PluginSettingTab, Setting, Notice, requestUrl, TFile, TFolder, Modal } from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';
import { TMDB_COUNTRIES } from './countries';


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

		this.addRibbonIcon('star','Open TV Tracker', ()=>  {
			this.activateView();
	
		});

		this.addSettingTab(new TVTrackerSettingsTab(this.app, this));
		
		this.addCommand({
			id: 'add-episode-list',
			name: 'Add episode list for current file',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file found.');
					return;
				}
				console.log("Active file", activeFile);
				this.addEpisodeListToCurrentFile(activeFile)
			}
		});

		// Add new commands for updating current file
		this.addCommand({
			id: 'update-current-file-episode-tracking',
			name: 'Update Episode tracking for current file',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file found.');
					return;
				}
				await this.updateEPTrackingForFile(activeFile);
			}
		});

		this.addCommand({
			id: 'update-current-file-streaming',
			name: 'Update Streaming availability for current file',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file found.');
					return;
				}
				await this.updateAvailableOnForFile(activeFile);
			}
		});

		this.addCommand({
			id: 'update-current-file-data',
			name: 'Update current file with new data',
			callback: async () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file found.');
					return;
				}
				await this.updateNewPropertiesForFile(activeFile);
			}
		});

		// Add new command for searching and adding movies/TV shows
		this.addCommand({
			id: 'search-and-add-movie',
			name: 'Search and add movie/TV show',
			callback: async () => {
				const modal = new SearchModal(this.app, this);
				modal.open();
			}
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
							if (seasonMatch) {
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


class TVTrackerSettingsTab extends PluginSettingTab {
	plugin: TVTrackerPlugin;

	constructor(app: App, plugin: TVTrackerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
		.setName('Title to display')
		.setDesc('The title you want displayed at the top in the plugin')
		.addText(text => text
			.setValue(this.plugin.settings.title)
			.onChange(async (value) => {
				this.plugin.settings.title = value;
				await this.plugin.saveSettings();
			}));

     

		new Setting(containerEl)
		.setName('Folder path')
		.setDesc('Path to the folder where all content is stored.')
		.addText(text => text
			.setValue(this.plugin.settings.movieFolderPath)
			.onChange(async (value) => {
				this.plugin.settings.movieFolderPath = value;
				await this.plugin.saveSettings();
			}));


	new Setting(containerEl)
		.setName('TMDB API key')
		.setDesc('Your TMDB API key. https://www.themoviedb.org/ ')
		.addText(text => text
			.setValue(this.plugin.settings.apiKey)
			.onChange(async (value) => {
				this.plugin.settings.apiKey = value;
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
			.setName('Country for Available On')
			.setDesc('Select the country to show streaming availability for')
			.addDropdown(dropdown => dropdown
				.addOptions(TMDB_COUNTRIES)
				.setValue(this.plugin.settings.countryAvailableOn)
				.onChange(async (value) => {
					this.plugin.settings.countryAvailableOn = value;
					await this.plugin.saveSettings();
				}));
	
			new Setting(containerEl)
            .setName('Show Trailer and Poster Links')
            .setDesc('Enable this to display trailer and poster links in new files. Only affects the new files. To update existing files see Update Files section below.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTrailerAndPosterLinks)
                .onChange(async (value) => {
                    this.plugin.settings.showTrailerAndPosterLinks = value;
                    await this.plugin.saveSettings();
                }));

				new Setting(containerEl)
				.setName('Show Episodes seen for TV Series on Cards')
				.setDesc('If enabled, the cards will show Number of episodes seen out of total episodes on the card for TV series only. Needs you to Update files first from v1.3.5 update button below')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.showEPSeen)
					.onChange(async (value) => {
						this.plugin.settings.showEPSeen = value;
						await this.plugin.saveSettings();
					}));
	
			new Setting(containerEl)
			.setName('Number of results to show')
			.setDesc('Number of results to display for add new')
			.addText(text => text
				.setValue(String(this.plugin.settings.numberOfResults))
				.onChange(async (value) => {
					this.plugin.settings.numberOfResults = Number(value);
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
			.setName('Folder path for saving Images')
			.setDesc('Folder path for saving images. Functionality not completed yet')
			.addText(text => text
				.setValue(this.plugin.settings.imageFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.imageFolderPath = value;
					await this.plugin.saveSettings();
				}));

				new Setting(containerEl)
				.setName('Default language filters')
				.setDesc('Enter Language codes separated by comma here. Entered values are selected by default when the plugin is started. For example "en, fr, es".')
				.addText(text => text
					.setValue(this.plugin.settings.defaultLanguageFilters)
					.onChange(async (value) => {
						this.plugin.settings.defaultLanguageFilters = value;
						await this.plugin.saveSettings();
					}));

					new Setting(containerEl)
					.setName('Default Properties to show')
					.setDesc('Case sensitive. Enter property names separated by comma here. Entered values are are shown on the cards by default when the plugin is started. For example "Genre, Avg Vote"')
					.addText(text => text
						.setValue(this.plugin.settings.defaultPropertiesToShow)
						.onChange(async (value) => {
							this.plugin.settings.defaultPropertiesToShow = value;
							await this.plugin.saveSettings();
						}));

						new Setting(containerEl)
						.setName('Default Sorting Mode')
						.setDesc('Default Sorting mode. Options are Rating, Alphabetical, Avg vote, Hidden gem factor ')
						.addDropdown(dropdown => dropdown
							.addOptions({
								'Rating': 'Rating',
								'Alphabetical': 'Alphabetical',
								'Avg vote': 'Avg vote',
								'Hidden gem factor': 'Hidden gem factor'
							})
							.setValue(this.plugin.settings.defaultSortingMode)
							.onChange(async (value) => {
								this.plugin.settings.defaultSortingMode = value;
								await this.plugin.saveSettings();
							}));
	

				new Setting(containerEl)
				.setName('Hide Legend')
				.setDesc('Hide Legend from the view')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.hideLegend)
					.onChange(async (value) => {
						this.plugin.settings.hideLegend = value;
						await this.plugin.saveSettings();
					}));
		

	
	let fileUpdateSettingsContainer = this.addSectionHeader(containerEl, 'Update Files (Please keep a backup of the folder before proceeding)', 'updateFiles-settings');
	this.addFileUpdateSettings(fileUpdateSettingsContainer);

    let styleSettingsContainer = this.addSectionHeader(containerEl, 'Style', 'style-settings');
    this.addStyleSettings(styleSettingsContainer);


    let metricSettingsContainer = this.addSectionHeader(containerEl, 'Metrics', 'metric-settings');
    this.addMetricSettings(metricSettingsContainer);
	}

	addSectionHeader(containerEl: HTMLElement, title: string, id: string) {
		const header = containerEl.createEl('div', { cls: 'settings-section-header' });
		const headerTitle = containerEl.createEl('h3', { text: title });

		const contentContainer = containerEl.createDiv();
		contentContainer.id = id;

		header.appendChild(headerTitle);
	
		return contentContainer;
	}

	addFileUpdateSettings(containerEl: HTMLElement){

		new Setting(containerEl)
		.setName('Update Files for Episode tracking')
		.setDesc('Fetches total episode count, adds a property for episodes seen and episode runtime. These new properties were added in v1.3.5. You can run this again to update the number of seasons and episodes with latest information.')
		.addButton(button => button
			.setButtonText('Update')
			.setCta()
			.onClick(() => {
				this.plugin.updateEPTracking();
			}));

		new Setting(containerEl)
		.setName('Update Streaming Availability')
		.setDesc('Fetches and updates streaming availability information for the selected country from TMDB API.')
		.addButton(button => button
			.setButtonText('Update')
			.setCta()
			.onClick(() => {
				this.plugin.updateAvailableOn();
			}));

		new Setting(containerEl)
		.setName('Update Files with new data')
		.setDesc('Fetches overview, trailer link, original language, production company, budget, revenue and release date for all movies/shows and updates the YAML. These new properties were added in v1.3.0. Use this button for any future updates also to fetch new properties (If properties already exist they will be overwritten).')
		.addButton(button => button
			.setButtonText('Update')
			.setCta()
			.onClick(() => {
				this.plugin.updateNewProperties();
			}));

			new Setting(containerEl)
            .setName('Add trailer and poster link to existing Files')
            .setDesc('Click this button to update all existing files to include trailer and poster links.')
            .addButton(button => button
                .setButtonText('Add')
				.setCta()
                .onClick(async () => {
                    await this.plugin.addTrailerAndPoster();
                }));

				new Setting(containerEl)
				.setName('Remove trailer and poster links from existing Files')
				.setDesc('Click this button to update all existing files to remove trailer and poster links. The rest of the contents should remain unchanged')
				.addButton(button => button
					.setButtonText('Remove')
					.setCta()
					.onClick(async () => {
						await this.plugin.removeTrailerAndPosterLinks();
					}));


	}

	addStyleSettings(containerEl: HTMLElement) {
		new Setting(containerEl)
		.setName('Theme Mode')
		.setDesc('Dark, Light or Adapt to system ')
		.addDropdown(dropdown => dropdown
			.addOptions({
				'Dark': 'Dark',
				'Light': 'Light'
				
			})
			.setValue(this.plugin.settings.themeMode)
			.onChange(async (value) => {
				this.plugin.settings.themeMode = value;
				await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
        .setName('Background color for movie cards')
        .setDesc('Enter as a hex code. Leaving as inherit will use Obsidian global settings based on Light or dark theme')
        .addText(text => text
            .setValue(this.plugin.settings.movieCardColor)
            .onChange(async (value) => {
                this.plugin.settings.movieCardColor = value;
                await this.plugin.saveSettings();
            }));

			new Setting(containerEl)
        .setName('Color for movie metrics heading (H1)')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics heading.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsHeadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsHeadingColor = value;
                await this.plugin.saveSettings();
            }));
   
    new Setting(containerEl)
        .setName('Color for metrics subheadings (H2)')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics subheadings.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsSubheadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsSubheadingColor = value;
                await this.plugin.saveSettings();
            }));

			
			new Setting(containerEl)
			.setName('Color for metrics subheadings (H3)')
			.setDesc('Enter as a hex code. Choose a color for the metrics H3 subheadings such as under budget metrics.')
			.addText(text => text
				.setValue(this.plugin.settings.budgetMetricsSubheadingColor)
				.onChange(async (value) => {
					this.plugin.settings.budgetMetricsSubheadingColor = value;
					await this.plugin.saveSettings();
				}));
	

   

		new Setting(containerEl)
				.setName('Toggle fitted images')
				.setDesc('Toggle button for fitted images')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.toggleFittedImages)
					.onChange(async (value) => {
						this.plugin.settings.toggleFittedImages = value;
						await this.plugin.saveSettings();
					}));


				new Setting(containerEl)
				.setName('Number of columns')
				.setDesc('Number of columns for the grid (Minimum: 2, Maximum: 6). Note: this setting has no effect in mobile.')
				.addText(text => text
					.setValue(String(this.plugin.settings.numberOfColumns))
					.onChange(async (value) => {
						if (value.trim() === '') {
							// If the field is empty, don't apply constraints yet
							return;
						}
			
						let numColumns = Number(value);
						// Validate the number is within the range 2 to 6
						if (!isNaN(numColumns)) {
							if (numColumns < 2) numColumns = 2;
							if (numColumns > 6) numColumns = 6;
						} else {
							// If the input is not a valid number, reset to default
							numColumns = this.plugin.settings.numberOfColumns;
						}
			
						this.plugin.settings.numberOfColumns = numColumns;
						text.setValue(String(numColumns)); 
						await this.plugin.saveSettings();
					}));

		

	}

	addMetricSettings(containerEl: HTMLElement) {

		new Setting(containerEl)
		.setName('Hide Metrics')
		.setDesc('Hides all Metrics from the view')
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.hideMetrics)
			.onChange(async (value) => {
				this.plugin.settings.hideMetrics = value;
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
			.setName('Hide Budget Metrics')
			.setDesc('Hides only budget Metrics from the view')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideBudgetMetrics)
				.onChange(async (value) => {
					this.plugin.settings.hideBudgetMetrics = value;
					await this.plugin.saveSettings();
				}));

				new Setting(containerEl)
				.setName('Hide Genre taste index Metrics')
				.setDesc('Hides only Genre taste index Metrics from the view')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.hideGenreTasteIndexMetrics)
					.onChange(async (value) => {
						this.plugin.settings.hideGenreTasteIndexMetrics = value;
						await this.plugin.saveSettings();
					}));
					new Setting(containerEl)
					.setName('Click to view info')
					.setDesc('Click on an Actor or Director name in the metrics to view their Photo, total movies, Age, Upcoming movies and ranks in your library')
					.addToggle(toggle => toggle
						.setValue(this.plugin.settings.clickForInfo)
						.onChange(async (value) => {
							this.plugin.settings.clickForInfo = value;
							await this.plugin.saveSettings();
						}));

		new Setting(containerEl)
		.setName('Name of Metrics')
		.setDesc('Name for the heading where various metrics are shown')
        .addText(text => text
            .setValue(this.plugin.settings.metricsHeading)
            .onChange(async (value) => {
                this.plugin.settings.metricsHeading = value;
                await this.plugin.saveSettings();
            }));


			new Setting(containerEl)
		.setName('Number of top genres to show')
		.setDesc('Number of top genres to show in metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.topGenresNumber))
			.onChange(async (value) => {
				this.plugin.settings.topGenresNumber = Number(value);
				await this.plugin.saveSettings();
			}));

			
			new Setting(containerEl)
			.setName('Number of top actors to show')
			.setDesc('Number of top actors to show in metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.topActorsNumber))
				.onChange(async (value) => {
					this.plugin.settings.topActorsNumber = Number(value);
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
			.setName('Number of top directors to show')
			.setDesc('Number of top directors to show in metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.topDirectorsNumber))
				.onChange(async (value) => {
					this.plugin.settings.topDirectorsNumber = Number(value);
					await this.plugin.saveSettings();
				}));

				
			new Setting(containerEl)
			.setName('Number of top Years to show')
			.setDesc('Number of top Years to show in metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.topYearsNumber))
				.onChange(async (value) => {
					this.plugin.settings.topYearsNumber = Number(value);
					await this.plugin.saveSettings();
				}));


				new Setting(containerEl)
				.setName('Number of top production companies to show')
				.setDesc('Number of top production companies to show in metrics')
				.addText(text => text
					.setValue(String(this.plugin.settings.topProductionCompaniesNumber))
					.onChange(async (value) => {
						this.plugin.settings.topProductionCompaniesNumber = Number(value);
						await this.plugin.saveSettings();
					}));

					new Setting(containerEl)
					.setName('Number of top Collections/Franchises to show')
					.setDesc('Number of top Collections/Franchises to show in metrics')
					.addText(text => text
						.setValue(String(this.plugin.settings.topCollectionsNumber))
						.onChange(async (value) => {
							this.plugin.settings.topCollectionsNumber = Number(value);
							await this.plugin.saveSettings();
						}));

						new Setting(containerEl)
					.setName('Number of top results to show in Budget metrics')
					.setDesc('Number of top results to show in Budget metrics')
					.addText(text => text
						.setValue(String(this.plugin.settings.topPerformersNumber))
						.onChange(async (value) => {
							this.plugin.settings.topPerformersNumber = Number(value);
							await this.plugin.saveSettings();
						}));

					
	

			new Setting(containerEl)
		.setName('Minimum number of movies for metric - Actor ')
		.setDesc('Minimum number of movie for an actor for avg rating based metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.minMoviesForMetrics))
			.onChange(async (value) => {
				this.plugin.settings.minMoviesForMetrics = Number(value);
				await this.plugin.saveSettings();
			}));


			new Setting(containerEl)
			.setName('Minimum number of movies for metric - Director and Production company ')
			.setDesc('Minimum number of movie for Director and Production company for avg rating based metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.minMoviesForMetricsDirectors))
				.onChange(async (value) => {
					this.plugin.settings.minMoviesForMetricsDirectors = Number(value);
					await this.plugin.saveSettings();
				}));

				new Setting(containerEl)
				.setName('Minimum number of movies for metric - Collections/Franchise ')
				.setDesc('Minimum number of movie for a Collections/Franchise for avg rating based metrics')
				.addText(text => text
					.setValue(String(this.plugin.settings.minMoviesForMetricsCollections))
					.onChange(async (value) => {
						this.plugin.settings.minMoviesForMetricsCollections = Number(value);
						await this.plugin.saveSettings();
					}));

					new Setting(containerEl)
					.setName('Minimum number of movies for metric - Years ')
					.setDesc('Minimum number of movie for a Year for avg rating based metrics')
					.addText(text => text
						.setValue(String(this.plugin.settings.minMoviesForMetricsYears))
						.onChange(async (value) => {
							this.plugin.settings.minMoviesForMetricsYears = Number(value);
							await this.plugin.saveSettings();
						}));
		
	}

}

interface SearchResult {
    id: number;
    title: string;
    release_date?: string;
    overview: string;
    type: 'Movie' | 'Series';
    poster_path?: string;
}

class SearchModal extends Modal {
	plugin: TVTrackerPlugin;
	searchInput: HTMLInputElement;
	resultsDiv: HTMLDivElement;
	loading: boolean;

	constructor(app: App, plugin: TVTrackerPlugin) {
		super(app);
		this.plugin = plugin;
		this.loading = false;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create search input
		contentEl.createEl('h2', { text: 'Search Movie/TV Show' });
		
		const searchContainer = contentEl.createDiv({ cls: 'search-container' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Enter title or TMDB ID...'
		});

		// Create results container with flex layout
		this.resultsDiv = contentEl.createDiv({ cls: 'search-results' });
		this.resultsDiv.style.display = 'flex';
		this.resultsDiv.style.flexDirection = 'column';
		this.resultsDiv.style.gap = '20px';

		// Add search button
		const searchButton = searchContainer.createEl('button', {
			text: 'Search'
		});

		const performSearch = async () => {
			if (this.loading) return;
			this.loading = true;
			
			const query = this.searchInput.value.trim();
			this.resultsDiv.empty();
			this.resultsDiv.createEl('div', { text: 'Searching...' });

			try {
				let results = [];
				// Check if input is a TMDB ID
				if (/^\d+$/.test(query)) {
					// Try searching as movie first
					try {
						const movieResponse = await requestUrl({
							url: `https://api.themoviedb.org/3/movie/${query}?api_key=${this.plugin.settings.apiKey}`
						});
						if (movieResponse.status === 200) {
							const data = movieResponse.json;
							results = [{
								id: data.id,
								title: data.title,
								release_date: data.release_date,
								overview: data.overview,
								type: 'Movie',
								poster_path: data.poster_path
							}];
						}
					} catch {
						// If movie search fails, try TV show
						try {
							const tvResponse = await requestUrl({
								url: `https://api.themoviedb.org/3/tv/${query}?api_key=${this.plugin.settings.apiKey}`
							});
							if (tvResponse.status === 200) {
								const data = tvResponse.json;
								results = [{
									id: data.id,
									title: data.name,
									release_date: data.first_air_date,
									overview: data.overview,
									type: 'Series',
									poster_path: data.poster_path
								}];
							}
						} catch {
							// Both searches failed
							this.resultsDiv.empty();
							this.resultsDiv.createEl('div', { text: 'No results found for this TMDB ID.' });
							this.loading = false;
							return;
						}
					}
				} else {
					// Search by title
					const movieResponse = await requestUrl({
						url: `https://api.themoviedb.org/3/search/multi?api_key=${this.plugin.settings.apiKey}&query=${encodeURIComponent(query)}&page=1`
					});
					
					if (movieResponse.status === 200) {
						results = movieResponse.json.results
							.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
							.map((item: any) => ({
								id: item.id,
								title: item.media_type === 'movie' ? item.title : item.name,
								release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date,
								overview: item.overview,
								type: item.media_type === 'movie' ? 'Movie' : 'Series',
								poster_path: item.poster_path
							}))
							.slice(0, this.plugin.settings.numberOfResults);
					}
				}

				this.resultsDiv.empty();
				if (results.length === 0) {
					this.resultsDiv.createEl('div', { text: 'No results found.' });
				} else {
					results.forEach((result: SearchResult) => {
						const resultDiv = this.resultsDiv.createDiv({ cls: 'search-result' });
						resultDiv.style.display = 'flex';
						resultDiv.style.gap = '20px';
						resultDiv.style.marginBottom = '20px';
						
						// Add poster image if available
						if (result.poster_path) {
							const posterDiv = resultDiv.createDiv({ cls: 'poster' });
							const posterImg = posterDiv.createEl('img', {
								attr: {
									src: `https://image.tmdb.org/t/p/w200${result.poster_path}`,
									alt: `${result.title} poster`
								}
							});
							posterImg.style.maxWidth = '100px';
							posterImg.style.height = 'auto';
						}

						const contentDiv = resultDiv.createDiv({ cls: 'content' });
						const titleEl = contentDiv.createEl('div', { 
							text: `${result.title} (${result.type})` 
						});
						titleEl.style.fontWeight = 'bold';
						
						if (result.release_date) {
							contentDiv.createEl('div', { 
								text: `Release Date: ${result.release_date}` 
							});
						}
						
						contentDiv.createEl('div', { 
							text: result.overview 
						});

						const addButton = contentDiv.createEl('button', {
							text: 'Add to Library'
						});

						addButton.addEventListener('click', async () => {
							await this.addToLibrary(result);
							this.close();
						});
					});
				}
			} catch (error) {
				console.error('Search error:', error);
				this.resultsDiv.empty();
				this.resultsDiv.createEl('div', { text: 'An error occurred while searching.' });
			}
			
			this.loading = false;
		};

		// Add event listeners
		searchButton.addEventListener('click', performSearch);
		this.searchInput.addEventListener('keypress', async (event) => {
			if (event.key === 'Enter') {
				await performSearch();
			}
		});
	}

	async addToLibrary(result: SearchResult) {
		try {
			// Create a modal for status and rating input
			const statusModal = new Modal(this.app);
			statusModal.titleEl.setText('Set Status and Rating');
			
			const contentEl = statusModal.contentEl;
			contentEl.empty();
			
			// Create form elements
			const form = contentEl.createEl('form');
			
			// Status text input
			const statusContainer = form.createDiv({ cls: 'setting-item' });
			statusContainer.createEl('label', { text: 'Status' });
			const statusInput = statusContainer.createEl('input', {
				type: 'text',
				placeholder: 'Enter status (e.g., Watchlist, Watching, Completed)'
			});
			
			// Rating slider container
			const ratingContainer = form.createDiv({ cls: 'setting-item' });
			ratingContainer.createEl('label', { text: 'Rating' });
			
			// Create a container for the slider and value display
			const sliderContainer = ratingContainer.createDiv();
			sliderContainer.style.display = 'flex';
			sliderContainer.style.alignItems = 'center';
			sliderContainer.style.gap = '10px';
			
			// Create the slider
			const ratingSlider = sliderContainer.createEl('input', {
				type: 'range',
				attr: {
					min: '1',
					max: '5',
					step: '0.5',
					value: '1'
				}
			});
			ratingSlider.style.flex = '1';
			
			// Create the value display
			const ratingValue = sliderContainer.createEl('span', {
				text: '1.0'
			});
			ratingValue.style.minWidth = '40px';
			
			// Update the value display when slider changes
			ratingSlider.addEventListener('input', () => {
				ratingValue.setText(ratingSlider.value);
			});
			
			// Add some spacing
			form.createEl('div', { cls: 'setting-item-description' });
			
			// Submit button
			const submitButton = form.createEl('button', {
				text: 'Add to Library',
				cls: 'mod-cta'
			});
			
			// Handle form submission
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const status = statusInput.value.trim();
				const rating = parseFloat(ratingSlider.value);
				
				// Validate inputs
				if (!status) {
					new Notice('Please enter a status');
					return;
				}
				
				if (isNaN(rating) || rating < 1 || rating > 5) {
					new Notice('Please select a valid rating between 1 and 5');
					return;
				}
				
				statusModal.close();
				
				// Continue with adding to library
				const sanitizedTitle = result.title.replace(/[\\/:*?"<>|]/g, '');
				const fileName = `${sanitizedTitle}`;
				
				// Get additional details based on the type
				const endpoint = result.type === 'Movie' ? 'movie' : 'tv';
				const detailsResponse = await requestUrl({
					url: `https://api.themoviedb.org/3/${endpoint}/${result.id}?api_key=${this.plugin.settings.apiKey}&append_to_response=credits,videos`
				});
				
				if (detailsResponse.status !== 200) {
					throw new Error('Failed to fetch details');
				}
				
				const details = detailsResponse.json;
				
				// Get cast and director information
				const cast = details.credits.cast
					.slice(0, 10) // Get top 10 cast members
					.map((actor: any) => actor.name)
					.join(', ');
				
				const directors = details.credits.crew
					.filter((crew: any) => crew.job === 'Director')
					.map((director: any) => director.name)
					.join(', ');
				
				// Get trailer
				let trailer = '';
				if (details.videos && details.videos.results.length > 0) {
					const trailerVideo = details.videos.results.find((video: any) => video.type === 'Trailer');
					if (trailerVideo) {
						trailer = `https://www.youtube.com/watch?v=${trailerVideo.key}`;
					}
				}

				// Get production companies
				const productionCompanies = details.production_companies
					.map((company: any) => company.name)
					.join(', ');
				
				// Fetch streaming availability
				let streamingServices = '';
				try {
					const streamingResponse = await requestUrl({
						url: `https://api.themoviedb.org/3/${endpoint}/${result.id}/watch/providers?api_key=${this.plugin.settings.apiKey}`
					});
					
					if (streamingResponse.status === 200) {
						const streamingData = streamingResponse.json;
						const countryCode = this.plugin.settings.countryAvailableOn;
						const providers = streamingData.results[countryCode]?.flatrate || [];
						streamingServices = providers.map((provider: any) => provider.provider_name).join(', ');
					}
				} catch (error) {
					console.error('Error fetching streaming availability:', error);
					// Continue without streaming information
				}
				
				// Create YAML content
				const yaml = {
					Title: `"${result.title}"`,
					Rating: rating,
					Status: status,
					Type: result.type,
					Poster: details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : '',
					Genre: details.genres.map((g: any) => g.name).join(', '),
					Duration: result.type === 'Movie' ? 
						(details.runtime ? `${details.runtime} minutes` : '') :
						(details.episode_run_time?.[0] ? `${details.episode_run_time[0]} minutes` : ''),
					"Avg vote": details.vote_average,
					Popularity: details.popularity,
					Cast: cast,
					"TMDB ID": result.id,
					Director: directors,
					tags: "tvtracker, " + result.type,
					original_language: `"${details.original_language}"`,
					overview: `"${details.overview.replace(/"/g, '\\"')}"`,
					trailer: `"${trailer}"`,
					budget: details.budget || 0,
					revenue: details.revenue || 0,
					belongs_to_collection: details.belongs_to_collection ? `"${details.belongs_to_collection.name}"` : '""',
					production_company: `"${productionCompanies}"`,
					release_date: `"${details.release_date || details.first_air_date || ''}"`,
					"Available On": streamingServices ? `"${streamingServices}"` : ''
				};
				
				if (result.type === 'Series') {
					Object.assign(yaml, {
						total_episodes: details.number_of_episodes,
						total_seasons: details.number_of_seasons,
						episodes_seen: 0,
						episode_runtime: details.episode_run_time?.[0] || null,
						next_episode: '',
						air_date: `"${details.first_air_date || ''}"`,
						last_episode_date: `"${details.last_air_date || ''}"`,
						status: `"${details.status || ''}"`,
						in_production: details.in_production ? "Yes" : "No"
					});
				}
				
				// Create content with exact YAML format
				let content = '---\n';
				content += Object.entries(yaml)
					.filter(([_, value]) => value !== null && value !== undefined && value !== '')
					.map(([key, value]) => `${key}: ${value}`)
					.join('\n');
				content += '\n---\n';
				
				// Add poster and trailer links
				if (details.poster_path) {
					content += `\n![Poster](https://image.tmdb.org/t/p/original${details.poster_path})\n`;
				}
				if (trailer) {
					content += `\n![Trailer](${trailer})\n`;
				}
				
				// For TV shows, add episodes section
				if (result.type === 'Series') {
					content += '\n# Episodes\n';
					for (let i = 1; i <= details.number_of_seasons; i++) {
						const seasonResponse = await requestUrl({
							url: `https://api.themoviedb.org/3/tv/${result.id}/season/${i}?api_key=${this.plugin.settings.apiKey}`
						});
						if (seasonResponse.status === 200) {
							const seasonData = seasonResponse.json;
							content += `\n## Season ${i}\n`;
							seasonData.episodes.forEach((episode: any) => {
								content += `- [ ] Episode ${episode.episode_number}: ${episode.name}\n`;
							});
						}
					}
				}
				
				// Create the file
				const filePath = `${this.plugin.settings.movieFolderPath}/${fileName}.md`;
				await this.app.vault.create(filePath, content);
				new Notice(`Added ${result.title} to your library!`);
				
			});
			
			// Show the modal
			statusModal.open();
			
		} catch (error) {
			console.error('Error adding to library:', error);
			new Notice('Failed to add to library. Check console for details.');
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
