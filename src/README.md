# TV Tracker Plugin - Refactored Service Layer

## Overview

This directory contains the refactored service layer for the Obsidian TV Tracker plugin, implementing **Phase 1** of the comprehensive refactoring plan.

## Directory Structure

```
src/
├── constants/              # Constant values and configurations
│   ├── defaults.ts        # Default plugin settings
│   └── genres.ts          # TMDB genre definitions
├── services/              # Business logic services
│   ├── FileService.ts     # Obsidian vault file operations
│   ├── TMDBService.ts     # TMDB API interactions
│   └── YAMLService.ts     # YAML formatting and parsing
├── types/                 # TypeScript type definitions
│   ├── MovieTypes.ts      # Movie/Series data structures
│   ├── PluginTypes.ts     # Plugin-specific types
│   └── TMDBTypes.ts       # TMDB API response types
├── utils/                 # Utility functions
│   └── ServiceFactory.ts  # Service instance management
├── MIGRATION_GUIDE.md     # Guide for refactoring existing code
└── README.md             # This file
```

## Services

### TMDBService
Centralizes all interactions with The Movie Database (TMDB) API.

**Key Features:**
- Type-safe API calls
- Built-in error handling
- Helper methods for extracting data
- Support for movies, TV series, credits, providers, and more

**Example:**
```typescript
const tmdbService = ServiceFactory.getTMDBService();
const results = await tmdbService.searchMovie('Inception');
const { details, credits, providers } = await tmdbService.getFullDetails(550, 'movie');
```

### FileService
Handles all Obsidian vault file operations.

**Key Features:**
- File CRUD operations
- YAML frontmatter management
- Batch operations with progress tracking
- Episode list management for TV series
- Built-in error handling

**Example:**
```typescript
const fileService = ServiceFactory.getFileService();
const movies = await fileService.getAllMovieData();
await fileService.updateFileYAML(file, updatedYAML);
```

### YAMLService
Provides utilities for YAML formatting and parsing.

**Key Features:**
- Proper string escaping
- Type-safe YAML generation
- Content creation with frontmatter
- Filename sanitization

**Example:**
```typescript
const yaml = { Title: 'Movie Name', Rating: 5, ... };
const content = YAMLService.createFileContent(yaml, '', true, true);
```

## Getting Started

### 1. Initialize Services

In your plugin's `onload()` method:

```typescript
import { ServiceFactory } from './src/utils/ServiceFactory';

async onload() {
    await this.loadSettings();
    
    // Initialize all services
    ServiceFactory.initializeAll(this.app, this.settings);
    
    // ... rest of your code
}
```

### 2. Update Services on Settings Change

```typescript
async saveSettings() {
    await this.saveData(this.settings);
    ServiceFactory.updateSettings(this.settings);
}
```

### 3. Use Services in Your Code

```typescript
// Get service instances
const tmdbService = ServiceFactory.getTMDBService();
const fileService = ServiceFactory.getFileService();
const YAMLService = ServiceFactory.getYAMLService();

// Use them!
const results = await tmdbService.searchMovie('Inception');
const movies = await fileService.getAllMovieData();
const content = YAMLService.createFileContent(yaml);
```

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed examples of how to refactor existing code to use these services.

## Type Safety

All services are fully typed with TypeScript interfaces:

- **TMDBTypes.ts** - TMDB API response types
- **MovieTypes.ts** - Movie/Series data structures
- **PluginTypes.ts** - Plugin settings and configuration

This provides:
- Auto-completion in your IDE
- Compile-time error checking
- Better documentation
- Easier refactoring

## Constants

Common constants are centralized in `constants/`:

- **defaults.ts** - Default plugin settings, API URLs, constraints
- **genres.ts** - TMDB genre list and mappings

Use these instead of hardcoding values:

```typescript
import { TMDB_API_BASE_URL, DEFAULT_SETTINGS } from './src/constants/defaults';
import { GENRE_LIST } from './src/constants/genres';
```

## Benefits

✅ **Centralized Logic** - No more scattered API calls
✅ **Type Safety** - Catch errors at compile time
✅ **Reusability** - Use services across the entire codebase
✅ **Consistency** - Same patterns everywhere
✅ **Maintainability** - Easier to update and debug
✅ **Testability** - Can mock services for testing
✅ **Performance** - Built-in optimizations

## Next Steps (Future Phases)

- **Phase 2**: Refactor bulk operations into unified classes
- **Phase 3**: Extract modals and commands from main.ts
- **Phase 4**: Refactor React components with custom hooks
- **Phase 5**: Improve settings organization
- **Phase 6**: Performance optimizations
- **Phase 7**: Testing and documentation

## Backwards Compatibility

⚠️ **Important:** All existing functionality continues to work unchanged. The services are additive - they don't replace existing code until you explicitly refactor it.

You can refactor incrementally, one method at a time, while keeping the plugin functional.

## Contributing

When adding new features:

1. **Use the services** - Don't bypass them
2. **Add types** - Create interfaces for new data structures
3. **Follow patterns** - Look at existing code for examples
4. **Update this README** - Document new functionality

## Questions?

Refer to:
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Detailed refactoring examples
- Service source files - All methods have JSDoc comments
- Type definition files - For data structure documentation

---

**Phase 1 Status:** ✅ Complete

All services implemented, tested, and ready to use!

