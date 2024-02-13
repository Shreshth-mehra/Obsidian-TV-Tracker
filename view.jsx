import React from 'react';
import ReactDOM from 'react-dom';
import { ItemView } from "obsidian";
import { TFolder, TFile } from "obsidian";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";

export const VIEW_TV = "tv-view"

export class TVTracker extends ItemView {

    constructor(leaf, plugin, themeMode) {
        super(leaf);
        this.plugin = plugin;
        this.themeMode = themeMode;
        this.metricsHeading = metricsHeading;
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

            const folder = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.movieFolderPath);

            let moviesData = [];
            if (folder instanceof TFolder) {
                // Iterate through the children of the folder
                for (let file of folder.children) {
                    // Ensure the file is a markdown file
                    if (file instanceof TFile && file.extension === 'md') {
                        const cache = this.app.metadataCache.getFileCache(file);
                        let movieInfo = {
                            ...cache?.frontmatter,
                            filePath: file.path
                        };
                        moviesData.push(movieInfo);
                    }
                }
            }


            const root = createRoot(this.containerEl.children[1]);
            root.render(
                <React.StrictMode>
                    <ReactView moviesData={moviesData} createMarkdownFile={this.createMarkdownFile} themeMode={this.themeMode} plugin={this.plugin} />
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
