/**
 * Service for YAML formatting and parsing operations
 */

import { YAMLFrontmatter } from '../types/MovieTypes';

export class YAMLService {
	/**
	 * Escape double quotes in a string for YAML
	 */
	static escapeDoubleQuotes(str: string): string {
		if (!str) return '';
		return str.replace(/"/g, '\\"');
	}

	/**
	 * Escape all special YAML characters in a string
	 */
	static escapeYAMLString(str: string): string {
		if (!str) return '';
		return this.escapeDoubleQuotes(str);
	}

	/**
	 * Format a value for YAML output
	 */
	static formatValue(value: any): string {
		if (value === null || value === undefined) {
			return '""';
		}
		
		if (typeof value === 'string') {
			// If already quoted, return as-is
			if (value.startsWith('"') && value.endsWith('"')) {
				return value;
			}
			// Otherwise, quote it
			return `"${this.escapeDoubleQuotes(value)}"`;
		}
		
		if (typeof value === 'number') {
			return value.toString();
		}
		
		if (typeof value === 'boolean') {
			return value ? 'Yes' : 'No';
		}
		
		return JSON.stringify(value);
	}

	/**
	 * Format YAML frontmatter from an object
	 */
	static formatYAML(data: YAMLFrontmatter): string {
		const lines: string[] = ['---'];
		
		for (const [key, value] of Object.entries(data)) {
			// Skip undefined or null values unless they're supposed to be empty strings
			if (value === undefined) continue;
			
			const formattedValue = this.formatValue(value);
			lines.push(`${key}: ${formattedValue}`);
		}
		
		lines.push('---');
		return lines.join('\n');
	}

	/**
	 * Update YAML frontmatter in file content
	 */
	static updateYAMLInContent(content: string, newYAML: YAMLFrontmatter): string {
		const yamlRegex = /^---[\r\n]+[\s\S]*?[\r\n]+---/m;
		const newYAMLContent = this.formatYAML(newYAML);
		
		if (yamlRegex.test(content)) {
			return content.replace(yamlRegex, newYAMLContent);
		}
		
		// If no YAML exists, prepend it
		return newYAMLContent + '\n\n' + content;
	}

	/**
	 * Extract YAML frontmatter from file content
	 * Note: This is a simple extraction. For parsing, use Obsidian's metadataCache
	 */
	static extractYAMLContent(content: string): string | null {
		const yamlRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---/m;
		const match = content.match(yamlRegex);
		return match ? match[1] : null;
	}

	/**
	 * Check if content has YAML frontmatter
	 */
	static hasYAML(content: string): boolean {
		return /^---[\r\n]+[\s\S]*?[\r\n]+---/m.test(content);
	}

	/**
	 * Create content with YAML and optional body
	 */
	static createFileContent(
		yaml: YAMLFrontmatter, 
		body: string = '',
		includePosterLink: boolean = false,
		includeTrailerLink: boolean = false
	): string {
		let content = this.formatYAML(yaml);
		
		if (body) {
			content += '\n\n' + body;
		}
		
		// Add poster and trailer links if requested
		if (includePosterLink && yaml.Poster) {
			const posterUrl = yaml.Poster.replace(/^"|"$/g, ''); // Remove quotes if present
			content += `\n\n![Poster](${posterUrl})`;
		}
		
		if (includeTrailerLink && yaml.trailer) {
			const trailerUrl = yaml.trailer.replace(/^"|"$/g, ''); // Remove quotes if present
			content += `\n\n![Trailer](${trailerUrl})`;
		}
		
		return content;
	}

	/**
	 * Sanitize a title for use as a filename
	 */
	static sanitizeFilename(filename: string): string {
		// Remove invalid filename characters
		return filename.replace(/[\\/:*?"<>|]/g, '_');
	}

	/**
	 * Ensure title is properly quoted
	 */
	static ensureQuotedTitle(title: string): string {
		if (!title) return '""';
		
		// Remove existing quotes
		const cleanTitle = title.replace(/^"|"$/g, '');
		
		// Return properly quoted
		return `"${cleanTitle}"`;
	}
}

