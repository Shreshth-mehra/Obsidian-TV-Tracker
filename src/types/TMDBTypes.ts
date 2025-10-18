/**
 * TypeScript interfaces for TMDB API responses
 */

export interface TMDBGenre {
	id: number;
	name: string;
}

export interface TMDBProductionCompany {
	id: number;
	name: string;
	logo_path: string | null;
	origin_country: string;
}

export interface TMDBVideo {
	id: string;
	key: string;
	name: string;
	site: string;
	type: string;
	official: boolean;
}

export interface TMDBCollection {
	id: number;
	name: string;
	poster_path: string | null;
	backdrop_path: string | null;
}

export interface TMDBMovieDetails {
	id: number;
	title: string;
	original_title: string;
	original_language: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date: string;
	runtime: number | null;
	vote_average: number;
	vote_count: number;
	popularity: number;
	genres: TMDBGenre[];
	production_companies: TMDBProductionCompany[];
	budget: number;
	revenue: number;
	belongs_to_collection: TMDBCollection | null;
	videos?: {
		results: TMDBVideo[];
	};
}

export interface TMDBSeriesDetails {
	id: number;
	name: string;
	original_name: string;
	original_language: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	first_air_date: string;
	last_air_date: string;
	episode_run_time: number[];
	vote_average: number;
	vote_count: number;
	popularity: number;
	genres: TMDBGenre[];
	production_companies: TMDBProductionCompany[];
	number_of_episodes: number;
	number_of_seasons: number;
	status: string;
	in_production: boolean;
	last_episode_to_air?: {
		runtime: number;
	};
	videos?: {
		results: TMDBVideo[];
	};
}

export interface TMDBCastMember {
	id: number;
	name: string;
	character: string;
	profile_path: string | null;
	order: number;
}

export interface TMDBCrewMember {
	id: number;
	name: string;
	job: string;
	department: string;
	profile_path: string | null;
}

export interface TMDBCreditsResponse {
	id: number;
	cast: TMDBCastMember[];
	crew: TMDBCrewMember[];
}

export interface TMDBProvider {
	provider_id: number;
	provider_name: string;
	logo_path: string;
	display_priority: number;
}

export interface TMDBCountryProviders {
	link?: string;
	flatrate?: TMDBProvider[];
	rent?: TMDBProvider[];
	buy?: TMDBProvider[];
}

export interface TMDBProvidersResponse {
	id: number;
	results: {
		[countryCode: string]: TMDBCountryProviders;
	};
}

export interface TMDBSearchResult {
	id: number;
	title?: string;
	name?: string;
	media_type?: string;
	original_title?: string;
	original_name?: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	release_date?: string;
	first_air_date?: string;
	vote_average: number;
	popularity: number;
}

export interface TMDBSearchResponse {
	page: number;
	results: TMDBSearchResult[];
	total_pages: number;
	total_results: number;
}

export interface TMDBEpisode {
	episode_number: number;
	name: string;
	overview: string;
	air_date: string;
	runtime: number | null;
	season_number: number;
}

export interface TMDBSeasonDetails {
	id: number;
	season_number: number;
	name: string;
	overview: string;
	air_date: string;
	episodes: TMDBEpisode[];
}

export interface TMDBRecommendationsResponse {
	page: number;
	results: TMDBSearchResult[];
	total_pages: number;
	total_results: number;
}

export interface TMDBPersonDetails {
	id: number;
	name: string;
	biography: string;
	birthday: string | null;
	deathday: string | null;
	place_of_birth: string | null;
	profile_path: string | null;
	known_for_department: string;
}

export interface TMDBPersonMovieCredits {
	id: number;
	cast: Array<{
		id: number;
		title?: string;
		name?: string;
		release_date?: string;
		first_air_date?: string;
		character?: string;
		media_type: string;
	}>;
	crew: Array<{
		id: number;
		title?: string;
		name?: string;
		release_date?: string;
		first_air_date?: string;
		job?: string;
		media_type: string;
	}>;
}

