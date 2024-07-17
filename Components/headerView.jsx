// Header.jsx
import React, { useState } from 'react';
import { Box, IconButton, Drawer, Typography, Button, Grid, Checkbox, Container, FormControl, InputLabel, Select, MenuItem, ListItemText, OutlinedInput } from "@mui/material";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import MenuIcon from '@mui/icons-material/Menu';
import MoviePropertiesFilter from './propertiesFilter';
import MovieRatingFilter from './ratingFilter';
import MovieGenreFilter from './genreFilter';
import SortFilter from './sortFilter';
import AddNew from './addNew';
import MovieTypeFilter from './typeFilter';
import MovieSelectPopUp from './movieSelectPopUp';
import { Platform, requestUrl, Notice } from "obsidian";



const Header = ({ showTrailerAndPosterLinks, movieProperties, handleClearAllFilters, selectedProperties, handlePropertyChange, selectedRating, handleRatingChange, genres, selectedGenres, handleGenreChange, selectedTypes, handleTypeChange, createMarkdownFile, availableLanguages, handleSortChange, sortOption, sortOrder, toggleSortOrder, themeMode, plugin, selectedLanguages, handleLanguageChange }) => {

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [selectedMovieState, setSelectedMovieState] = useState([]);
  const [errorOpen, setErrorOpen] = useState(false);

  const isMobile = Platform.isMobile;


  const handleErrorOpen = () => {
    setErrorOpen(true);
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
  };

  const handleAddMovie = async (movieData) => {
    setSelectedMovieState(movieData);

    const searchType = movieData.type === 'Series' ? 'tv' : 'movie';

    try {
      const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${plugin.settings.apiKey}&query=${encodeURIComponent(movieData.name)}`;
      const searchResponse = await requestUrl({
        url: searchUrl,
        method: 'GET',
      });


      const searchData = await searchResponse.json;

      if (searchData.results && searchData.results.length > 0) {
        setSearchResults(searchData.results.slice(0, plugin.settings.numberOfResults));
        setSelectionDialogOpen(true); // Open the selection dialog
      } else {
        new Notice(`No results found for ${movieData.type}:`, movieData.name);
      }
    } catch (error) {
      console.error(`Error fetching ${movieData.type} details:`, error);

      handleErrorOpen();

    }
  };

  const handleMovieSelect = async (selectedItem) => {
    setSelectionDialogOpen(false); // Close the dialog
    setSearchResults([]); // Clear the search results

    const isTvShow = selectedItem.first_air_date !== undefined;
    const detailsType = isTvShow ? 'tv' : 'movie';

    try {
      // Fetch detailed movie information for the selected movie
      const detailsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}?api_key=${plugin.settings.apiKey}&append_to_response=videos`;
      const detailsResponse = await requestUrl({
        url: detailsUrl,
        method: 'GET',
      });
      const detailsData = await detailsResponse.json;


      const creditsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}/credits?api_key=${plugin.settings.apiKey}`;
      const creditsResponse = await requestUrl({
        url: creditsUrl,
        method: 'GET',
      });
      const creditsData = await creditsResponse.json;
      const directors = creditsData.crew.filter(member => member.job === 'Director').map(director => director.name).join(', ');

      const originalLanguage = detailsData.original_language;
      const overview = detailsData.overview;

      let productionCompanies = '';
      if (detailsData.production_companies && detailsData.production_companies.length > 0) {
        productionCompanies = detailsData.production_companies.slice(0, 2).map(company => company.name).join(', ');
      }

      let trailer = '';
      if (detailsData.videos && detailsData.videos.results.length > 0) {
        const trailerData = detailsData.videos.results.find(video => video.type === 'Trailer');
        if (trailerData) {
          trailer = `https://www.youtube.com/watch?v=${trailerData.key}`;
        }
      }

      const posterLink = `https://image.tmdb.org/t/p/original${detailsData.poster_path}`;

      let budget = null;
      let revenue = null;
      let belongsToCollection = null;
      let totalEpisodes = 0;
      let totalSeasons = 0;
      let episode_runtime = 0;
      let episodes_seen = 0;

      if (!isTvShow) {
        budget = detailsData.budget;
        revenue = detailsData.revenue;
        belongsToCollection = detailsData.belongs_to_collection ? detailsData.belongs_to_collection.name : null;
      }

      if (isTvShow) {
        totalEpisodes = detailsData.number_of_episodes;
        totalSeasons = detailsData.number_of_seasons;
        episode_runtime = detailsData.episode_run_time && detailsData.episode_run_time.length > 0 ? detailsData.episode_run_time[0] : null;
      }

      const escapeDoubleQuotes = (str) => str.replace(/"/g, '\\"');
      const movieYAML = `---
Title: "${detailsData.title || detailsData.name}" 
Rating: ${selectedMovieState.rating}
Status: "${selectedMovieState.status}"
Type: "${selectedMovieState.type}"
Poster: "https://image.tmdb.org/t/p/original${detailsData.poster_path}"
Genre: "${detailsData.genres.map(genre => genre.name).join(', ')}"
${isTvShow ? `First Air Date: ${selectedItem.first_air_date}` : `Duration: ${detailsData.runtime} minutes`}
Avg vote: ${detailsData.vote_average}
Popularity: ${detailsData.popularity}
Cast: "${creditsData.cast.slice(0, 10).map(member => member.name).join(', ')}"
TMDB ID: ${selectedItem.id}
Director: "${directors}"
tags: "tvtracker, ${selectedMovieState.type}"
original_language: "${originalLanguage}"
overview: "${escapeDoubleQuotes(overview)}"
trailer: "${trailer}"
budget: ${budget}
revenue: ${revenue}
belongs_to_collection: ${belongsToCollection ? `"${belongsToCollection}"` : '""'}
production_company: "${productionCompanies}"
${isTvShow ? `total_episodes: ${totalEpisodes}` : ''}
${isTvShow ? `total_seasons: ${totalSeasons}` : ''}
${isTvShow ? `episode_runtime: ${episode_runtime}` : ''}
${isTvShow ? `episodes_seen: ${episodes_seen}` : ''}
---`;

      let content = movieYAML;

      if (showTrailerAndPosterLinks) {
        if (detailsData.poster_path) {
          content += `\n![Poster](${posterLink})`;
        }
        if (trailer != '') {
          content += `\n![Trailer](${trailer})`;
        }
      }

      const title = detailsData.title || detailsData.name; // TV shows use 'name' instead of 'title'
      const fileName = `${title.replace(/[\/\\:]/g, '_')}`; // Sanitize title for filename
      await createMarkdownFile(fileName, content);
      new Notice('Successfully added. Please restart plugin to view it in the library');
    } catch (error) {
      new Notice('Error: Could not add movie');
      console.error('Error processing the selected movie:', error);
    }

  };

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
  };


  const handleDrawerToggle = () => {
    setMobileFiltersOpen(!mobileFiltersOpen);
  };

  const filters = (
    <>
      <Box mb={2}> {/* Margin bottom */}
        <SortFilter
          sortOption={sortOption}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          toggleSortOrder={toggleSortOrder} />
      </Box>

      <Box mb={2}>
        <FormControl fullWidth variant="outlined" sx={{ width: isMobile ? '70%' : '8vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
          <InputLabel sx={{ color: 'inherit' }}>Languages</InputLabel>
          <Select
            multiple
            value={selectedLanguages}
            onChange={handleLanguageChange}
            input={<OutlinedInput label="Languages" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 200,
                },
              },
            }}
            sx={{
              color: 'inherit',
              '& .MuiSelect-select': { paddingLeft: '5px' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
              '& .MuiSvgIcon-root': { color: 'inherit' },
            }}
          >
            {availableLanguages.map((language) => (
              <MenuItem key={language} value={language}>
                <Checkbox checked={selectedLanguages.indexOf(language) > -1} />
                <ListItemText primary={language} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

      </Box>

      <Box mb={2}>
        <MoviePropertiesFilter
          movieProperties={movieProperties}
          selectedProperties={selectedProperties}
          handlePropertyChange={handlePropertyChange}
        />
      </Box>

      <Box mb={2}>
        <MovieGenreFilter
          genres={genres}
          selectedGenres={selectedGenres}
          handleGenreChange={handleGenreChange}
        />
      </Box>

      <Box mb={2}>
        <MovieRatingFilter
          selectedRating={selectedRating}
          handleRatingChange={handleRatingChange}
        />
      </Box>

      <Box mb={2}>
        <MovieTypeFilter
          selectedTypes={selectedTypes}
          handleTypeChange={handleTypeChange}
        />
      </Box>
      <Box mb={2}>
        <Button variant="contained" onClick={handleClearAllFilters} style={{
          color: 'inherit', maxWidth: '100px', height: 'auto',
          whiteSpace: 'wrap',
          overflow: 'hidden',
          padding: '8px 8px',
          fontSize: '10px'
        }}>Clear All filters</Button>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', marginBottom: '16px' }}>
      <Dialog open={errorOpen} onClose={handleErrorClose}>
        <DialogTitle>{"Unauthorized Access"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please check your API key or internet connection.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Button sx={{
        color: 'inherit', maxWidth: '120px', height: 'auto',
        whiteSpace: 'wrap',
        overflow: 'hidden',
        padding: '8px 8px',
        fontSize: '12px'
      }} onClick={handleOpenAddDialog}>Add New</Button>
      <AddNew
        open={addDialogOpen}
        handleClose={handleCloseAddDialog}
        handleAddMovie={handleAddMovie}
        themeMode={themeMode}
      />


      {Platform.isMobile ? (
        <>
          <IconButton
            color="inherit"
            aria-label="open filters"
            edge="end"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="top"
            open={mobileFiltersOpen}
            onClose={handleDrawerToggle}
            sx={{
              '& .MuiDrawer-paper': {
                backgroundColor: themeMode === 'dark' ? '#121212' : '#3a3b3c', // Example dark color, you can choose any
                color: 'white'
              },
            }}
          >
            <Container style={{ padding: '30px' }}>
              {filters}
            </Container>


          </Drawer>
        </>
      ) : (
        <Box sx={{ display: 'flex', gap: '16px' }}>
          {filters}
        </Box>
      )}

      <MovieSelectPopUp movies={searchResults} onSelect={handleMovieSelect} onClose={() => setSelectionDialogOpen(false)} />

    </Box>
  );
};

export default Header;
