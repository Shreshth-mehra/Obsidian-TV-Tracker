/**
 * TypeScript interfaces for Plugin-specific types
 */

export interface TVTrackerSettings {
	movieFolderPath: string;
	numberOfColumns: number;           
	numberOfResults: number;            
	toggleFittedImages: boolean;  
	hideLegend: boolean;
	hideMetrics: boolean;
	hideBudgetMetrics: boolean;
	hideGenreTasteIndexMetrics: boolean;           
	imageFolderPath: string;   
	apiKey: string;
	topGenresNumber: number;
	topActorsNumber: number;
	topDirectorsNumber: number;
	topYearsNumber: number;
	topProductionCompaniesNumber: number;
	topCollectionsNumber: number;
	showTrailerAndPosterLinks: boolean;
	topPerformersNumber: number;
	minMoviesForMetrics: number;
	minMoviesForMetricsDirectors: number;
	minMoviesForMetricsCollections: number;
	minMoviesForMetricsYears: number;
	movieMetricsHeadingColor: string;
	movieMetricsSubheadingColor: string;
	budgetMetricsSubheadingColor: string;
	movieCardColor: string;
	metricsHeading: string;
	defaultLanguageFilters: string;
	defaultPropertiesToShow: string;
	clickForInfo: boolean;
	showEPSeen: boolean;
	defaultSortingMode: string;
	maxMoviesFromCollection: number;
	themeMode: string;
	title: string;
	BlockBusterDefinition: number;
	countryAvailableOn: string;
}

export interface FilterState {
	selectedGenres: string[];
	selectedTypes: string[];
	selectedRating: number;
	selectedLanguages: string[];
	selectedProviders: string[];
	searchTerm: string;
	showWatchlist: boolean;
	sortOption: string;
	sortOrder: 'ascending' | 'descending';
}

export interface MetricsData {
	topGenres: [string, number][];
	topActors: [string, number][];
	topDirectors: [string, number][];
	topProductionCompanies: [string, number][];
	topCollections: [string, number][];
	topYears: [string, number][];
	totalDuration: string;
	totalTVDuration: string;
	totalActors: number;
	totalDirectors: number;
}

