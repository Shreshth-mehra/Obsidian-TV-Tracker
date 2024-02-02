// MoviesBox.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Collapse, Switch, FormControlLabel, IconButton, Checkbox, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Platform } from "obsidian";

const Metrics = ({ movies, topActorsNumber, topGenresNumber, topDirectorsNumber, minMoviesForMetrics, movieMetricsHeadingColor, movieMetricsSubheadingColor, themeMode }) => {
  const [topGenres, setTopGenres] = useState([]);
  const [topActors, setTopActors] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [topDirectors, setTopDirectors] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [ratingMode, setRatingMode] = useState('Count');

  useEffect(() => {
    calculateMetrics();
  }, [movies, ratingMode]);


  const parseDuration = (durationStr) => {
    const match = durationStr.match(/(\d+)\s*minutes/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const formatDuration = (totalMinutes) => {
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    const daysDisplay = days > 0 ? `${days}d ` : '';
    const hoursDisplay = hours > 0 ? `${hours}h ` : '';
    const minutesDisplay = minutes > 0 ? `${minutes}m` : '';
    return `${daysDisplay}${hoursDisplay}${minutesDisplay}`.trim();
  };


  const calculateMetrics = () => {
    let genreCounts = {};
    let actorCounts = {};
    let genreRatingSum = {};
    let genreMovieCount = {};
    let actorRatingSum = {};
    let actorMovieCount = {};
    let durationSum = 0;
    let directorCounts = {};
    let directorRatingSum = {};
    let directorMovieCount = {};

    movies.forEach(movie => {
      const movieRating = parseFloat(movie.Rating) || 0;
      const genres = movie.Genre ? movie.Genre.split(', ') : [];
      const actors = movie.Cast ? movie.Cast.split(', ') : [];
      const director = movie.Director;

      genres.forEach(genre => {
        if (ratingMode === 'Count') {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        } else {
          genreRatingSum[genre] = (genreRatingSum[genre] || 0) + movieRating;
        }
        genreMovieCount[genre] = (genreMovieCount[genre] || 0) + 1;
      });

      actors.forEach((actor, index) => {
        if (ratingMode === 'Count') {
          actorCounts[actor] = (actorCounts[actor] || 0) + 1;
        } else {
          let ratingMultiplier = movieRating;
          if (ratingMode === 'Balanced Rating' && index < 4) {
            ratingMultiplier *= 2;
          }
          actorRatingSum[actor] = (actorRatingSum[actor] || 0) + ratingMultiplier;
        }
        actorMovieCount[actor] = (actorMovieCount[actor] || 0) + 1;
      });


      if (director) {
        if (ratingMode === 'Count') {
          directorCounts[director] = (directorCounts[director] || 0) + 1;
        } else {
          let ratingMultiplier = parseFloat(movie.Rating) || 0;
          if (ratingMode === 'Balanced Rating') {
            ratingMultiplier *= 1; // or any other logic for Balanced Rating
          }
          directorRatingSum[director] = (directorRatingSum[director] || 0) + ratingMultiplier;
        }
        directorMovieCount[director] = (directorMovieCount[director] || 0) + 1;
      }

      if (movie.Duration) {
        durationSum += parseDuration(movie.Duration);
      }
    });

    if (ratingMode === 'Count') {
      setTopGenres(Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorCounts).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
    } else if (ratingMode === 'Simple Rating' || ratingMode === 'Balanced Rating') {
      setTopGenres(Object.entries(genreRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
    } else if (ratingMode === 'Avg Rating') {
      const avgGenreRatings = {};
      for (const genre in genreRatingSum) {
        avgGenreRatings[genre] = (genreRatingSum[genre] / genreMovieCount[genre]).toFixed(2);

      }
      setTopGenres(Object.entries(avgGenreRatings).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));


      const avgDirectorRatings = {};
      for (const director in directorRatingSum) {
        if (directorMovieCount[director] >= 3) {
          avgDirectorRatings[director] = (directorRatingSum[director] / directorMovieCount[director]).toFixed(2);
        }
      }
      setTopDirectors(Object.entries(avgDirectorRatings).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));


      const avgActorRatings = {};
      for (const actor in actorRatingSum) {
        if (actorMovieCount[actor] >= minMoviesForMetrics) {
          avgActorRatings[actor] = (actorRatingSum[actor] / actorMovieCount[actor]).toFixed(2);

        }
      }
      setTopActors(Object.entries(avgActorRatings).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
    }
    setTotalDuration(formatDuration(durationSum));
  };
  // const handleIncludeRatingChange = (event) => {
  //   setIncludeRating(event.target.checked);
  // };

  const handleRatingModeChange = (event) => {
    setRatingMode(event.target.value);
  };


  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ my: 4, borderRadius: 1, position: 'relative' }}>
      <Box display="flex" justifyContent="space-between">
        <IconButton
          onClick={handleExpandClick}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s'
          }}
        >
          <ExpandMoreIcon style={{ color: themeMode === 'dark' ? 'white' : 'inherit' }} />
        </IconButton>
        <Typography variant="h6" style={{ color: movieMetricsHeadingColor }}>Movie Metrics</Typography>
        <Box>
          <FormControl style={{ color: 'inherit', margin: '10px 0', width: '100px' }}>
            <InputLabel id="rating-mode-label" style={{ color: 'inherit' }}>Rating Mode</InputLabel>
            <Select
              labelId="rating-mode-label"
              id="rating-mode-select"
              value={ratingMode}
              label="Rating Mode"
              onChange={handleRatingModeChange}
              sx={{
                color: 'inherit',
                '& .MuiSelect-select': { paddingLeft: '14px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '& .MuiSvgIcon-root': { color: 'inherit' },
              }} // For the dropdown items

            >
              <MenuItem value="Count">Count</MenuItem>
              <MenuItem value="Simple Rating">Simple Rating</MenuItem>
              <MenuItem value="Balanced Rating">Balanced Rating</MenuItem>
              <MenuItem value="Avg Rating">Avg Rating</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box style={{ paddingBottom: '15px' }}>
          <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Top {topGenresNumber} Genres:</Typography>
          <Grid container spacing={2}>
            {topGenres.map(([genre, count], index) => (
              <Grid item key={genre}>
                <Typography variant="body1" style={{ color: 'inherit' }}>
                  {index + 1}. {genre}: {count}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Top 5 Actors */}
        <Box style={{ paddingBottom: '15px' }}>
          <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Top {topActorsNumber} Actors:</Typography>
          <Grid container spacing={2}>
            {topActors.map(([actor, count], index) => (
              <Grid item key={actor}>
                <Typography variant="body1" style={{ color: 'inherit' }}>
                  {index + 1}. {actor}: {count}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box style={{ paddingBottom: '15px' }}>
          <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Top {topDirectorsNumber} Directors:</Typography>
          <Grid container spacing={2}>
            {topDirectors.map(([director, count], index) => (
              <Grid item key={director}>
                <Typography variant="body1" style={{ color: 'inherit' }}>
                  {index + 1}. {director}: {count}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Total Duration */}
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Total Movie Watching Time: {totalDuration}</Typography>
      </Collapse>
    </Box>
  );
};

export default Metrics;
