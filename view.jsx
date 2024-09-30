import React from 'react';
import ReactDOM from 'react-dom';
import { ItemView } from "obsidian";
import { TFolder, TFile } from "obsidian";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";

export const VIEW_TV = "tv-view"

export class TVTracker extends ItemView {

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

        const filePath = `/${this.plugin.settings.movieFolderPath}/${filename}.md`;
        await this.app.vault.create(filePath, content);

    }

    async onOpen() {
        try {

            console.log("System theme is ", this.systemThemeMode);
            console.log("App theme mode is ", this.plugin.settings.themeMode);
            const folder = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.movieFolderPath);

            let moviesData = [];
            if (folder instanceof TFolder) {
                // Iterate through the children of the folder
                for (let file of folder.children) {
                    // Ensure the file is a markdown file
                    if (file instanceof TFile && file.extension === 'md') {
                        const cache = this.app.metadataCache.getFileCache(file);
                        if (cache?.frontmatter && cache.frontmatter["TMDB ID"]) {
                            let movieInfo = {
                                ...cache.frontmatter,
                                filePath: file.path
                            };
                            moviesData.push(movieInfo);
                        }
                    }
                }
            }

            const availableLanguages = Array.from(new Set(moviesData.map(movie => movie.original_language)));
            const languagesFromSettings = this.plugin.settings.defaultLanguageFilters.split(',').map(lang => lang.trim());
            const defaultLanguages = languagesFromSettings.filter(lang => availableLanguages.includes(lang));

            const availableProperties = Array.from(new Set(moviesData.flatMap(movie => Object.keys(movie))));
            const propertiesFromSettings = this.plugin.settings.defaultPropertiesToShow.split(',').map(prop => prop.trim());
            const defaultProperties = propertiesFromSettings.filter(prop => availableProperties.includes(prop));

            const root = createRoot(this.containerEl.children[1]);
            root.render(
                <React.StrictMode>
                    <ReactView moviesData={moviesData} createMarkdownFile={this.createMarkdownFile} themeMode={this.systemThemeMode} plugin={this.plugin} defaultLanguages={defaultLanguages} defaultProperties={defaultProperties} />
                </React.StrictMode>
            );
        } catch (error) {
            console.error("Error reading file:", error);
        }
    }

    async onClose() {
        ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    }

}
