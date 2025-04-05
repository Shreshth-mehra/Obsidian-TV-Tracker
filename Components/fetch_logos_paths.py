import requests
import json

def fetch_provider_logos():
    # TMDB API endpoint for movie providers
    url = 'https://api.themoviedb.org/3/watch/providers/movie?language=en-US'
    
    # Headers for the API request
    headers = {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3MWQ0YjVlMmQ2YjczOTJlMWRmZTYxODU1NzZiOTc2NCIsIm5iZiI6MTcwNDMwMDUxOS4xNzEsInN1YiI6IjY1OTU4ZmU3YTY5OGNmMTdmZDQzYTEyZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Gf074jyTX8mhVrXvjkIASX6EMo0DNIerO0zNzELTc_M ',
        'accept': 'application/json'
    }
    
    # Make the API request with headers
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        provider_logos = {}
        
        # Process each provider
        for provider in data.get('results', []):
            provider_name = provider.get('provider_name')
            logo_path = provider.get('logo_path')
            
            if provider_name and logo_path:
                # Construct the full logo URL
                logo_url = f'https://image.tmdb.org/t/p/original{logo_path}'
                provider_logos[provider_name] = logo_url
        
        # Convert to JavaScript-like export format
        js_output = "export const providerLogos = {\n"
        for name, url in provider_logos.items():
            js_output += f"    '{name}': '{url}',\n"
        js_output += "};"
        
        return js_output
    else:
        return f"Error: {response.status_code}"

if __name__ == "__main__":
    result = fetch_provider_logos()
    # Write the result to a file
    with open('provider_logos.txt', 'w', encoding='utf-8') as f:
        f.write(result)
    print("Provider logos have been written to provider_logos.txt")
