# Phase 1 Migration Guide: Using the New Service Layer

This guide shows how to refactor existing code to use the new service layer created in Phase 1.

## Services Overview

### 1. TMDBService
Centralizes all TMDB API interactions.

### 2. FileService
Handles all Obsidian vault file operations.

### 3. YAMLService
Provides YAML formatting and parsing utilities.

### 4. ServiceFactory
Manages service instances and initialization.

---

## Quick Start

### Initialization in Plugin

In `main.ts`, initialize services on plugin load:

```typescript
import { ServiceFactory } from './src/utils/ServiceFactory';

async onload() {
    await this.loadSettings();
    
    // Initialize all services
    ServiceFactory.initializeAll(this.app, this.settings);
    
    // ... rest of your code
}
```

### Update services when settings change:

```typescript
async saveSettings() {
    await this.saveData(this.settings);
    ServiceFactory.updateSettings(this.settings);
}
```

---

## Migration Examples

### Example 1: Searching for Movies (Before & After)

**BEFORE (lines 1690-1750 in main.ts):**
```typescript
const movieResponse = await requestUrl({
    url: `https://api.themoviedb.org/3/search/multi?api_key=${this.plugin.settings.apiKey}&query=${encodeURIComponent(query)}&page=1`
});

if (movieResponse.status === 200) {
    results = movieResponse.json.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => ({
            id: item.id,
            title: item.media_type === 'movie' ? item.title : item.name,
            // ...
        }))
        .slice(0, this.plugin.settings.numberOfResults);
}
```

**AFTER (using TMDBService):**
```typescript
import { ServiceFactory } from './src/utils/ServiceFactory';

const tmdbService = ServiceFactory.getTMDBService();
const searchResponse = await tmdbService.searchMulti(query);

const results = searchResponse.results
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .slice(0, this.plugin.settings.numberOfResults);
```

**Benefits:**
- No manual URL construction
- Built-in error handling
- Type-safe responses
- Reusable across codebase

---

### Example 2: Getting Movie Details with Credits (Before & After)

**BEFORE (lines 1905-1926 in main.ts):**
```typescript
// Fetch detailed movie information
const detailsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}?api_key=${plugin.settings.apiKey}&append_to_response=videos`;
const detailsResponse = await requestUrl({ url: detailsUrl, method: 'GET' });
const detailsData = await detailsResponse.json;

const creditsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}/credits?api_key=${plugin.settings.apiKey}`;
const creditsResponse = await requestUrl({ url: creditsUrl, method: 'GET' });
const creditsData = await creditsResponse.json;

const providersUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}/watch/providers?api_key=${plugin.settings.apiKey}`;
const providersResponse = await requestUrl({ url: providersUrl, method: 'GET' });
const providersData = await providersResponse.json;
```

**AFTER (using TMDBService):**
```typescript
const tmdbService = ServiceFactory.getTMDBService();
const type = isTvShow ? 'tv' : 'movie';

// Single call gets all data
const { details, credits, providers } = await tmdbService.getFullDetails(
    selectedItem.id, 
    type
);

// Extract what you need
const trailer = TMDBService.extractTrailerUrl(details);
const directors = TMDBService.extractDirectors(credits);
const cast = TMDBService.extractCast(credits, 10);
const providerNames = TMDBService.extractProviderNames(providers, countryCode);
```

**Benefits:**
- Single method call for all data
- Parallel requests (faster)
- Built-in extraction helpers
- Type safety

---

### Example 3: Creating Movie Files (Before & After)

**BEFORE (lines 1961-2016 in main.ts):**
```typescript
const escapeDoubleQuotes = (str) => str.replace(/"/g, '\\"');
const movieYAML = `---
Title: "${detailsData.title || detailsData.name}" 
Rating: ${selectedMovieState.rating}
Status: "${selectedMovieState.status}"
// ... many more lines
---`;

let content = movieYAML;
if (showTrailerAndPosterLinks) {
    if (detailsData.poster_path) {
        content += `\n![Poster](${posterLink})`;
    }
    // ...
}

const fileName = `${title.replace(/[\/\\:]/g, '_')}`;
await createMarkdownFile(fileName, content);
```

**AFTER (using YAMLService):**
```typescript
import { YAMLService } from './src/services/YAMLService';
import { YAMLFrontmatter } from './src/types/MovieTypes';

const yaml: YAMLFrontmatter = {
    Title: details.title || details.name,
    Rating: selectedMovieState.rating,
    Status: selectedMovieState.status,
    Type: selectedMovieState.type,
    Poster: TMDBService.getPosterUrl(details.poster_path),
    Genre: TMDBService.formatGenres(details),
    // ... all other fields
};

const content = YAMLService.createFileContent(
    yaml,
    '', // body content
    showTrailerAndPosterLinks, // include poster
    showTrailerAndPosterLinks  // include trailer
);

const fileService = ServiceFactory.getFileService();
await fileService.createFile(details.title || details.name, content);
```

**Benefits:**
- Proper YAML escaping handled automatically
- Type-safe frontmatter
- Consistent formatting
- Reusable

---

### Example 4: Updating Episode Tracking (Before & After)

**BEFORE (lines 484-580 in main.ts):**
```typescript
async updateEPTracking() {
    const seriesFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
    if (!seriesFolder || !(seriesFolder as any).children) return;
    
    const files = (seriesFolder as any).children.filter((file: any) => file.extension === 'md');
    // ... lots of iteration and error handling code
    
    for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        const yaml = cache?.frontmatter;
        // ... processing
    }
}
```

**AFTER (using FileService):**
```typescript
async updateEPTracking() {
    const fileService = ServiceFactory.getFileService();
    const tmdbService = ServiceFactory.getTMDBService();
    
    const files = await fileService.getAllMovieFiles();
    
    const result = await fileService.batchOperation(
        files,
        async (file, index) => {
            const frontmatter = fileService.getFileFrontmatter(file);
            
            if (frontmatter?.Type !== 'Series' || !frontmatter['TMDB ID']) {
                return; // Skip non-series
            }
            
            const details = await tmdbService.getSeriesDetails(
                frontmatter['TMDB ID'],
                ['last_episode_to_air']
            );
            
            const updatedYaml = {
                ...frontmatter,
                total_episodes: details.number_of_episodes,
                total_seasons: details.number_of_seasons,
                episode_runtime: details.episode_run_time?.[0] || null,
                episodes_seen: frontmatter.episodes_seen ?? 0
            };
            
            await fileService.updateFileYAML(file, updatedYaml);
        },
        (current, total, success, errors) => {
            // Progress callback
            notice.setMessage(`Processed: ${current}/${total}, Success: ${success}, Errors: ${errors}`);
        }
    );
    
    new Notice(`Completed. Success: ${result.successCount}, Errors: ${result.errorCount}`);
}
```

**Benefits:**
- Built-in progress tracking
- Consistent error handling
- Cleaner code
- Reusable batch operation pattern

---

### Example 5: Getting All Movie Data (Before & After)

**BEFORE (lines 875-897 in main.ts):**
```typescript
async getMovieData(): Promise<any[]> {
    const folder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
    const moviesData = [];
    
    if (folder instanceof TFolder) {
        for (const file of folder.children) {
            if (file instanceof TFile && file.extension === 'md') {
                const cache = this.app.metadataCache.getFileCache(file);
                if (cache?.frontmatter && cache.frontmatter["TMDB ID"]) {
                    const movieInfo = {
                        ...cache.frontmatter,
                        filePath: file.path
                    };
                    moviesData.push(movieInfo);
                }
            }
        }
    }
    
    return moviesData;
}
```

**AFTER (using FileService):**
```typescript
async getMovieData(): Promise<MovieMetadata[]> {
    const fileService = ServiceFactory.getFileService();
    return await fileService.getAllMovieData();
}
```

**Benefits:**
- One line of code
- Type-safe return value
- Consistent with rest of codebase
- Easier to test

---

## Common Patterns

### Pattern 1: Search and Add Movie

```typescript
import { ServiceFactory } from './src/utils/ServiceFactory';
import { TMDBService } from './src/services/TMDBService';
import { YAMLService } from './src/services/YAMLService';

async addMovie(query: string, rating: number, status: string) {
    const tmdbService = ServiceFactory.getTMDBService();
    const fileService = ServiceFactory.getFileService();
    
    // Search
    const searchResults = await tmdbService.searchMovie(query);
    const firstResult = searchResults.results[0];
    
    // Get full details
    const { details, credits, providers } = await tmdbService.getFullDetails(
        firstResult.id,
        'movie'
    );
    
    // Create YAML
    const yaml = {
        Title: details.title,
        Rating: rating,
        Status: status,
        Type: 'Movie' as const,
        Poster: TMDBService.getPosterUrl(details.poster_path),
        Genre: TMDBService.formatGenres(details),
        Duration: `${details.runtime} minutes`,
        'Avg vote': details.vote_average,
        Popularity: details.popularity,
        Cast: TMDBService.extractCast(credits),
        'TMDB ID': details.id,
        Director: TMDBService.extractDirectors(credits),
        tags: 'tvtracker, Movie',
        original_language: details.original_language,
        overview: details.overview,
        trailer: TMDBService.extractTrailerUrl(details),
        budget: details.budget,
        revenue: details.revenue,
        belongs_to_collection: details.belongs_to_collection?.name || '',
        production_company: TMDBService.extractProductionCompanies(details),
        release_date: details.release_date,
        'Available On': TMDBService.extractProviderNames(providers, this.settings.countryAvailableOn)
    };
    
    // Create file
    const content = YAMLService.createFileContent(yaml, '', true, true);
    await fileService.createFile(details.title, content);
}
```

### Pattern 2: Bulk Update with Progress

```typescript
async bulkUpdateProperty(propertyName: string, updateFn: (file: TFile) => Promise<any>) {
    const fileService = ServiceFactory.getFileService();
    const files = await fileService.getAllMovieFiles();
    
    const notice = new Notice(`Processing 0/${files.length}`, 0);
    
    const result = await fileService.batchOperation(
        files,
        async (file) => {
            const frontmatter = fileService.getFileFrontmatter(file);
            const newValue = await updateFn(file);
            
            await fileService.updateFileYAML(file, {
                ...frontmatter,
                [propertyName]: newValue
            });
        },
        (current, total, success, errors) => {
            notice.setMessage(`Processing ${current}/${total} - Success: ${success}, Errors: ${errors}`);
        }
    );
    
    notice.hide();
    new Notice(`Complete! Success: ${result.successCount}, Errors: ${result.errorCount}`);
}
```

---

## Testing

Create a simple test to verify services work:

```typescript
// In console or a test file
import { ServiceFactory } from './src/utils/ServiceFactory';

// Test TMDB Service
const tmdbService = ServiceFactory.getTMDBService();
const results = await tmdbService.searchMovie('Inception');
console.log('Search results:', results.results.length);

// Test File Service
const fileService = ServiceFactory.getFileService();
const movies = await fileService.getAllMovieData();
console.log('Total movies:', movies.length);

// Test YAML Service
const yaml = {
    Title: 'Test Movie',
    Rating: 5,
    Type: 'Movie' as const,
    // ... other fields
};
const content = YAMLService.createFileContent(yaml);
console.log('Generated YAML:', content);
```

---

## Next Steps

1. **Replace existing TMDB API calls** with TMDBService methods
2. **Replace file operations** with FileService methods
3. **Replace YAML formatting** with YAMLService methods
4. **Remove duplicate code** as you refactor
5. **Add error handling** where needed
6. **Test thoroughly** after each refactor

---

## Benefits Summary

✅ **Type Safety** - Catch errors at compile time
✅ **Reusability** - Use services across the codebase
✅ **Consistency** - Same patterns everywhere
✅ **Maintainability** - Easier to update and debug
✅ **Testability** - Can mock services for testing
✅ **Performance** - Built-in optimizations (parallel requests, etc.)
✅ **Error Handling** - Centralized and consistent

---

Phase 1 Complete! 🎉

