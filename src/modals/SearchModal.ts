/**
 * Search Modal for finding and adding movies/TV shows to the library
 */

import { App, Modal, Notice, requestUrl } from 'obsidian';
import TVTrackerPlugin from '../../main';

export interface SearchResult {
    id: number;
    title: string;
    release_date?: string;
    overview: string;
    type: 'Movie' | 'Series';
    poster_path?: string;
}

export class SearchModal extends Modal {
    plugin: TVTrackerPlugin;
    searchInput: HTMLInputElement;
    resultsDiv: HTMLDivElement;
    loading: boolean;

    constructor(app: App, plugin: TVTrackerPlugin) {
        super(app);
        this.plugin = plugin;
        this.loading = false;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Create search input
        contentEl.createEl('h2', { text: 'Search Movie/TV Show' });
        
        const searchContainer = contentEl.createDiv({ cls: 'search-container' });
        this.searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Enter title or TMDB ID...'
        });

        // Create results container with flex layout
        this.resultsDiv = contentEl.createDiv({ cls: 'search-results' });
        this.resultsDiv.style.display = 'flex';
        this.resultsDiv.style.flexDirection = 'column';
        this.resultsDiv.style.gap = '20px';

        // Add search button
        const searchButton = searchContainer.createEl('button', {
            text: 'Search'
        });

        const performSearch = async () => {
            if (this.loading) return;
            this.loading = true;
            
            const query = this.searchInput.value.trim();
            this.resultsDiv.empty();
            this.resultsDiv.createEl('div', { text: 'Searching...' });

            try {
                let results = [];
                // Check if input is a TMDB ID
                if (/^\d+$/.test(query)) {
                    // Try searching as movie first
                    try {
                        const movieResponse = await requestUrl({
                            url: `https://api.themoviedb.org/3/movie/${query}?api_key=${this.plugin.settings.apiKey}`
                        });
                        if (movieResponse.status === 200) {
                            const data = movieResponse.json;
                            results = [{
                                id: data.id,
                                title: data.title,
                                release_date: data.release_date,
                                overview: data.overview,
                                type: 'Movie',
                                poster_path: data.poster_path
                            }];
                        }
                    } catch {
                        // If movie search fails, try TV show
                        try {
                            const tvResponse = await requestUrl({
                                url: `https://api.themoviedb.org/3/tv/${query}?api_key=${this.plugin.settings.apiKey}`
                            });
                            if (tvResponse.status === 200) {
                                const data = tvResponse.json;
                                results = [{
                                    id: data.id,
                                    title: data.name,
                                    release_date: data.first_air_date,
                                    overview: data.overview,
                                    type: 'Series',
                                    poster_path: data.poster_path
                                }];
                            }
                        } catch {
                            // Both searches failed
                            this.resultsDiv.empty();
                            this.resultsDiv.createEl('div', { text: 'No results found for this TMDB ID.' });
                            this.loading = false;
                            return;
                        }
                    }
                } else {
                    // Search by title
                    const movieResponse = await requestUrl({
                        url: `https://api.themoviedb.org/3/search/multi?api_key=${this.plugin.settings.apiKey}&query=${encodeURIComponent(query)}&page=1`
                    });
                    
                    if (movieResponse.status === 200) {
                        results = movieResponse.json.results
                            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                            .map((item: any) => ({
                                id: item.id,
                                title: item.media_type === 'movie' ? item.title : item.name,
                                release_date: item.media_type === 'movie' ? item.release_date : item.first_air_date,
                                overview: item.overview,
                                type: item.media_type === 'movie' ? 'Movie' : 'Series',
                                poster_path: item.poster_path
                            }))
                            .slice(0, this.plugin.settings.numberOfResults);
                    }
                }

                this.resultsDiv.empty();
                if (results.length === 0) {
                    this.resultsDiv.createEl('div', { text: 'No results found.' });
                } else {
                    results.forEach((result: SearchResult) => {
                        const resultDiv = this.resultsDiv.createDiv({ cls: 'search-result' });
                        resultDiv.style.display = 'flex';
                        resultDiv.style.gap = '20px';
                        resultDiv.style.marginBottom = '20px';
                        
                        // Add poster image if available
                        if (result.poster_path) {
                            const posterDiv = resultDiv.createDiv({ cls: 'poster' });
                            const posterImg = posterDiv.createEl('img', {
                                attr: {
                                    src: `https://image.tmdb.org/t/p/w200${result.poster_path}`,
                                    alt: `${result.title} poster`
                                }
                            });
                            posterImg.style.maxWidth = '100px';
                            posterImg.style.height = 'auto';
                        }

                        const contentDiv = resultDiv.createDiv({ cls: 'content' });
                        const titleEl = contentDiv.createEl('div', { 
                            text: `${result.title} (${result.type})` 
                        });
                        titleEl.style.fontWeight = 'bold';
                        
                        if (result.release_date) {
                            contentDiv.createEl('div', { 
                                text: `Release Date: ${result.release_date}` 
                            });
                        }
                        
                        contentDiv.createEl('div', { 
                            text: result.overview 
                        });

                        const addButton = contentDiv.createEl('button', {
                            text: 'Add to Library'
                        });

                        addButton.addEventListener('click', async () => {
                            await this.addToLibrary(result);
                            this.close();
                        });
                    });
                }
            } catch (error) {
                console.error('Search error:', error);
                this.resultsDiv.empty();
                this.resultsDiv.createEl('div', { text: 'An error occurred while searching.' });
            }
            
            this.loading = false;
        };

        // Add event listeners
        searchButton.addEventListener('click', performSearch);
        this.searchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                await performSearch();
            }
        });
    }

    async addToLibrary(result: SearchResult) {
        try {
            // Create a modal for status and rating input
            const statusModal = new Modal(this.app);
            statusModal.titleEl.setText('Set Status and Rating');
            
            const contentEl = statusModal.contentEl;
            contentEl.empty();
            
            // Create form elements
            const form = contentEl.createEl('form');
            
            // Status text input
            const statusContainer = form.createDiv({ cls: 'setting-item' });
            statusContainer.createEl('label', { text: 'Status' });
            const statusInput = statusContainer.createEl('input', {
                type: 'text',
                placeholder: 'Enter status (e.g., Watchlist, Watching, Completed)'
            });
            
            // Rating slider container
            const ratingContainer = form.createDiv({ cls: 'setting-item' });
            ratingContainer.createEl('label', { text: 'Rating' });
            
            // Create a container for the slider and value display
            const sliderContainer = ratingContainer.createDiv();
            sliderContainer.style.display = 'flex';
            sliderContainer.style.alignItems = 'center';
            sliderContainer.style.gap = '10px';
            
            // Create the slider
            const ratingSlider = sliderContainer.createEl('input', {
                type: 'range',
                attr: {
                    min: '1',
                    max: '5',
                    step: '0.5',
                    value: '1'
                }
            });
            ratingSlider.style.flex = '1';
            
            // Create the value display
            const ratingValue = sliderContainer.createEl('span', {
                text: '1.0'
            });
            ratingValue.style.minWidth = '40px';
            
            // Update the value display when slider changes
            ratingSlider.addEventListener('input', () => {
                ratingValue.setText(ratingSlider.value);
            });
            
            // Add some spacing
            form.createEl('div', { cls: 'setting-item-description' });
            
            // Submit button
            const submitButton = form.createEl('button', {
                text: 'Add to Library',
                cls: 'mod-cta'
            });
            
            // Handle form submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const status = statusInput.value.trim();
                const rating = parseFloat(ratingSlider.value);
                
                // Validate inputs
                if (!status) {
                    new Notice('Please enter a status');
                    return;
                }
                
                if (isNaN(rating) || rating < 1 || rating > 5) {
                    new Notice('Please select a valid rating between 1 and 5');
                    return;
                }
                
                statusModal.close();
                
                // Continue with adding to library
                const sanitizedTitle = result.title.replace(/[\\/:*?"<>|]/g, '');
                const fileName = `${sanitizedTitle}`;
                
                // Get additional details based on the type
                const endpoint = result.type === 'Movie' ? 'movie' : 'tv';
                const detailsResponse = await requestUrl({
                    url: `https://api.themoviedb.org/3/${endpoint}/${result.id}?api_key=${this.plugin.settings.apiKey}&append_to_response=credits,videos`
                });
                
                if (detailsResponse.status !== 200) {
                    throw new Error('Failed to fetch details');
                }
                
                const details = detailsResponse.json;
                
                // Get cast and director information
                const cast = details.credits.cast
                    .slice(0, 10) // Get top 10 cast members
                    .map((actor: any) => actor.name)
                    .join(', ');
                
                const directors = details.credits.crew
                    .filter((crew: any) => crew.job === 'Director')
                    .map((director: any) => director.name)
                    .join(', ');
                
                // Get trailer
                let trailer = '';
                if (details.videos && details.videos.results.length > 0) {
                    const trailerVideo = details.videos.results.find((video: any) => video.type === 'Trailer');
                    if (trailerVideo) {
                        trailer = `https://www.youtube.com/watch?v=${trailerVideo.key}`;
                    }
                }

                // Get production companies
                const productionCompanies = details.production_companies
                    .map((company: any) => company.name)
                    .join(', ');
                
                // Fetch streaming availability
                let streamingServices = '';
                try {
                    const streamingResponse = await requestUrl({
                        url: `https://api.themoviedb.org/3/${endpoint}/${result.id}/watch/providers?api_key=${this.plugin.settings.apiKey}`
                    });
                    
                    if (streamingResponse.status === 200) {
                        const streamingData = streamingResponse.json;
                        const countryCode = this.plugin.settings.countryAvailableOn;
                        const providers = streamingData.results[countryCode]?.flatrate || [];
                        streamingServices = providers.map((provider: any) => provider.provider_name).join(', ');
                    }
                } catch (error) {
                    console.error('Error fetching streaming availability:', error);
                    // Continue without streaming information
                }
                
                // Create YAML content
                const yaml = {
                    Title: `"${result.title}"`,
                    Rating: rating,
                    Status: status,
                    Type: result.type,
                    Poster: details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : '',
                    Genre: details.genres.map((g: any) => g.name).join(', '),
                    Duration: result.type === 'Movie' ? 
                        (details.runtime ? `${details.runtime} minutes` : '') :
                        (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} minutes` : ''),
                    "Avg vote": details.vote_average,
                    Popularity: details.popularity,
                    Cast: cast,
                    "TMDB ID": result.id,
                    Director: directors,
                    tags: "tvtracker, " + result.type,
                    original_language: `"${details.original_language}"`,
                    overview: `"${details.overview.replace(/"/g, '\\"')}"`,
                    trailer: `"${trailer}"`,
                    budget: details.budget || 0,
                    revenue: details.revenue || 0,
                    belongs_to_collection: details.belongs_to_collection ? `"${details.belongs_to_collection.name}"` : '""',
                    production_company: `"${productionCompanies}"`,
                    release_date: `"${details.release_date || details.first_air_date || ''}"`,
                    "Available On": streamingServices ? `"${streamingServices}"` : ''
                };
                
                if (result.type === 'Series') {
                    Object.assign(yaml, {
                        total_episodes: details.number_of_episodes,
                        total_seasons: details.number_of_seasons,
                        episodes_seen: 0,
                        episode_runtime: details.episode_run_time?.[0] || null,
                        next_episode: '',
                        air_date: `"${details.first_air_date || ''}"`,
                        last_episode_date: `"${details.last_air_date || ''}"`,
                        status: `"${details.status || ''}"`,
                        in_production: details.in_production ? "Yes" : "No"
                    });
                }
                
                // Create content with exact YAML format
                let content = '---\n';
                content += Object.entries(yaml)
                    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
                content += '\n---\n';
                
                // Add poster and trailer links
                if (details.poster_path) {
                    content += `\n![Poster](https://image.tmdb.org/t/p/original${details.poster_path})\n`;
                }
                if (trailer) {
                    content += `\n![Trailer](${trailer})\n`;
                }
                
                // For TV shows, add episodes section
                if (result.type === 'Series') {
                    content += '\n# Episodes\n';
                    for (let i = 1; i <= details.number_of_seasons; i++) {
                        const seasonResponse = await requestUrl({
                            url: `https://api.themoviedb.org/3/tv/${result.id}/season/${i}?api_key=${this.plugin.settings.apiKey}`
                        });
                        if (seasonResponse.status === 200) {
                            const seasonData = seasonResponse.json;
                            content += `\n## Season ${i}\n`;
                            seasonData.episodes.forEach((episode: any) => {
                                content += `- [ ] Episode ${episode.episode_number}: ${episode.name}\n`;
                            });
                        }
                    }
                }
                
                // Create the file
                const filePath = `${this.plugin.settings.movieFolderPath}/${fileName}.md`;
                await this.app.vault.create(filePath, content);
                new Notice(`Added ${result.title} to your library!`);
                
            });
            
            // Show the modal
            statusModal.open();
            
        } catch (error) {
            console.error('Error adding to library:', error);
            new Notice('Failed to add to library. Check console for details.');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
