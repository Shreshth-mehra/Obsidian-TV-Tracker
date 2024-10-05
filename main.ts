import { App, Plugin, PluginSettingTab, Setting, Notice, requestUrl} from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';


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
	title:'TV Tracker 🎬📽️'
}

export default class TVTrackerPlugin extends Plugin {
	settings: TVTrackerSettings;
	systemThemeMode: string;

	async onload() {
		await this.loadSettings();
		this.systemThemeMode = 'light'; // Default to light
		const rootElement = document.body; // or another root element of the app

		if (rootElement.classList.contains('theme-dark')) {
			this.systemThemeMode = 'dark';
		}

		this.registerView(VIEW_TV, (leaf) => new TVTracker(leaf,this, this.systemThemeMode));
		this.addRibbonIcon('star','Open TV Tracker', ()=>  {
			this.activateView();
	
		});

		this.addSettingTab(new TVTrackerSettingsTab(this.app, this));
		
	}
	onunload() {

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
			});
	
			if (response.status !== 200) {
				errorCount++;
				console.error("BAd response from TMDB", file.path)
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
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_TV_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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

			// new Setting(containerEl)
			// .setName('Maximum number of movies from a single collection allowed ')
			// .setDesc('Maximum number of movies from a single collection that will count towards minimum number of movies for avg rating metrics')
			// .addText(text => text
			// 	.setValue(String(this.plugin.settings.maxMoviesFromCollection))
			// 	.onChange(async (value) => {
			// 		this.plugin.settings.maxMoviesFromCollection = Number(value);
			// 		await this.plugin.saveSettings();
			// 	}));

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
