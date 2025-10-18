/**
 * TypeScript interfaces for Movie/Series data structures
 */

export interface MovieMetadata {
	Title: string;
	Rating: number;
	Status: string;
	Type: 'Movie' | 'Series';
	Poster: string;
	Genre: string;
	Duration?: string;
	'Avg vote': number;
	Popularity: number;
	Cast: string;
	'TMDB ID': number;
	Director: string;
	tags: string;
	original_language: string;
	overview: string;
	trailer: string;
	budget?: number;
	revenue?: number;
	belongs_to_collection?: string;
	production_company: string;
	release_date?: string;
	'Available On'?: string;
	filePath?: string;
}

export interface SeriesMetadata extends MovieMetadata {
	Type: 'Series';
	total_episodes: number;
	total_seasons: number;
	episodes_seen: number;
	episode_runtime: number;
	next_episode?: string;
	air_date?: string;
	last_episode_date?: string;
	status?: string;
	in_production?: string;
}

export interface YAMLFrontmatter {
	Title: string;
	Rating: number;
	Status: string;
	Type: 'Movie' | 'Series';
	Poster: string;
	Genre: string;
	Duration?: string;
	'Avg vote': number;
	Popularity: number;
	Cast: string;
	'TMDB ID': number;
	Director: string;
	tags: string;
	original_language: string;
	overview: string;
	trailer: string;
	budget?: number | null;
	revenue?: number | null;
	belongs_to_collection?: string;
	production_company: string;
	release_date?: string;
	'Available On'?: string;
	// Series-specific fields
	total_episodes?: number;
	total_seasons?: number;
	episodes_seen?: number;
	episode_runtime?: number | null;
	next_episode?: string;
	air_date?: string;
	last_episode_date?: string;
	status?: string;
	in_production?: string;
	// Additional optional fields
	'First Air Date'?: string;
	[key: string]: any; // Allow additional properties
}

export interface Season {
	season_number: number;
	episodes: Episode[];
}

export interface Episode {
	episode_number: number;
	name: string;
}

export interface MovieInput {
	name: string;
	rating: number;
	status: string;
	type: 'Movie' | 'Series';
}

export interface CreateMovieFileData {
	tmdbDetails: any;
	rating: number;
	status: string;
	type: 'Movie' | 'Series';
	credits: any;
	streamingProviders?: string;
}

export interface BulkOperationResult {
	success: number;
	errors: number;
	total: number;
	errorMessages?: string[];
}

