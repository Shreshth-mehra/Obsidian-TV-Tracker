import * as React from "react";
import { useEffect, useState } from "react";
import MovieGrid from "./Components/GridView";
import { Container, Typography, Box, Collapse, Button } from "@mui/material";
import Header from './Components/headerView';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Metrics from './Components/metricsView';
import { Platform, Notice } from "obsidian";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DiscoverPopup from './Components/discoverView'
import { SolarPower } from "@mui/icons-material";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}




const genreList = [
  { "id": 28, "name": "Action" },
  { "id": 12, "name": "Adventure" },
  { "id": 16, "name": "Animation" },
  { "id": 35, "name": "Comedy" },
  { "id": 80, "name": "Crime" },
  { "id": 99, "name": "Documentary" },
  { "id": 18, "name": "Drama" },
  { "id": 10751, "name": "Family" },
  { "id": 14, "name": "Fantasy" },
  { "id": 36, "name": "History" },
  { "id": 27, "name": "Horror" },
  { "id": 10402, "name": "Music" },
  { "id": 9648, "name": "Mystery" },
  { "id": 10749, "name": "Romance" },
  { "id": 878, "name": "Science Fiction" },
  { "id": 10770, "name": "TV Movie" },
  { "id": 53, "name": "Thriller" },
  { "id": 10752, "name": "War" },
  { "id": 37, "name": "Western" }
];

export const ReactView = ({ moviesData, createMarkdownFile, themeMode, plugin, defaultLanguages, defaultProperties }) => {
  // Change movie state to movies, which will be an array
  const [movies, setMovies] = useState([moviesData || []]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedProperties, setSelectedProperties] = useState(defaultProperties);
  const [movieProperties, setMovieProperties] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [sortOption, setSortOption] = useState(plugin.settings.defaultSortingMode);
  const [sortOrder, setSortOrder] = useState('descending');
  const [showDiscoverPopup, setShowDiscoverPopup] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState(defaultLanguages);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [debugInfo, setDebugInfo] = useState('Should not be this');

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const isMobile = Platform.isMobile;
  const availableLanguages = Array.from(new Set(movies.map(movie => movie.original_language)));

  const openDiscoverPopup = () => setShowDiscoverPopup(true);


  const closeDiscoverPopup = () => setShowDiscoverPopup(false);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedGenres([]);
    setSelectedTypes([]);
    setSelectedRating(1);
    setShowWatchlist(false);
    setSelectedLanguages([]); // Set this to default selected languages from settings instead
    setSelectedProviders([]); // Clear provider filter
  };

  const handleGenreChange = (event) => {
    const {
      target: { value },
    } = event;

    setSelectedGenres(typeof value === 'string' ? value.split(',') : value);

  };

  const handleLanguageChange = (event) => {
    const { value } = event.target;
    setSelectedLanguages(typeof value === 'string' ? value.split(',') : value);
  };

  const handleTypeChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedTypes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleProviderChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedProviders(typeof value === 'string' ? value.split(',') : value);
  };

  const sortMovies = (movies) => {

    return movies.sort((a, b) => {

      let comparison = 0;
      if (sortOption === 'Alphabetical') {
        comparison = a.Title.localeCompare(b.Title);
      } else if (sortOption === 'Rating') {
        comparison = a.Rating - b.Rating;
      }
      else if (sortOption === 'Avg vote') {
        // Accessing 'Avg vote' property using bracket notation
        const avgVoteA = parseFloat(a['Avg vote']) || 0;
        const avgVoteB = parseFloat(b['Avg vote']) || 0;
        comparison = avgVoteA - avgVoteB;
      } else if (sortOption === 'Hidden Gem factor') {
        // Compute the ratio of Rating divided by Popularity for sorting
        const ratioA = a.Rating / a.Popularity;
        const ratioB = b.Rating / b.Popularity;
        comparison = ratioA - ratioB;
      }


      return sortOrder === 'ascending' ? comparison : -comparison;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ascending' ? 'descending' : 'ascending');
  };


  // }, []);

  useEffect(() => {

    const propertiesSet = new Set();

    setMovies(moviesData);
    movies.forEach(movie => {

      Object.keys(movie).forEach(key => propertiesSet.add(key));
    });
    setMovieProperties(Array.from(propertiesSet));
    
    // Extract available providers from movies
    const providersSet = new Set();
    movies.forEach(movie => {
      if (movie['Available On']) {
        const providers = movie['Available On'].split(', ');
        providers.forEach(provider => providersSet.add(provider));
      }
    });
    setAvailableProviders(Array.from(providersSet));
    
    // parseAndSetSelectedLanguages();
    applyFilters();

  }, [movies, selectedGenres, selectedTypes, selectedRating, debouncedSearchTerm, sortOption, showWatchlist, sortOrder, selectedLanguages, selectedProviders]);



  const handlePropertyChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedProperties(typeof value === 'string' ? value.split(',') : value);
  };


  const handleRatingChange = (event) => {
    const rating = event.target.value;
    setSelectedRating(rating);
  };

  const handleSortChange = (event) => {
    const sort = event.target.value;
    setSortOption(sort);
  };

  const handleExpandLegend = () => {
    setLegendOpen(!legendOpen);
  };


  const applyFilters = () => {

    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();


    const filtered = movies.filter(movie => {
      try {
        const matchesTitle = movie.Title && movie.Title.toString().toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCollection = movie.belongs_to_collection && movie.belongs_to_collection.toString().toLowerCase().includes(lowerCaseSearchTerm);
        const matchesDirector = movie.Director ? movie.Director.toLowerCase().includes(lowerCaseSearchTerm) : false;
        const matchesYear = movie.release_date ? movie.release_date.includes(lowerCaseSearchTerm) : false;
        const matchesAvailableOn = movie['Available On'] ? movie['Available On'].toLowerCase().includes(lowerCaseSearchTerm) : false;

        const matchesCast = movie.Cast && movie.Cast.split(', ').some(castMember =>
          castMember.toLowerCase().includes(lowerCaseSearchTerm)
        );
        const matchesProductionComapny = movie.production_company && movie.production_company.split(', ').some(producer =>
          producer.toLowerCase().includes(lowerCaseSearchTerm)
        );

        const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(Genre => movie.Genre.split(', ').includes(Genre));

        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(movie.Type);
        const matchesRating = movie.Rating >= selectedRating;
        const matchesWatchlist = !showWatchlist || movie.Status === 'Watchlist';
        const matchesLanguage = selectedLanguages.length === 0 || selectedLanguages.includes(movie.original_language);
        
        // Add provider filter
        const matchesProvider = selectedProviders.length === 0 || 
          (movie['Available On'] && selectedProviders.some(provider => 
            movie['Available On'].split(', ').includes(provider)
          ));
        
        return matchesGenre && matchesType && matchesRating && matchesLanguage && matchesProvider && 
          (matchesTitle || matchesCast || matchesDirector || matchesProductionComapny || matchesCollection || matchesYear || matchesAvailableOn) && 
          matchesWatchlist;
      } catch (error) {
        new Notice(`Error processing movie ${movie.Title}. Showing rest of the results. Please console for detailed error`);
        console.error(`Error processing movie ${movie.Title}: ${error.message}`);
        return false;
      }
    });

    const sortedMovies = sortMovies(filtered);
    setFilteredMovies(sortedMovies);
  };




  const languageFilteredMovies = movies.filter(movie => selectedLanguages.length === 0 || selectedLanguages.includes(movie.original_language));


  // Render each movie in the grid
  return (
    <Container>
      <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
        {plugin.settings.title}
      </Typography>
      <Header
        showTrailerAndPosterLinks={plugin.settings.showTrailerAndPosterLinks}
        movieProperties={movieProperties}
        selectedProperties={selectedProperties}
        handlePropertyChange={handlePropertyChange}
        selectedRating={selectedRating}
        handleRatingChange={handleRatingChange}
        genres={genreList}
        selectedGenres={selectedGenres}
        handleGenreChange={handleGenreChange}
        selectedTypes={selectedTypes}
        handleTypeChange={handleTypeChange}
        createMarkdownFile={createMarkdownFile}
        toggleSortOrder={toggleSortOrder}
        sortOption={sortOption}
        sortOrder={sortOrder}
        handleSortChange={handleSortChange}
        themeMode={themeMode}
        plugin={plugin}
        handleClearAllFilters={handleClearFilters}
        handleLanguageChange={handleLanguageChange}
        selectedLanguages={selectedLanguages}
        availableLanguages={availableLanguages}
        selectedProviders={selectedProviders}
        handleProviderChange={handleProviderChange}
        availableProviders={availableProviders}
      />
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TextField
          label="Search Movies"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon style={{ color: themeMode === 'dark' ? 'white' : 'inherit' }} />
              </InputAdornment>
            ),
            style: { color: 'inherit' } // Sets the color of the input text to white
          }}
          InputLabelProps={{
            style: { color: 'inherit' } // Sets the color of the label text to white
          }}
          sx={{
            width: isMobile ? '70%' : '20%', // Sets the width of the TextField to 20% of the parent container
            '.MuiOutlinedInput-root': {
              color: 'inherit', // Changes the text color inside the input field to white
              '& fieldset': {
                borderColor: 'inherit', // Changes the border color to white
              },
              '&:hover fieldset': {
                borderColor: 'inherit', // Changes the border color on hover to white
              },
              '&.Mui-focused fieldset': {
                borderColor: 'inherit', // Changes the border color when focused to white
              },
            }
          }}
        />


        <FormControlLabel
          control={
            <Checkbox
              checked={showWatchlist}
              onChange={(e) => setShowWatchlist(e.target.checked)}
              color="primary"
            />
          }
          label="Show Watchlist"
        />
      </Box>
      <Typography sx={
        { flexGrow: 1, padding: '20px' }}>
        Showing {filteredMovies.length} results
      </Typography>

      <Box style={{ padding: '10px', marginBottom: '10px' }}>
        <Button variant="contained" onClick={openDiscoverPopup} style={{ color: 'inherit' }}>Discover</Button>
      </Box>
      {!plugin.settings.hideLegend && (
        <Box>
          <Box display="flex" justifyContent="flex-start" alignItems="center">
            <ExpandMoreIcon onClick={handleExpandLegend}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: legendOpen ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />

            <Typography onClick={handleExpandLegend} variant="h6" style={{ color: plugin.settings.movieMetricsHeadingColor }}>Legend</Typography>
          </Box>

          <Collapse in={legendOpen} timeout="auto" unmountOnExit>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>

              <Typography sx={
                { display: ' flex', padding: '10px' }}>
                ⭐ = Don't Bother  | ⭐⭐ = Time waste
              </Typography>

              <Typography sx={
                { display: ' flex', padding: '10px' }}>
                ⭐⭐⭐ = Time Pass  | ⭐⭐⭐✨ = Good Time Pass
              </Typography>
              <Typography sx={
                { display: ' flex', padding: '10px' }}>
                ⭐⭐⭐⭐ = Good Watch |   ⭐⭐⭐⭐✨ = Great Watch
              </Typography>
              <Typography sx={
                { display: ' flex', padding: '10px' }}>
                ⭐⭐⭐⭐⭐ = See right now if you haven't
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}
      {!plugin.settings.hideMetrics && (
        <Metrics movies={languageFilteredMovies} plugin={plugin} themeMode={themeMode} />
      )}
      <DiscoverPopup
        open={showDiscoverPopup}
        onClose={closeDiscoverPopup}
        genres={genreList} // Pass the genre list
        movies={movies}
        themeMode={themeMode}
        movieCardColor={plugin.settings.movieCardColor}
        apiKey={plugin.settings.apiKey}
      />
      {(!movies || movies.length === 0) && (
        <div> No movie or tv show titles found in the folder {plugin.settings.movieFolderPath}</div>
      )}
      <MovieGrid movies={filteredMovies.length > 0 ? filteredMovies : movies} selectedProperties={selectedProperties} numberOfColumns={plugin.settings.numberOfColumns} toggleFittedImage={plugin.settings.toggleFittedImages} movieCardColor={plugin.settings.movieCardColor} plugin={plugin} />
    </Container>
  );
};
