/**
 * Service for handling Obsidian vault file operations
 */

import { App, TFile, TFolder, Notice, CachedMetadata } from 'obsidian';
import { YAMLFrontmatter, MovieMetadata, Season, Episode } from '../types/MovieTypes';
import { YAMLService } from './YAMLService';

export class FileService {
	private app: App;
	private movieFolderPath: string;

	constructor(app: App, movieFolderPath: string) {
		this.app = app;
		this.movieFolderPath = movieFolderPath;
	}

	/**
	 * Update the movie folder path
	 */
	setMovieFolderPath(path: string): void {
		this.movieFolderPath = path;
	}

	/**
	 * Get all markdown files in the movie folder
	 */
	async getAllMovieFiles(): Promise<TFile[]> {
		const folder = this.app.vault.getAbstractFileByPath(this.movieFolderPath);
		
		if (!folder || !(folder instanceof TFolder)) {
			throw new Error(`Movie folder not found: ${this.movieFolderPath}`);
		}

		return folder.children.filter(
			(file): file is TFile => file instanceof TFile && file.extension === 'md'
		);
	}

	/**
	 * Get file metadata cache
	 */
	getFileCache(file: TFile): CachedMetadata | null {
		return this.app.metadataCache.getFileCache(file);
	}

	/**
	 * Get YAML frontmatter from a file
	 */
	getFileFrontmatter(file: TFile): any | null {
		const cache = this.getFileCache(file);
		return cache?.frontmatter || null;
	}

	/**
	 * Read file content
	 */
	async readFile(file: TFile): Promise<string> {
		return await this.app.vault.read(file);
	}

	/**
	 * Update file content
	 */
	async updateFile(file: TFile, content: string): Promise<void> {
		await this.app.vault.modify(file, content);
	}

	/**
	 * Create a new file
	 */
	async createFile(filename: string, content: string): Promise<TFile> {
		const sanitizedFilename = YAMLService.sanitizeFilename(filename);
		const filePath = `${this.movieFolderPath}/${sanitizedFilename}.md`;
		
		return await this.app.vault.create(filePath, content);
	}

	/**
	 * Delete a file
	 */
	async deleteFile(file: TFile): Promise<void> {
		await this.app.vault.delete(file);
	}

	/**
	 * Update YAML frontmatter in a file
	 */
	async updateFileYAML(file: TFile, yaml: YAMLFrontmatter): Promise<void> {
		const content = await this.readFile(file);
		const updatedContent = YAMLService.updateYAMLInContent(content, yaml);
		await this.updateFile(file, updatedContent);
	}

	/**
	 * Get all movie data from files
	 */
	async getAllMovieData(): Promise<MovieMetadata[]> {
		const files = await this.getAllMovieFiles();
		const moviesData: MovieMetadata[] = [];

		for (const file of files) {
			const frontmatter = this.getFileFrontmatter(file);
			
			if (frontmatter && frontmatter["TMDB ID"]) {
				moviesData.push({
					...frontmatter,
					filePath: file.path
				});
			}
		}

		return moviesData;
	}

	/**
	 * Open a file in Obsidian
	 */
	async openFile(filePath: string, newLeaf: boolean = true): Promise<void> {
		await this.app.workspace.openLinkText(filePath, '/', newLeaf);
	}

	/**
	 * Check if a file exists
	 */
	fileExists(path: string): boolean {
		const file = this.app.vault.getAbstractFileByPath(path);
		return file instanceof TFile;
	}

	/**
	 * Add episode list to a series file
	 */
	async addEpisodeListToFile(file: TFile, seasons: Season[]): Promise<void> {
		const content = await this.readFile(file);
		
		// Parse existing content to find existing seasons
		const existingSeasons = this.parseExistingEpisodes(content);
		
		// Build new content
		let newContent = content;
		
		// Add Episodes heading if it doesn't exist
		if (!newContent.includes('# Episodes')) {
			newContent += '\n# Episodes\n';
		}

		let hasNewContent = false;

		for (const season of seasons) {
			if (season.season_number <= 0) continue;

			const existingEpisodes = existingSeasons.get(season.season_number) || new Set<number>();
			const newEpisodes: Episode[] = [];

			// Find new episodes
			for (const episode of season.episodes) {
				if (!existingEpisodes.has(episode.episode_number)) {
					newEpisodes.push(episode);
				}
			}

			if (newEpisodes.length > 0) {
				hasNewContent = true;
				const seasonContent = newEpisodes
					.map(ep => `- [ ] Episode ${ep.episode_number}: ${ep.name}`)
					.join('\n');

				if (existingSeasons.has(season.season_number)) {
					// Append to existing season
					const seasonHeaderRegex = new RegExp(`## Season ${season.season_number}[^#]*`);
					const seasonMatch = newContent.match(seasonHeaderRegex);
					
					if (seasonMatch && seasonMatch.index !== undefined) {
						const insertPosition = seasonMatch.index + seasonMatch[0].length;
						newContent = newContent.slice(0, insertPosition) + 
									'\n' + seasonContent + 
									newContent.slice(insertPosition);
					}
				} else {
					// Add new season
					newContent += `\n## Season ${season.season_number}\n${seasonContent}\n`;
				}
			}
		}

		if (hasNewContent) {
			await this.updateFile(file, newContent);
			new Notice('New episodes added successfully.');
		} else {
			new Notice('No new episodes found to add.');
		}
	}

	/**
	 * Parse existing episodes from file content
	 */
	private parseExistingEpisodes(content: string): Map<number, Set<number>> {
		const existingSeasons = new Map<number, Set<number>>();
		const lines = content.split('\n');
		let currentSeason: number | null = null;

		for (const line of lines) {
			const seasonMatch = line.match(/^## Season (\d+)/);
			if (seasonMatch) {
				currentSeason = parseInt(seasonMatch[1]);
				existingSeasons.set(currentSeason, new Set());
				continue;
			}

			if (currentSeason !== null) {
				const episodeMatch = line.match(/Episode (\d+):/);
				if (episodeMatch) {
					const episodeNum = parseInt(episodeMatch[1]);
					existingSeasons.get(currentSeason)?.add(episodeNum);
				}
			}
		}

		return existingSeasons;
	}

	/**
	 * Add or remove trailer and poster links
	 */
	async updateTrailerAndPosterLinks(
		file: TFile, 
		add: boolean,
		poster?: string,
		trailer?: string
	): Promise<void> {
		let content = await this.readFile(file);

		if (!poster && !trailer) {
			const frontmatter = this.getFileFrontmatter(file);
			poster = frontmatter?.Poster;
			trailer = frontmatter?.trailer;
		}

		if (add) {
			// Add links
			if (poster) {
				const posterLink = `![Poster](${poster})`;
				if (!content.includes(posterLink)) {
					content += `\n${posterLink}`;
				}
			}
			if (trailer) {
				const trailerLink = `![Trailer](${trailer})`;
				if (!content.includes(trailerLink)) {
					content += `\n${trailerLink}`;
				}
			}
		} else {
			// Remove links
			if (poster) {
				const posterLink = `![Poster](${poster})`;
				content = content.replace(`${posterLink}\n`, '');
				content = content.replace(posterLink, '');
			}
			if (trailer) {
				const trailerLink = `![Trailer](${trailer})`;
				content = content.replace(`${trailerLink}\n`, '');
				content = content.replace(trailerLink, '');
			}
		}

		await this.updateFile(file, content);
	}

	/**
	 * Batch file operation with progress tracking
	 */
	async batchOperation<T>(
		files: TFile[],
		operation: (file: TFile, index: number) => Promise<T>,
		progressCallback?: (current: number, total: number, success: number, errors: number) => void
	): Promise<{ results: T[], successCount: number, errorCount: number, errors: Error[] }> {
		const results: T[] = [];
		const errors: Error[] = [];
		let successCount = 0;
		let errorCount = 0;

		for (let i = 0; i < files.length; i++) {
			try {
				const result = await operation(files[i], i);
				results.push(result);
				successCount++;
			} catch (error) {
				console.error(`Error processing file ${files[i].path}:`, error);
				errors.push(error);
				errorCount++;
			}

			if (progressCallback) {
				progressCallback(i + 1, files.length, successCount, errorCount);
			}
		}

		return { results, successCount, errorCount, errors };
	}

	/**
	 * Create a backup of a file
	 */
	async backupFile(file: TFile): Promise<TFile> {
		const content = await this.readFile(file);
		const backupPath = file.path.replace('.md', `.backup-${Date.now()}.md`);
		return await this.app.vault.create(backupPath, content);
	}
}

