import React from 'react';
import { ItemView } from "obsidian";
import { TFile } from "obsidian";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";

export const VIEW_TV = "tv-view"

export class TVTracker extends ItemView {
    root = null;
    reactComponent = null;

    constructor(leaf, plugin, systemThemeMode) {
        super(leaf);
        this.plugin = plugin;
        this.systemThemeMode = systemThemeMode;
    }

    getViewType() {
        return VIEW_TV;
    }

    getDisplayText() {
        return "TV tracker";
    }

    createMarkdownFile = async (filename, content) => {
        // Remove invalid characters from filename
        const sanitizedFilename = filename.replace(/[*"\\/<>:|?]/g, '');
        const filePath = `/${this.plugin.settings.movieFolderPath}/${sanitizedFilename}.md`;
        await this.app.vault.create(filePath, content);
    }

    async refreshData() {
        try {
            console.log("Refreshing data for view");
            // Get the updated movie data
            const moviesData = await this.plugin.getMovieData();
            console.log("Got updated movie data, count:", moviesData.length);
            
            // Update the React component with the new data
            if (this.reactComponent && this.reactComponent.current) {
                console.log("Updating React component with new data");
                this.reactComponent.current.updateMoviesData(moviesData);
            } else {
                console.log("React component not available for update");
            }
        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }

    async onOpen() {
        try {
            console.log("Opening TV Tracker view");
            console.log("System theme is ", this.systemThemeMode);
            console.log("App theme mode is ", this.plugin.settings.themeMode);
            
            // Get the initial movie data
            const moviesData = await this.plugin.getMovieData();
            console.log("Initial movie data count:", moviesData.length);

            const availableLanguages = Array.from(new Set(moviesData.map(movie => movie.original_language)));
            const languagesFromSettings = this.plugin.settings.defaultLanguageFilters.split(',').map(lang => lang.trim());
            const defaultLanguages = languagesFromSettings.filter(lang => availableLanguages.includes(lang));

            const availableProperties = Array.from(new Set(moviesData.flatMap(movie => Object.keys(movie))));
            const propertiesFromSettings = this.plugin.settings.defaultPropertiesToShow.split(',').map(prop => prop.trim());
            const defaultProperties = propertiesFromSettings.filter(prop => availableProperties.includes(prop));

            // Create a reference to the React component
            const ReactComponentRef = React.forwardRef((props, ref) => {
                return <ReactView {...props} ref={ref} />;
            });

            this.root = createRoot(this.containerEl.children[1]);
            this.reactComponent = React.createRef();
            
            this.root.render(
                <React.StrictMode>
                    <ReactComponentRef 
                        ref={this.reactComponent}
                        moviesData={moviesData} 
                        createMarkdownFile={this.createMarkdownFile} 
                        themeMode={this.systemThemeMode} 
                        plugin={this.plugin} 
                        defaultLanguages={defaultLanguages} 
                        defaultProperties={defaultProperties} 
                    />
                </React.StrictMode>
            );
            
            // Register this view with the plugin for updates
            this.plugin.registerViewForUpdates(this);
            
            // Set up a file watcher for the movie folder
            this.setupFileWatcher();
            
            console.log("TV Tracker view opened successfully");
        } catch (error) {
            console.error("Error opening TV Tracker view:", error);
        }
    }
    
    setupFileWatcher() {
        // Register for file changes in the movie folder
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && 
                    file.path.startsWith(this.plugin.settings.movieFolderPath) && 
                    file.extension === 'md') {
                    await this.plugin.refreshAllViews();
                }
            })
        );
        
        // Register for file creation in the movie folder
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                if (file instanceof TFile && 
                    file.path.startsWith(this.plugin.settings.movieFolderPath) && 
                    file.extension === 'md') {
                    await this.plugin.refreshAllViews();
                }
            })
        );
        
        // Register for file deletion in the movie folder
        this.registerEvent(
            this.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && 
                    file.path.startsWith(this.plugin.settings.movieFolderPath) && 
                    file.extension === 'md') {
                    await this.plugin.refreshAllViews();
                }
            })
        );
    }

    async onClose() {
        console.log("Closing TV Tracker view");
        // Unregister this view from the plugin
        this.plugin.unregisterView(this);
        
        // Unmount the React component
        if (this.root) {
            this.root.unmount();
        }
    }
}
