# Bulk Operations

This directory contains the refactored bulk file operation system for the TV Tracker plugin.

## Overview

All bulk operations now inherit from `BulkOperationBase`, which provides:
- ✅ Consistent progress tracking
- ✅ Error handling with detailed reporting
- ✅ Before/after hooks for custom logic
- ✅ File filtering capabilities
- ✅ Automatic notice management

## Available Operations

### 1. UpdateEpisodeTrackingOperation
Updates episode tracking data for TV series.

**What it updates:**
- `total_episodes` - Total episode count
- `total_seasons` - Total season count
- `episode_runtime` - Average episode runtime
- `episodes_seen` - Initializes to 0 if not present

**Files processed:** Only TV Series

### 2. UpdateStreamingInfoOperation
Updates streaming availability information.

**What it updates:**
- `Available On` - List of streaming providers for specified country

**Files processed:** All movies and series

**Configuration:**
- `countryCode` - Country code for provider lookup (default: 'US')

### 3. UpdatePropertiesOperation
Updates general properties from TMDB.

**What it updates:**
- `original_language` - Original language code
- `overview` - Description/plot summary
- `trailer` - YouTube trailer URL
- `production_company` - Production companies
- `budget` - Budget (movies only)
- `revenue` - Revenue (movies only)
- `belongs_to_collection` - Collection name (movies only)
- `release_date` - Release date (movies only)

**Files processed:** All movies and series

### 4. UpdateTrailerLinksOperation
Adds or removes trailer and poster links from file content.

**What it does:**
- Adds/removes `![Poster](url)` links
- Adds/removes `![Trailer](url)` links

**Files processed:** All movies and series

**Configuration:**
- `addLinks` - `true` to add, `false` to remove

## Usage

### Basic Usage with OperationRegistry

```typescript
import { ServiceFactory } from '../utils/ServiceFactory';
import { createOperationRegistry } from '../operations';

// Get services
const fileService = ServiceFactory.getFileService();
const tmdbService = ServiceFactory.getTMDBService();

// Create registry
const registry = createOperationRegistry(fileService, tmdbService);

// Execute operations
await registry.updateEpisodeTracking();
await registry.updateStreamingInfo('US');
await registry.updateProperties();
await registry.addTrailerLinks();
await registry.removeTrailerLinks();
```

### Using Operations Directly

```typescript
import { UpdateEpisodeTrackingOperation } from '../operations';
import { ServiceFactory } from '../utils/ServiceFactory';

const fileService = ServiceFactory.getFileService();
const tmdbService = ServiceFactory.getTMDBService();

const operation = new UpdateEpisodeTrackingOperation(fileService, tmdbService);
const result = await operation.execute();

console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);
```

### Multiple Operations in Sequence

```typescript
const results = await registry.executeMultiple([
	{ type: 'updateProperties' },
	{ type: 'updateStreamingInfo', options: { countryCode: 'GB' } },
	{ type: 'updateEpisodeTracking' }
]);

results.forEach((result, index) => {
	console.log(`Operation ${index + 1}: ${result.successCount} successes, ${result.errorCount} errors`);
});
```

## Operation Results

Every operation returns an `OperationResult` object:

```typescript
interface OperationResult {
	success: boolean;           // true if no errors
	successCount: number;       // Number of files processed successfully
	errorCount: number;         // Number of files with errors
	totalFiles: number;         // Total files processed
	errors: Array<{            // Detailed error information
		file: string;
		error: string;
	}>;
	skippedCount?: number;     // Number of files skipped
}
```

## Creating Custom Operations

Extend `BulkOperationBase` to create custom operations:

```typescript
import { TFile } from 'obsidian';
import { BulkOperationBase, OperationConfig } from './BulkOperationBase';

export class MyCustomOperation extends BulkOperationBase {
	constructor(fileService, tmdbService) {
		const config: OperationConfig = {
			noticeTitle: 'My Custom Operation',
			successMessage: 'Custom operation completed',
			errorMessage: 'Custom operation had errors'
		};
		
		super(fileService, tmdbService, config);
	}

	// Required: Process a single file
	protected async processFile(file: TFile): Promise<void> {
		const frontmatter = await this.getFileFrontmatter(file);
		
		// Your custom logic here
		const updatedYaml = {
			...frontmatter,
			// your changes
		};
		
		await this.updateFileYAML(file, updatedYaml);
	}

	// Optional: Filter which files to process
	protected async filterFiles(files: TFile[]): Promise<TFile[]> {
		return files.filter(file => {
			const frontmatter = this.fileService.getFileFrontmatter(file);
			return frontmatter?.Type === 'Movie'; // Example: only movies
		});
	}

	// Optional: Setup before processing
	protected async beforeOperation(): Promise<void> {
		console.log('Starting operation...');
	}

	// Optional: Cleanup after processing
	protected async afterOperation(result: OperationResult): Promise<void> {
		console.log(`Completed: ${result.successCount} successes`);
	}
}
```

## Migrating from Old Code

### Before (main.ts)

```typescript
async updateEPTracking() {
	const seriesFolder = this.app.vault.getAbstractFileByPath(this.settings.movieFolderPath);
	const files = (seriesFolder as any).children.filter((file: any) => file.extension === 'md');
	let successCount = 0;
	let errorCount = 0;
	const notice = new Notice(`Processed: 0/${files.length}`, 0);
	
	for (const file of files) {
		try {
			// ... 100+ lines of processing logic
			successCount++;
		} catch (error) {
			errorCount++;
		}
		notice.setMessage(`Processed: ${successCount}/${files.length}`);
	}
	
	notice.setMessage(`Complete. Success: ${successCount}, Errors: ${errorCount}`);
}
```

### After (using operations)

```typescript
async updateEPTracking() {
	const registry = createOperationRegistry(
		ServiceFactory.getFileService(),
		ServiceFactory.getTMDBService()
	);
	
	return await registry.updateEpisodeTracking();
}
```

## Benefits

### ✅ Code Reuse
- Common logic in base class
- No duplicate progress tracking
- Consistent error handling

### ✅ Type Safety
- Full TypeScript support
- Type-safe operation results
- IDE autocomplete

### ✅ Maintainability
- Easy to add new operations
- Changes in one place
- Clear separation of concerns

### ✅ Testing
- Each operation can be tested independently
- Mock services for unit tests
- Predictable results

### ✅ Error Handling
- Detailed error reporting
- Files processed despite errors
- Clear error messages

### ✅ Progress Tracking
- Automatic progress notices
- Real-time updates
- Final summary

## Architecture

```
BulkOperationBase (abstract)
├── Common functionality
│   ├── Progress tracking
│   ├── Error handling
│   ├── File filtering
│   └── Notice management
│
└── Concrete implementations
    ├── UpdateEpisodeTrackingOperation
    ├── UpdateStreamingInfoOperation
    ├── UpdatePropertiesOperation
    └── UpdateTrailerLinksOperation
```

## Testing

```typescript
// Example test
import { UpdateEpisodeTrackingOperation } from './UpdateEpisodeTrackingOperation';
import { mockFileService, mockTMDBService } from './test-utils';

describe('UpdateEpisodeTrackingOperation', () => {
	it('should update episode tracking for series', async () => {
		const fileService = mockFileService();
		const tmdbService = mockTMDBService();
		
		const operation = new UpdateEpisodeTrackingOperation(fileService, tmdbService);
		const result = await operation.execute();
		
		expect(result.success).toBe(true);
		expect(result.successCount).toBeGreaterThan(0);
	});
});
```

---

**Phase 2 Complete!** ✅

All bulk operations have been refactored into a clean, maintainable system.

