import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { ItemView, WorkspaceLeaf } from "obsidian";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";
import fs from "fs/promises";
import { debug } from 'console';

export const VIEW_TV = "tv-view"

export class TVTracker extends ItemView {

    constructor(leaf, plugin, folderPath, imageFolderPath, numberOfColumns, numberOfResults, toggleFittedImages, apiKey, topActorsNumber, topGenresNumber, topDirectorsNumber, minMoviesForMetrics, movieCardColor, movieMetricsHeadingColor, movieMetricsSubheadingColor, themeMode) {
        super(leaf);
        this.plugin = plugin;
        this.movieFolderPath = folderPath;
        this.imageFolderPath = imageFolderPath;
        this.numberOfColumns = numberOfColumns;
        this.numberOfResults = numberOfResults;
        this.toggleFittedImages = toggleFittedImages;
        this.apiKey = apiKey;
        this.topActorsNumber = topActorsNumber;
        this.topGenresNumber = topGenresNumber;
        this.topDirectorsNumber = topDirectorsNumber;
        this.minMoviesForMetrics = minMoviesForMetrics;
        this.movieCardColor = movieCardColor;
        this.movieMetricsHeadingColor = movieMetricsHeadingColor;
        this.movieMetricsSubheadingColor = movieMetricsSubheadingColor;
        this.themeMode = themeMode;
    }

    getViewType() {
        return VIEW_TV;
    }

    getDisplayText() {
        return "TV tracker";
    }

    createMarkdownFile = async (filename, content) => {
        console.log("Creating");
        const filePath = `/${this.movieFolderPath}/${filename}.md`;
        console.log(filePath);
        console.log(content);
        await this.app.vault.create(filePath, content);
    }

    async onOpen() {
        try {

            const allFiles = this.plugin.app.vault.getMarkdownFiles();
            let debugInfo = `Movie Folder Path: ${this.movieFolderPath}\n`;

            const folderFiles = allFiles.filter(file => file.path.startsWith(this.movieFolderPath));
            let moviesData = [];

            for (let file of folderFiles) {
                const cache = this.app.metadataCache.getFileCache(file);
                // const content = await this.plugin.app.vault.read(file);
                // const parsed = matter(content);
                // moviesData.push(parsed.data);
                moviesData.push(cache?.frontmatter);
            }
            // console.log(moviesData);

            debugInfo = `folderFiles size; ${folderFiles.length}`
            // folderFiles.forEach(file => {

            //     debugInfo += `File Path: ${file.name}\n`;

            // });
            // this.displayDebugInfo(debugInfo);
            const root = createRoot(this.containerEl.children[1]);
            root.render(
                <React.StrictMode>
                    <ReactView moviesData={moviesData} createMarkdownFile={this.createMarkdownFile} numberOfColumns={this.numberOfColumns} numberOfResults={this.numberOfResults} toggleFittedImages={this.toggleFittedImages} apiKey={this.apiKey} topActorsNumber={this.topActorsNumber} topGenresNumber={this.topGenresNumber} topDirectorsNumber={this.topDirectorsNumber} minMoviesForMetrics={this.minMoviesForMetrics} movieCardColor={this.movieCardColor} movieMetricsHeadingColor={this.movieMetricsHeadingColor} movieMetricsSubheadingColor={this.movieMetricsSubheadingColor} themeMode={this.themeMode} />
                </React.StrictMode>
            );
        } catch (error) {
            console.error("Error reading file:", error);
            debugInfo += error;
            this.displayDebugInfo(debugInfo);
        }
    }

    displayDebugInfo(debugInfo) {
        // Create a debug container element if it doesn't already exist
        let debugContainer = this.containerEl.querySelector('.debug-container');
        if (!debugContainer) {
            debugContainer = this.containerEl.createEl('div', { cls: 'debug-container' });
        }

        // Set the text content to the debug info
        debugContainer.setText(debugInfo);

        // Style the debug container for visibility (optional)
        debugContainer.style.whiteSpace = 'pre-wrap'; // To respect newline characters
        debugContainer.style.color = 'red'; // Just as an example, you can choose any style
    }


    async onClose() {
        ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    }

    async readFileContents(filePath) {
        const fileContent = await fs.readFile(filePath, "utf-8");
        return fileContent;
    }

}
