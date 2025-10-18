/**
 * Operation to add or remove trailer and poster links from files
 */

import { TFile } from 'obsidian';
import { BulkOperationBase, OperationConfig } from './BulkOperationBase';
import { FileService } from '../services/FileService';
import { TMDBService } from '../services/TMDBService';

export class UpdateTrailerLinksOperation extends BulkOperationBase {
	private addLinks: boolean;

	constructor(
		fileService: FileService, 
		tmdbService: TMDBService, 
		addLinks: boolean = true
	) {
		const action = addLinks ? 'Adding' : 'Removing';
		const config: OperationConfig = {
			noticeTitle: `${action} Trailer and Poster Links`,
			successMessage: `Links ${addLinks ? 'added' : 'removed'} successfully`,
			errorMessage: `Link operation completed with errors`
		};
		
		super(fileService, tmdbService, config);
		this.addLinks = addLinks;
	}

	/**
	 * Process a single file
	 */
	protected async processFile(file: TFile): Promise<void> {
		const frontmatter = await this.getFileFrontmatter(file);
		
		if (this.shouldSkipFile(frontmatter)) {
			throw new Error('Missing required fields');
		}

		const poster = frontmatter.Poster;
		const trailer = frontmatter.trailer;

		if (!poster && !trailer) {
			throw new Error('No poster or trailer found in frontmatter');
		}

		// Use FileService to update links
		await this.fileService.updateTrailerAndPosterLinks(
			file,
			this.addLinks,
			poster,
			trailer
		);
	}

	/**
	 * Set whether to add or remove links
	 */
	setAddLinks(add: boolean): void {
		this.addLinks = add;
		this.config.noticeTitle = add 
			? 'Adding Trailer and Poster Links'
			: 'Removing Trailer and Poster Links';
		this.config.successMessage = `Links ${add ? 'added' : 'removed'} successfully`;
	}
}

