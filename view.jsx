import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { ItemView, WorkspaceLeaf } from "obsidian";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";
import fs from "fs/promises";
import { debug } from 'console';

export const VIEW_TV = "tv-view"

export class TVTracker extends ItemView {

    constructor(leaf, plugin, folderPath, imageFolderPath, numberOfColumns, numberOfResults, toggleFittedImages, apiKey, topActorsNumber, topGenresNumber, topDirectorsNumber, minMoviesForMetrics, movieCardColor, movieMetricsHeadingColor, movieMetricsSubheadingColor, themeMode, metricsHeading) {
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
        this.metricsHeading = metricsHeading;
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
                moviesData.push(cache?.frontmatter);
            }

            debugInfo = `folderFiles size; ${folderFiles.length}`

            const root = createRoot(this.containerEl.children[1]);
            root.render(
                <React.StrictMode>
                    <ReactView moviesData={moviesData} createMarkdownFile={this.createMarkdownFile} numberOfColumns={this.numberOfColumns} numberOfResults={this.numberOfResults} toggleFittedImages={this.toggleFittedImages} apiKey={this.apiKey} topActorsNumber={this.topActorsNumber} topGenresNumber={this.topGenresNumber} topDirectorsNumber={this.topDirectorsNumber} minMoviesForMetrics={this.minMoviesForMetrics} movieCardColor={this.movieCardColor} movieMetricsHeadingColor={this.movieMetricsHeadingColor} movieMetricsSubheadingColor={this.movieMetricsSubheadingColor} themeMode={this.themeMode} metricsHeading={this.metricsHeading} />
                </React.StrictMode>
            );
        } catch (error) {
            console.error("Error reading file:", error);
            debugInfo += error;

        }
    }



    async onClose() {
        ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    }

    async readFileContents(filePath) {
        const fileContent = await fs.readFile(filePath, "utf-8");
        return fileContent;
    }

}
