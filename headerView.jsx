// Header.jsx
import React, { useState } from 'react';
import { Box, IconButton, Drawer, Typography, Button, Grid, Container } from "@mui/material";
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
import { Platform } from "obsidian";



const Header = ({ movieProperties, selectedProperties, handlePropertyChange, selectedRating, handleRatingChange, genres, selectedGenres, handleGenreChange, selectedTypes, handleTypeChange, createMarkdownFile, numberOfResults, apiKey, handleSortChange, sortOption, sortOrder, toggleSortOrder, themeMode }) => {

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [selectedMovieState, setSelectedMovieState] = useState([]);
  const [errorOpen, setErrorOpen] = useState(false);

  const handleErrorOpen = () => {
    setErrorOpen(true);
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
  };

  const handleAddMovie = async (movieData) => {
    setSelectedMovieState(movieData);

    // const apiKey = '71d4b5e2d6b7392e1dfe6185576b9764'; // Replace with your TMDB API key
    const searchType = movieData.type === 'Series' ? 'tv' : 'movie';

    try {
      const searchUrl = `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(movieData.name)}`;
      const searchResponse = await fetch(searchUrl);
      if (searchResponse.status === 401) {
        handleErrorOpen();
        return;
      }
      const searchData = await searchResponse.json();

      if (searchData.results && searchData.results.length > 0) {
        setSearchResults(searchData.results.slice(0, numberOfResults)); // Save top 3 results
        setSelectionDialogOpen(true); // Open the selection dialog
      } else {
        console.log(`No results found for ${movieData.type}:`, movieData.name);
      }
    } catch (error) {
      console.error(`Error fetching ${movieData.type} details:`, error);
    }
  };

  const handleMovieSelect = async (selectedItem) => {
    setSelectionDialogOpen(false); // Close the dialog
    setSearchResults([]); // Clear the search results

    // const apiKey = '71d4b5e2d6b7392e1dfe6185576b9764'; // Replace with your TMDB API key
    const isTvShow = selectedItem.first_air_date !== undefined;
    const detailsType = isTvShow ? 'tv' : 'movie';

    try {
      // Fetch detailed movie information for the selected movie
      const detailsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}?api_key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();


      // Logging the relevant data
      console.log("Title:", detailsData.title);
      console.log("Poster URL:", `https://image.tmdb.org/t/p/original${detailsData.poster_path}`);
      console.log("Genres:", detailsData.genres.map(genre => genre.name).join(', '));
      console.log("Duration:", detailsData.runtime, "minutes");
      console.log("Average Vote:", detailsData.vote_average);
      console.log("Popularity:", detailsData.popularity);

      // If you want to fetch credits (cast members) as well
      const creditsUrl = `https://api.themoviedb.org/3/${detailsType}/${selectedItem.id}/credits?api_key=${apiKey}`;
      const creditsResponse = await fetch(creditsUrl);
      const creditsData = await creditsResponse.json();
      const directors = creditsData.crew.filter(member => member.job === 'Director').map(director => director.name).join(', ');
      console.log("Cast:", creditsData.cast.slice(0, 10).map(member => member.name).join(', '));
      console.log("Director(s):", directors);

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
---`;

      const title = detailsData.title || detailsData.name; // TV shows use 'name' instead of 'title'
      const fileName = `${title.replace(/[\/\\:]/g, '_')}`; // Sanitize title for filename
      await createMarkdownFile(fileName, movieYAML);

    } catch (error) {
      console.error('Error processing the selected movie:', error);
    }

    // Further processing for the selected movie
    // ...
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
    </>
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', marginBottom: '16px' }}>
      <Dialog open={errorOpen} onClose={handleErrorClose}>
        <DialogTitle>{"Unauthorized Access"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please check your API key.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <Button sx={{ color: 'inherit' }} onClick={handleOpenAddDialog}>Add New</Button>
      <AddNew
        open={addDialogOpen}
        handleClose={handleCloseAddDialog}
        handleAddMovie={handleAddMovie}
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
                backgroundColor: themeMode === 'dark' ? '#424242' : '#f5f5f5', // Example dark color, you can choose any
                color: 'inherit'
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
