/**
 * Default values for plugin settings
 */

import { TVTrackerSettings } from '../types/PluginTypes';

export const DEFAULT_SETTINGS: TVTrackerSettings = {
	movieFolderPath: 'Movies',
	numberOfColumns: 6,               
	numberOfResults: 3,               
	toggleFittedImages: true,  
	hideLegend: false, 
	hideMetrics: false,  
	hideBudgetMetrics: false,
	hideGenreTasteIndexMetrics: false,      
	imageFolderPath: 'Movies/Images',
	apiKey: '',
	topActorsNumber: 5,
	topDirectorsNumber: 5,
	topProductionCompaniesNumber: 5,
	topGenresNumber: 5,
	topCollectionsNumber: 5,
	topPerformersNumber: 5,
	topYearsNumber: 5,
	minMoviesForMetrics: 7,
	minMoviesForMetricsDirectors: 5,
	minMoviesForMetricsCollections: 3,
	minMoviesForMetricsYears: 5,
	movieMetricsHeadingColor: 'lightblue', 
	movieMetricsSubheadingColor: 'orange', 
	budgetMetricsSubheadingColor: '#DB6FFC',
	movieCardColor: 'inherit',
	metricsHeading: 'For Number geeks',
	showTrailerAndPosterLinks: true,
	defaultLanguageFilters: '',
	defaultPropertiesToShow: '',
	clickForInfo: true,
	showEPSeen: true,
	defaultSortingMode: 'Rating',
	maxMoviesFromCollection: 3,
	themeMode: 'Light',
	title: 'TV Tracker 🎬📽️',
	BlockBusterDefinition: 4.5,
	countryAvailableOn: 'US'
};

export const COLUMN_CONSTRAINTS = {
	MIN: 2,
	MAX: 6
} as const;

export const RATING_CONSTRAINTS = {
	MIN: 1,
	MAX: 5,
	STEP: 0.5
} as const;

export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w200';
export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const YOUTUBE_BASE_URL = 'https://www.youtube.com/watch?v=';

