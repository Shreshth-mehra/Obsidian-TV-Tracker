/**
 * Command definitions for the TV Tracker Plugin
 */

import { Notice } from 'obsidian';
import TVTrackerPlugin from '../../main';
import { SearchModal } from '../modals/SearchModal';

export interface CommandDefinition {
    id: string;
    name: string;
    callback: () => void | Promise<void>;
}

export class Commands {
    private plugin: TVTrackerPlugin;

    constructor(plugin: TVTrackerPlugin) {
        this.plugin = plugin;
    }

    /**
     * Get all command definitions
     */
    getCommands(): CommandDefinition[] {
        return [
            {
                id: 'add-episode-list',
                name: 'Add episode list for current file',
                callback: () => this.addEpisodeListCommand()
            },
            {
                id: 'update-current-file-episode-tracking',
                name: 'Update Episode tracking for current file',
                callback: () => this.updateEpisodeTrackingCommand()
            },
            {
                id: 'update-current-file-streaming',
                name: 'Update Streaming availability for current file',
                callback: () => this.updateStreamingCommand()
            },
            {
                id: 'update-current-file-data',
                name: 'Update current file with new data',
                callback: () => this.updateDataCommand()
            },
            {
                id: 'search-and-add-movie',
                name: 'Search and add movie/TV show',
                callback: () => this.searchAndAddCommand()
            }
        ];
    }

    /**
     * Add episode list for current file command
     */
    private addEpisodeListCommand(): void {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }
        console.log("Active file", activeFile);
        this.plugin.addEpisodeListToCurrentFile(activeFile);
    }

    /**
     * Update episode tracking for current file command
     */
    private async updateEpisodeTrackingCommand(): Promise<void> {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }
        await this.plugin.updateEPTrackingForFile(activeFile);
    }

    /**
     * Update streaming availability for current file command
     */
    private async updateStreamingCommand(): Promise<void> {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }
        await this.plugin.updateAvailableOnForFile(activeFile);
    }

    /**
     * Update current file with new data command
     */
    private async updateDataCommand(): Promise<void> {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active file found.');
            return;
        }
        await this.plugin.updateNewPropertiesForFile(activeFile);
    }

    /**
     * Search and add movie/TV show command
     */
    private searchAndAddCommand(): void {
        const modal = new SearchModal(this.plugin.app, this.plugin);
        modal.open();
    }
}
