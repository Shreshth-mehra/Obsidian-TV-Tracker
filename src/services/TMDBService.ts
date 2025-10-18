/**
 * Service for interacting with The Movie Database (TMDB) API
 */

import { requestUrl } from 'obsidian';
import {
	TMDBMovieDetails,
	TMDBSeriesDetails,
	TMDBCreditsResponse,
	TMDBProvidersResponse,
	TMDBSearchResponse,
	TMDBSeasonDetails,
	TMDBRecommendationsResponse,
	TMDBPersonDetails,
	TMDBPersonMovieCredits
} from '../types/TMDBTypes';
import { TMDB_API_BASE_URL } from '../constants/defaults';

export class TMDBService {
	private apiKey: string;

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	/**
	 * Update the API key
	 */
	setApiKey(apiKey: string): void {
		this.apiKey = apiKey;
	}

	/**
	 * Build API URL with query parameters
	 */
	private buildUrl(endpoint: string, params: Record<string, string> = {}): string {
		const url = new URL(`${TMDB_API_BASE_URL}${endpoint}`);
		url.searchParams.append('api_key', this.apiKey);
		
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, value);
		}
		
		return url.toString();
	}

	/**
	 * Make a GET request to TMDB API
	 */
	private async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
		const url = this.buildUrl(endpoint, params);
		
		try {
			const response = await requestUrl({
				url,
				method: 'GET',
			});
			
			if (response.status !== 200) {
				throw new Error(`TMDB API returned status ${response.status}`);
			}
			
			return response.json as T;
		} catch (error) {
			console.error(`TMDB API Error for ${endpoint}:`, error);
			throw new Error(`Failed to fetch from TMDB: ${error.message}`);
		}
	}

	/**
	 * Search for movies
	 */
	async searchMovie(query: string, page: number = 1): Promise<TMDBSearchResponse> {
		return this.get<TMDBSearchResponse>('/search/movie', {
			query: encodeURIComponent(query),
			page: page.toString()
		});
	}

	/**
	 * Search for TV series
	 */
	async searchSeries(query: string, page: number = 1): Promise<TMDBSearchResponse> {
		return this.get<TMDBSearchResponse>('/search/tv', {
			query: encodeURIComponent(query),
			page: page.toString()
		});
	}

	/**
	 * Search for both movies and TV shows
	 */
	async searchMulti(query: string, page: number = 1): Promise<TMDBSearchResponse> {
		return this.get<TMDBSearchResponse>('/search/multi', {
			query: encodeURIComponent(query),
			page: page.toString()
		});
	}

	/**
	 * Get movie details by ID
	 */
	async getMovieDetails(movieId: number, appendToResponse: string[] = []): Promise<TMDBMovieDetails> {
		const params: Record<string, string> = {};
		
		if (appendToResponse.length > 0) {
			params.append_to_response = appendToResponse.join(',');
		}
		
		return this.get<TMDBMovieDetails>(`/movie/${movieId}`, params);
	}

	/**
	 * Get TV series details by ID
	 */
	async getSeriesDetails(seriesId: number, appendToResponse: string[] = []): Promise<TMDBSeriesDetails> {
		const params: Record<string, string> = {};
		
		if (appendToResponse.length > 0) {
			params.append_to_response = appendToResponse.join(',');
		}
		
		return this.get<TMDBSeriesDetails>(`/tv/${seriesId}`, params);
	}

	/**
	 * Get credits (cast and crew) for a movie or TV show
	 */
	async getCredits(id: number, type: 'movie' | 'tv'): Promise<TMDBCreditsResponse> {
		return this.get<TMDBCreditsResponse>(`/${type}/${id}/credits`);
	}

	/**
	 * Get watch providers for a movie or TV show
	 */
	async getWatchProviders(id: number, type: 'movie' | 'tv'): Promise<TMDBProvidersResponse> {
		return this.get<TMDBProvidersResponse>(`/${type}/${id}/watch/providers`);
	}

	/**
	 * Get season details for a TV show
	 */
	async getSeasonDetails(seriesId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
		return this.get<TMDBSeasonDetails>(`/tv/${seriesId}/season/${seasonNumber}`);
	}

	/**
	 * Get all seasons for a TV show
	 */
	async getAllSeasons(seriesId: number, totalSeasons: number): Promise<TMDBSeasonDetails[]> {
		const seasonPromises: Promise<TMDBSeasonDetails>[] = [];
		
		for (let i = 1; i <= totalSeasons; i++) {
			seasonPromises.push(this.getSeasonDetails(seriesId, i));
		}
		
		return Promise.all(seasonPromises);
	}

	/**
	 * Get recommendations for a movie or TV show
	 */
	async getRecommendations(id: number, type: 'movie' | 'tv', page: number = 1): Promise<TMDBRecommendationsResponse> {
		return this.get<TMDBRecommendationsResponse>(`/${type}/${id}/recommendations`, {
			page: page.toString()
		});
	}

	/**
	 * Get person details by ID
	 */
	async getPersonDetails(personId: number): Promise<TMDBPersonDetails> {
		return this.get<TMDBPersonDetails>(`/person/${personId}`);
	}

	/**
	 * Get person's movie and TV credits
	 */
	async getPersonCredits(personId: number): Promise<TMDBPersonMovieCredits> {
		return this.get<TMDBPersonMovieCredits>(`/person/${personId}/combined_credits`);
	}

	/**
	 * Get movie or series details with all related information
	 */
	async getFullDetails(id: number, type: 'movie' | 'tv'): Promise<{
		details: TMDBMovieDetails | TMDBSeriesDetails;
		credits: TMDBCreditsResponse;
		providers: TMDBProvidersResponse;
	}> {
		const detailsPromise = type === 'movie' 
			? this.getMovieDetails(id, ['videos'])
			: this.getSeriesDetails(id, ['videos', 'last_episode_to_air']);
			
		const creditsPromise = this.getCredits(id, type);
		const providersPromise = this.getWatchProviders(id, type);

		const [details, credits, providers] = await Promise.all([
			detailsPromise,
			creditsPromise,
			providersPromise
		]);

		return { details, credits, providers };
	}

	/**
	 * Extract trailer URL from video results
	 */
	static extractTrailerUrl(details: TMDBMovieDetails | TMDBSeriesDetails): string {
		if (!details.videos || !details.videos.results.length) {
			return '';
		}

		const trailer = details.videos.results.find(video => video.type === 'Trailer');
		if (!trailer) {
			return '';
		}

		return `https://www.youtube.com/watch?v=${trailer.key}`;
	}

	/**
	 * Extract streaming provider names for a specific country
	 */
	static extractProviderNames(providersResponse: TMDBProvidersResponse, countryCode: string): string {
		const countryData = providersResponse.results[countryCode];
		if (!countryData || !countryData.flatrate) {
			return '';
		}

		return countryData.flatrate.map(provider => provider.provider_name).join(', ');
	}

	/**
	 * Extract director names from credits
	 */
	static extractDirectors(credits: TMDBCreditsResponse): string {
		const directors = credits.crew.filter(member => member.job === 'Director');
		return directors.map(director => director.name).join(', ');
	}

	/**
	 * Extract top cast members
	 */
	static extractCast(credits: TMDBCreditsResponse, limit: number = 10): string {
		return credits.cast
			.slice(0, limit)
			.map(actor => actor.name)
			.join(', ');
	}

	/**
	 * Extract production companies
	 */
	static extractProductionCompanies(details: TMDBMovieDetails | TMDBSeriesDetails, limit: number = 2): string {
		if (!details.production_companies || details.production_companies.length === 0) {
			return '';
		}

		return details.production_companies
			.slice(0, limit)
			.map(company => company.name)
			.join(', ');
	}

	/**
	 * Format genres as comma-separated string
	 */
	static formatGenres(details: TMDBMovieDetails | TMDBSeriesDetails): string {
		return details.genres.map(genre => genre.name).join(', ');
	}

	/**
	 * Get poster URL
	 */
	static getPosterUrl(posterPath: string | null, size: 'original' | 'w200' = 'original'): string {
		if (!posterPath) return '';
		return `https://image.tmdb.org/t/p/${size}${posterPath}`;
	}

	/**
	 * Validate API key format
	 */
	static isValidApiKey(apiKey: string): boolean {
		return !!apiKey && apiKey.length === 32 && /^[a-f0-9]+$/.test(apiKey);
	}
}

