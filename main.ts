import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';
// Remember to rename these classes and interfaces!

interface TVTrackerSettings {
	
	movieFolderPath: string;
	numberOfColumns: number;           
    numberOfResults: number;            
    toggleFittedImages: boolean;        
    imageFolderPath: string;   
	apiKey: string;
	topGenresNumber: number;
	topActorsNumber: number;
	topDirectorsNumber: number;
	minMoviesForMetrics: number;
	movieMetricsHeadingColor: string;
    movieMetricsSubheadingColor: string;
    movieCardColor: string;
	metricsHeading: string;
}

const DEFAULT_TV_SETTINGS: TVTrackerSettings = {
	
	movieFolderPath: '/Movies',
	numberOfColumns: 6,               
    numberOfResults: 3,               
    toggleFittedImages: true,         
    imageFolderPath: '/Movies/Images',
	apiKey :'' ,
	topActorsNumber:5,
	topDirectorsNumber:5,
	topGenresNumber:5,
	minMoviesForMetrics:7,
	movieMetricsHeadingColor: 'lightblue', // Default to black
    movieMetricsSubheadingColor: 'orange', // Default to dark grey
	movieCardColor: 'inherit',
	metricsHeading: 'For Number geeks'

}

export default class TVTrackerPlugin extends Plugin {
	settings: TVTrackerSettings;
	themeMode: string;

	async onload() {
		await this.loadSettings();
		this.themeMode = 'light'; // Default to light
		const rootElement = document.body; // or another root element of the app

		if (rootElement.classList.contains('theme-dark')) {
			this.themeMode = 'dark';
		}

		this.registerView(VIEW_TV, (leaf) => new TVTracker(leaf,this,this.settings.movieFolderPath, this.settings.imageFolderPath,this.settings.numberOfColumns,this.settings.numberOfResults,this.settings.toggleFittedImages, this.settings.apiKey, this.settings.topActorsNumber, this.settings.topGenresNumber,this.settings.topDirectorsNumber,this.settings.minMoviesForMetrics, this.settings.movieCardColor, this.settings.movieMetricsHeadingColor,this.settings.movieMetricsSubheadingColor, this.themeMode, this.settings.metricsHeading));
		// console.log(this.settings.movieFolderPath);
		this.addRibbonIcon('star','Open TV Tracker', ()=>  {
			this.activateView();
			// this.openView();
		});

		this.addSettingTab(new TVTrackerSettingsTab(this.app, this));
		

// console.log("The current theme mode is:", this.themeMode);
	}
	onunload() {

	}

	async openView() {
		// Create a new tab in the main editor for your view
		const leaf = this.app.workspace.getLeaf(true);
		const view = new TVTracker(leaf,this,this.settings.movieFolderPath,this.settings.imageFolderPath,this.settings.numberOfColumns,this.settings.numberOfResults,this.settings.toggleFittedImages,this.settings.apiKey, this.settings.topActorsNumber, this.settings.topGenresNumber,this.settings.topDirectorsNumber,this.settings.minMoviesForMetrics, this.settings.movieCardColor, this.settings.movieMetricsHeadingColor,this.settings.movieMetricsSubheadingColor, this.themeMode, this.settings.metricsHeading);
		leaf.setViewState({
			type: VIEW_TV,
			active: true,
		});

	}


	async activateView(){
		this.app.workspace.detachLeavesOfType(VIEW_TV);

		await this.app.workspace.getLeaf(false).setViewState({
			type:VIEW_TV,
			active:true,
		});

		this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TV)[0]
		);
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
		.setName('Folder Path')
		.setDesc('Path to the folder where all content is stored.')
		.addText(text => text
			.setValue(this.plugin.settings.movieFolderPath)
			.onChange(async (value) => {
				this.plugin.settings.movieFolderPath = value;
				await this.plugin.saveSettings();
			}));

	// API Key Setting
	new Setting(containerEl)
		.setName('TMDB API Key')
		.setDesc('Your TMDB API Key. https://www.themoviedb.org/ ')
		.addText(text => text
			.setValue(this.plugin.settings.apiKey)
			.onChange(async (value) => {
				this.plugin.settings.apiKey = value;
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
			.setName('Number of Results to Show')
			.setDesc('Number of results to display for add new')
			.addText(text => text
				.setValue(String(this.plugin.settings.numberOfResults))
				.onChange(async (value) => {
					this.plugin.settings.numberOfResults = Number(value);
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
			.setName('Folder Path for Saving Images')
			.setDesc('Folder path for saving images. Functionality not completed yet')
			.addText(text => text
				.setValue(this.plugin.settings.imageFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.imageFolderPath = value;
					await this.plugin.saveSettings();
				}));

		

    let styleSettingsContainer = this.addSectionHeader(containerEl, 'Style', 'style-settings');
    this.addStyleSettings(styleSettingsContainer);


    let metricSettingsContainer = this.addSectionHeader(containerEl, 'Movie Metrics', 'metric-settings');
    this.addMetricSettings(metricSettingsContainer);
	}

	addSectionHeader(containerEl: HTMLElement, title: string, id: string) {
		const header = containerEl.createEl('div', { cls: 'settings-section-header' });
		const headerTitle = containerEl.createEl('h3', { text: title });
	
		// Create a container for the section content
		const contentContainer = containerEl.createDiv();
		contentContainer.id = id;
	
		// Append title to the header (no icon is appended since there's no toggle functionality)
		header.appendChild(headerTitle);
	
		return contentContainer;
	}


	addStyleSettings(containerEl: HTMLElement) {

		new Setting(containerEl)
        .setName('Background color for Movie cards')
        .setDesc('Enter as a hex code. Leaving as inherit will use Obsidian global settings based on Light or dark theme')
        .addText(text => text
            .setValue(this.plugin.settings.movieCardColor)
            .onChange(async (value) => {
                this.plugin.settings.movieCardColor = value;
                await this.plugin.saveSettings();
            }));

    // Color for Movie Metrics Subheadings Setting
    new Setting(containerEl)
        .setName('Color for Movie Metrics Subheadings')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics subheadings.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsSubheadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsSubheadingColor = value;
                await this.plugin.saveSettings();
            }));

    // Theme Setting
	new Setting(containerEl)
        .setName('Color for Movie Metrics Heading')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics heading.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsHeadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsHeadingColor = value;
                await this.plugin.saveSettings();
            }));

		new Setting(containerEl)
				.setName('Toggle Fitted Images')
				.setDesc('Toggle button for fitted images')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.toggleFittedImages)
					.onChange(async (value) => {
						this.plugin.settings.toggleFittedImages = value;
						await this.plugin.saveSettings();
					}));


				new Setting(containerEl)
				.setName('Number of Columns')
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
						text.setValue(String(numColumns)); // Update the input field with the valid value
						await this.plugin.saveSettings();
					}));

	}

	addMetricSettings(containerEl: HTMLElement) {

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
		.setName('Number of Top Genres to show')
		.setDesc('Number of Top Genres to show in Metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.topGenresNumber))
			.onChange(async (value) => {
				this.plugin.settings.topGenresNumber = Number(value);
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
			.setName('Number of Top Directors to show')
			.setDesc('Number of Top D to show in Metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.topDirectorsNumber))
				.onChange(async (value) => {
					this.plugin.settings.topDirectorsNumber = Number(value);
					await this.plugin.saveSettings();
				}));

			new Setting(containerEl)
		.setName('Minimum number of movies for Metric ')
		.setDesc('Minimum number of movie for an Actor for Avg rating based metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.minMoviesForMetrics))
			.onChange(async (value) => {
				this.plugin.settings.minMoviesForMetrics = Number(value);
				await this.plugin.saveSettings();
			}));

			new Setting(containerEl)
			.setName('Number of Top Actors to show')
			.setDesc('Number of Top Actors to show in Metrics')
			.addText(text => text
				.setValue(String(this.plugin.settings.topActorsNumber))
				.onChange(async (value) => {
					this.plugin.settings.topActorsNumber = Number(value);
					await this.plugin.saveSettings();
				}));
	}

}
