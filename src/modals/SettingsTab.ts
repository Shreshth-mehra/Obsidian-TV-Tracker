/**
 * Settings Tab for the TV Tracker Plugin
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import TVTrackerPlugin from '../../main';
import { TMDB_COUNTRIES } from '../../countries';

export class TVTrackerSettingsTab extends PluginSettingTab {
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
