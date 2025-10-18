# Phase 2 Migration Guide: Refactoring Bulk Operations

This guide shows how to refactor existing bulk operations in `main.ts` to use the new operations system.

## Quick Migration Steps

1. **Initialize the OperationRegistry** once in your plugin
2. **Replace existing methods** with registry calls
3. **Remove old code** after testing

---

## Step 1: Initialize OperationRegistry

### In your plugin's `onload()`:

```typescript
import { createOperationRegistry, OperationRegistry } from './src/operations';
import { ServiceFactory } from './src/utils/ServiceFactory';

export default class TVTrackerPlugin extends Plugin {
	private operationRegistry: OperationRegistry;

	async onload() {
		await this.loadSettings();
		
		// Initialize services
		ServiceFactory.initializeAll(this.app, this.settings);
		
		// Create operation registry
		this.operationRegistry = createOperationRegistry(
			ServiceFactory.getFileService(),
			ServiceFactory.getTMDBService()
		);
		
		// ... rest of code
	}
}
```

---

## Step 2: Refactor Each Method

### Method 1: updateEPTracking()

**Before (lines 484-580 in main.ts):**
```typescript
async updateEPTracking() {
	// Get all series files
	const seriesFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
	if (!seriesFolder || !(seriesFolder as any).children) return;

	const files = (seriesFolder as any).children.filter((file: any) => file.extension === 'md');
	let iteration = 0;
	let successCount = 0;
	let errorCount = 0;
	const updateFilesNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);
	const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');
	
	for (const file of files) {
		iteration++;
		const filePath = file.path;
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			errorCount++;
			console.error("YAML front matter not found in file:", file.path)
			continue;
		}

		const type = yaml.Type;
		const tmdbId = yaml["TMDB ID"];

		if (type !== 'Series' || !tmdbId) {
			continue;
		}
		
		const response = await requestUrl({
			url: `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=last_episode_to_air`,
			method: 'GET',
		});

		if (response.status !== 200) {
			errorCount++;
			console.error("Bad response from TMDB", file.path)
			continue;
		}

		const data = response.json;
		const totalEpisodes = data.number_of_episodes;
		const totalSeasons = data.number_of_seasons;
		let episode_runtime = data.episode_run_time && data.episode_run_time.length > 0 ? data.episode_run_time[0] : null;

		if (!episode_runtime && data.last_episode_to_air) {
			episode_runtime = data.last_episode_to_air.runtime;
		}
	
		let updatedYaml = {}
		
		// Only add episodes_seen if it doesn't already exist
		if (!('episodes_seen' in yaml)) {
			updatedYaml = {
				...yaml,
				total_episodes: totalEpisodes,
				total_seasons: totalSeasons,
				episode_runtime: episode_runtime,
				episodes_seen: 0
			};
		}
		else {
			updatedYaml = {
				...yaml,
				total_episodes: totalEpisodes,
				total_seasons: totalSeasons,
				episode_runtime: episode_runtime
			};
		}

		const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
			const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
			return `${key}: ${escapedValue}`;
		}).join('\n')}\n---`;

		const fileContent = await this.app.vault.read(file);
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

		if (yamlRegex.test(fileContent)) {
			const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
			await this.app.vault.modify(file, updatedFileContent);
			successCount++;
		} else {
			console.error("YAML front matter not found in file:", file.path);
			errorCount++;
		}

		updateFilesNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
	}

	updateFilesNotice.setMessage(`Processing Complete. New properties added for ${successCount} files. ${errorCount} files encountered errors.`);
	setTimeout(() => updateFilesNotice.hide(), 3000);
}
```

**After (using operations):**
```typescript
async updateEPTracking(): Promise<void> {
	await this.operationRegistry.updateEpisodeTracking();
}
```

**Reduction:** 97 lines → 3 lines! 🎉

---

### Method 2: updateAvailableOn()

**Before (lines 582-672 in main.ts):**
```typescript
async updateAvailableOn() {
	const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
	if (!movieFolder || !(movieFolder as any).children) return;

	const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
	const filesToProcess = files;
	
	let successCount = 0;
	let errorCount = 0;
	const updateFilesNotice = new Notice(`Processed files: ${successCount}/${filesToProcess.length}\n Errors: ${errorCount}`, 0);
	const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');

	for (const file of filesToProcess) {
		try {
			const cache = this.app.metadataCache.getFileCache(file);
			const yaml = cache?.frontmatter;

			if (!yaml) {
				errorCount++;
				console.error("YAML front matter not found in file:", file.path);
				continue;
			}

			const tmdbId = yaml["TMDB ID"];
			const type = yaml.Type;

			if (!tmdbId) {
				console.log("Skipping file - no TMDB ID found:", file.path);
				continue;
			}

			const endpoint = type === 'Movie' ? 'movie' : 'tv';
			let response;
			try {
				response = await requestUrl({
					url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}/watch/providers?api_key=${this.settings.apiKey}`,
				});
			} catch (error) {
				console.error(`API call failed for file ${file.path}:`, error);
				errorCount++;
				continue;
			}
			
			if (response.status !== 200) {
				console.error(`Bad response from TMDB for file ${file.path}. Status: ${response.status}`);
				errorCount++;
				continue;
			}

			const data = response.json;
			const countryCode = this.settings.countryAvailableOn;
			const providers = data.results[countryCode]?.flatrate || [];

			const providerNames = providers.map((provider: any) => provider.provider_name).join(', ');
			
			let updatedYaml = {
				...yaml,
				"Available On": providerNames || ''
			};

			const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => {
				const escapedValue = typeof value === 'string' ? `"${escapeDoubleQuotes(value)}"` : value;
				return `${key}: ${escapedValue}`;
			}).join('\n')}\n---`;

			const fileContent = await this.app.vault.read(file);
			const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

			if (yamlRegex.test(fileContent)) {
				const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
				await this.app.vault.modify(file, updatedFileContent);
				successCount++;
				console.log("Successfully updated file:", file.path);
			} else {
				console.error("YAML front matter not found in file:", file.path);
				errorCount++;
			}
		} catch (error) {
			console.error(`Error processing file ${file.path}:`, error);
			errorCount++;
		}

		updateFilesNotice.setMessage(`Processed files: ${successCount}/${filesToProcess.length}\n Errors: ${errorCount}`);
	}

	updateFilesNotice.setMessage(`Processing Complete. Streaming availability updated for ${successCount} files. ${errorCount} files encountered errors. Please see console for more details on the errors.`);
	setTimeout(() => updateFilesNotice.hide(), 3000);
}
```

**After:**
```typescript
async updateAvailableOn(): Promise<void> {
	await this.operationRegistry.updateStreamingInfo(this.settings.countryAvailableOn);
}
```

**Reduction:** 91 lines → 3 lines! 🎉

---

### Method 3: updateNewProperties()

**Before (lines 341-482 in main.ts):**
```typescript
async updateNewProperties() {
	// Get all movie files
	const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
	if (!movieFolder || !(movieFolder as any).children) return;

	const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
	
	let iteration = 0;
	let successCount = 0;
	let errorCount = 0;
	const updateFilesNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);
	
	for (const file of files) {
		iteration = iteration + 1;

		const filePath = file.path;
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			errorCount++;
			continue;
		}

		const type = yaml.Type;
		const tmdbId = yaml["TMDB ID"];

		if (!type || !tmdbId) {
			errorCount++;
			continue;
		}

		const endpoint = type === 'Movie' ? `movie` : `tv`;

		// Fetch original language from TMDB API
		const response = await requestUrl({
			url: `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${this.settings.apiKey}&append_to_response=videos`,
		});

		if (response.status !== 200) {
			errorCount++;
			continue;
		}

		const data = response.json;
		const originalLanguage = data.original_language;
		const overview = data.overview;

		let productionCompanies = '';
		if (data.production_companies && data.production_companies.length > 0) {
			productionCompanies = data.production_companies.slice(0, 2).map((company: any) => company.name).join(', ');
		}

		let trailer = '';
		if (data.videos && data.videos.results.length > 0) {
			const trailerData = data.videos.results.find((video: any) => video.type === 'Trailer');
			if (trailerData) {
				trailer = `https://www.youtube.com/watch?v=${trailerData.key}`;
			}
		}

		let budget = null;
		let revenue = null;
		let belongsToCollection = null;
		let releaseDate = null;

		if (type === 'Movie') {
			budget = data.budget;
			revenue = data.revenue;
			belongsToCollection = data.belongs_to_collection ? data.belongs_to_collection.name : null;
			releaseDate = data.release_date;
		}

		const escapeDoubleQuotes = (str: string) => str.replace(/"/g, '\\"');

		if (yaml.Title) {
			const title = yaml.Title;
			if (!title.startsWith('"') || !title.endsWith('"')) {
				yaml.Title = `"${title}"`;
			} else {
				yaml.Title = `${title}`;
			}
		}
		
		let updatedYaml={}
		if(releaseDate){
			updatedYaml = {
				...yaml,
				original_language: `"${originalLanguage}"`,
				overview: `"${escapeDoubleQuotes(overview)}"`,
				trailer: `"${trailer}"`,
				budget: budget,
				revenue: revenue,
				belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
				production_company: `"${productionCompanies}"`,
				release_date: `"${releaseDate}"`,
			};
		}
		else{
			updatedYaml = {
				...yaml,
				original_language: `"${originalLanguage}"`,
				overview: `"${escapeDoubleQuotes(overview)}"`,
				trailer: `"${trailer}"`,
				budget: budget,
				revenue: revenue,
				belongs_to_collection: belongsToCollection ? `"${belongsToCollection}"` : '""',
				production_company: `"${productionCompanies}"`,
			};
		}

		const updatedYamlContent = `---\n${Object.entries(updatedYaml).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n')}\n---`;

		const fileContent = await this.app.vault.read(file);
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;

		if (yamlRegex.test(fileContent)) {
			const updatedFileContent = fileContent.replace(yamlRegex, updatedYamlContent);
			await this.app.vault.modify(file, updatedFileContent);
			successCount++;
		} else {
			console.error("YAML front matter not found in file:", file.path);
			errorCount++;
		}

		updateFilesNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
	}

	updateFilesNotice.setMessage(`Processing Complete. New properties added for ${successCount} files. ${errorCount} files encountered errors.`);
	setTimeout(() => updateFilesNotice.hide(), 3000);
}
```

**After:**
```typescript
async updateNewProperties(): Promise<void> {
	await this.operationRegistry.updateProperties();
}
```

**Reduction:** 142 lines → 3 lines! 🎉

---

### Method 4: addTrailerAndPoster() & removeTrailerAndPosterLinks()

**Before (lines 222-339 in main.ts):**
```typescript
async removeTrailerAndPosterLinks() {
	const movieFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
	if (!movieFolder || !(movieFolder as any).children) return;

	const files = (movieFolder as any).children.filter((file: any) => file.extension === 'md');
	
	let iteration = 0;
	let successCount = 0;
	let errorCount = 0;
	const removeLinksNotice = new Notice(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`, 0);

	for (const file of files) {
		iteration += 1;
		const cache = this.app.metadataCache.getFileCache(file);
		const yaml = cache?.frontmatter;

		if (!yaml) {
			errorCount++;
			new Notice(`Error with reading YAML: ${file.path}`);
			continue;
		}

		const poster = yaml.Poster;
		const trailer = yaml.trailer;
		
		let fileContent = await this.app.vault.read(file);

		if (poster) {
			const posterLink = `![Poster](${poster})`;
			fileContent = fileContent.replace(`${posterLink}`, '\n');
		}
		if (trailer) {
			const trailerLink = `![Trailer](${trailer})`;
			fileContent = fileContent.replace(`${trailerLink}`, '\n');
		}

		try {
			await this.app.vault.modify(file, fileContent);
			successCount++;
		} catch (error) {
			console.error(`Failed to update file ${file.path}`, error);
			errorCount++;
		}
	
		removeLinksNotice.setMessage(`Processed files: ${successCount}/${files.length}\n Errors: ${errorCount}`);
	}

	removeLinksNotice.setMessage(`Processing complete. Files processed: ${iteration}, Success: ${successCount}, Errors: ${errorCount}`);
	setTimeout(() => removeLinksNotice.hide(), 3000);
}

async addTrailerAndPoster() {
	// Similar 50+ lines...
}
```

**After:**
```typescript
async addTrailerAndPoster(): Promise<void> {
	await this.operationRegistry.addTrailerLinks();
}

async removeTrailerAndPosterLinks(): Promise<void> {
	await this.operationRegistry.removeTrailerLinks();
}
```

**Reduction:** 118 lines → 6 lines! 🎉

---

## Step 3: Update Settings Tab

Update the settings tab to use the new methods:

**Before:**
```typescript
new Setting(containerEl)
	.setName('Update Files for Episode tracking')
	.setDesc('Fetches total episode count...')
	.addButton(button => button
		.setButtonText('Update')
		.setCta()
		.onClick(() => {
			this.plugin.updateEPTracking();
		}));
```

**After:**
```typescript
new Setting(containerEl)
	.setName('Update Files for Episode tracking')
	.setDesc('Fetches total episode count...')
	.addButton(button => button
		.setButtonText('Update')
		.setCta()
		.onClick(async () => {
			await this.plugin.updateEPTracking();
		}));
```

No changes needed - the method signatures are the same!

---

## Complete Example: Plugin with Operations

```typescript
import { App, Plugin, PluginSettingTab, Setting, Notice } from 'obsidian';
import { ServiceFactory } from './src/utils/ServiceFactory';
import { createOperationRegistry, OperationRegistry } from './src/operations';
import { TVTrackerSettings } from './src/types/PluginTypes';
import { DEFAULT_SETTINGS } from './src/constants/defaults';

export default class TVTrackerPlugin extends Plugin {
	settings: TVTrackerSettings;
	private operationRegistry: OperationRegistry;

	async onload() {
		await this.loadSettings();
		
		// Initialize services
		ServiceFactory.initializeAll(this.app, this.settings);
		
		// Create operation registry
		this.operationRegistry = createOperationRegistry(
			ServiceFactory.getFileService(),
			ServiceFactory.getTMDBService()
		);
		
		// Add settings tab
		this.addSettingTab(new TVTrackerSettingsTab(this.app, this));
		
		// ... rest of your code
	}

	// Simplified methods using operations
	async updateEPTracking(): Promise<void> {
		await this.operationRegistry.updateEpisodeTracking();
	}

	async updateAvailableOn(): Promise<void> {
		await this.operationRegistry.updateStreamingInfo(this.settings.countryAvailableOn);
	}

	async updateNewProperties(): Promise<void> {
		await this.operationRegistry.updateProperties();
	}

	async addTrailerAndPoster(): Promise<void> {
		await this.operationRegistry.addTrailerLinks();
	}

	async removeTrailerAndPosterLinks(): Promise<void> {
		await this.operationRegistry.removeTrailerLinks();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		ServiceFactory.updateSettings(this.settings);
	}
}
```

---

## Benefits Summary

### Code Reduction
- **updateEPTracking**: 97 lines → 3 lines (97% reduction)
- **updateAvailableOn**: 91 lines → 3 lines (97% reduction)
- **updateNewProperties**: 142 lines → 3 lines (98% reduction)
- **Trailer/Poster methods**: 118 lines → 6 lines (95% reduction)

**Total: 448 lines → 15 lines! (97% reduction)** 🎉

### Quality Improvements
✅ **Consistent error handling** across all operations
✅ **Better progress tracking** with detailed notices
✅ **Type safety** with TypeScript interfaces
✅ **Reusable code** - no duplication
✅ **Easier testing** - operations can be mocked
✅ **Maintainability** - changes in one place

---

## Testing Your Migration

After refactoring, test each operation:

```typescript
// In console or test file
const registry = createOperationRegistry(fileService, tmdbService);

// Test episode tracking
const result1 = await registry.updateEpisodeTracking();
console.log('Episode tracking:', result1);

// Test streaming info
const result2 = await registry.updateStreamingInfo('US');
console.log('Streaming info:', result2);

// Test properties
const result3 = await registry.updateProperties();
console.log('Properties:', result3);

// Test links
const result4 = await registry.addTrailerLinks();
console.log('Add links:', result4);
```

---

## Troubleshooting

### Operation fails silently
- Check console for errors
- Verify services are initialized
- Check TMDB API key is valid

### Some files not processed
- Operations automatically skip files without TMDB ID
- Check file frontmatter is valid
- Review operation result's `errors` array

### Progress notice not showing
- Progress is enabled by default
- Check operation configuration
- Verify Notice is imported from Obsidian

---

Phase 2 Complete! Your bulk operations are now clean, maintainable, and reusable. 🚀

