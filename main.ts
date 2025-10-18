import { App, Plugin, Notice, requestUrl, TFile, TFolder } from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';
import { TVTrackerSettingsTab } from './src/modals/SettingsTab';
import { SearchModal } from './src/modals/SearchModal';
import { Commands } from './src/commands/Commands';
import { OperationRegistry } from './src/operations/OperationRegistry';
import { FileService, TMDBService, YAMLService, SingleFileOperationsService } from './src/services';
import { TVTrackerSettings } from './src/types/PluginTypes';



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
	
	// Services and operations
	private fileService!: FileService;
	private tmdbService!: TMDBService;
	private yamlService!: YAMLService;
	private singleFileOperationsService!: SingleFileOperationsService;
	private operationRegistry!: OperationRegistry;

	async onload() {
		await this.loadSettings();
		
		// Initialize services
		this.fileService = new FileService(this.app, this.settings.movieFolderPath);
		this.tmdbService = new TMDBService(this.settings.apiKey);
		this.yamlService = new YAMLService();
		this.singleFileOperationsService = new SingleFileOperationsService(
			this.app, 
			this.fileService, 
			this.tmdbService, 
			this.yamlService, 
			this.settings
		);
		this.operationRegistry = new OperationRegistry(this.fileService, this.tmdbService);
		
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
		await this.operationRegistry.removeTrailerLinks();
	}
	

	async addTrailerAndPoster() {
		await this.operationRegistry.addTrailerLinks();
    }

	async updateNewProperties() {
		await this.operationRegistry.updateProperties();
	}
	
	async updateEPTracking() {
		await this.operationRegistry.updateEpisodeTracking();
	}

	async updateAvailableOn() {
		await this.operationRegistry.updateStreamingInfo(this.settings.countryAvailableOn);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_TV_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async addEpisodeListToCurrentFile(activeFile: TFile) {
		await this.singleFileOperationsService.addEpisodeList(activeFile);
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
		await this.singleFileOperationsService.updateEpisodeTracking(file);
	}

	async updateAvailableOnForFile(file: TFile) {
		await this.singleFileOperationsService.updateStreamingAvailability(file);
	}

	async updateNewPropertiesForFile(file: TFile) {
		await this.singleFileOperationsService.updateProperties(file);
	}

}



