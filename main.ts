import { App, Plugin, PluginSettingTab, Setting} from 'obsidian';
import { TVTracker,VIEW_TV } from 'view';


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
}

const DEFAULT_TV_SETTINGS: TVTrackerSettings = {
	
	movieFolderPath: 'Movies',
	numberOfColumns: 6,               
    numberOfResults: 3,               
    toggleFittedImages: true,         
    imageFolderPath: 'Movies/Images',
	apiKey :'' ,
	topActorsNumber:5,
	topDirectorsNumber:5,
	topGenresNumber:5,
	minMoviesForMetrics:7,
	movieMetricsHeadingColor: 'lightblue', 
    movieMetricsSubheadingColor: 'orange', 
	movieCardColor: 'inherit'

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

		this.registerView(VIEW_TV, (leaf) => new TVTracker(leaf,this, this.themeMode));
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
		const view = new TVTracker(leaf,this, this.themeMode);
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


	addStyleSettings(containerEl: HTMLElement) {

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
        .setName('Color for movie metrics subheadings')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics subheadings.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsSubheadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsSubheadingColor = value;
                await this.plugin.saveSettings();
            }));

   
	new Setting(containerEl)
        .setName('Color for movie metrics heading')
        .setDesc('Enter as a hex code. Choose a color for the movie metrics heading.')
        .addText(text => text
            .setValue(this.plugin.settings.movieMetricsHeadingColor)
            .onChange(async (value) => {
                this.plugin.settings.movieMetricsHeadingColor = value;
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
		.setName('Number of top genres to show')
		.setDesc('Number of top genres to show in metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.topGenresNumber))
			.onChange(async (value) => {
				this.plugin.settings.topGenresNumber = Number(value);
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
		.setName('Minimum number of movies for metric ')
		.setDesc('Minimum number of movie for an actor for avg rating based metrics')
		.addText(text => text
			.setValue(String(this.plugin.settings.minMoviesForMetrics))
			.onChange(async (value) => {
				this.plugin.settings.minMoviesForMetrics = Number(value);
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
	}

}
