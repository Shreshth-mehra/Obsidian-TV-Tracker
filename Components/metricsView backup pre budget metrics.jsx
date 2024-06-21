// MoviesBox.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Collapse, Switch, FormControlLabel, IconButton, Checkbox, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


const Metrics = ({ movies, topActorsNumber, topGenresNumber, topDirectorsNumber, topProductionCompaniesNumber, minMoviesForMetrics, movieMetricsHeadingColor, movieMetricsSubheadingColor, themeMode, metricsHeading }) => {
  const [topGenres, setTopGenres] = useState([]);
  const [topActors, setTopActors] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [topDirectors, setTopDirectors] = useState([]);
  const [topProductionCompanies, setTopProductionCompanies] = useState([]);
  const [expandedMain, setExpandedMain] = useState(true);
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [expandedActors, setExpandedActors] = useState(false);
  const [expandedDirectors, setExpandedDirectors] = useState(false);
  const [expandedTasteIndex, setExpandedTasteIndex] = useState(false);
  const [expandedProductionCompanies, setExpandedProductionCompanies] = useState(false);
  const [ratingMode, setRatingMode] = useState('Count');
  const [genreTasteIndexAvg, setGenreTasteIndexAvg] = useState({});
  const [includeWatchlist, setIncludeWatchlist] = useState(false);


  useEffect(() => {
    calculateMetrics();
  }, [movies, ratingMode, includeWatchlist]);


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
    let genreTasteIndexSum = {};
    let actorCounts = {};
    let genreRatingSum = {};
    let genreMovieCount = {};
    let actorRatingSum = {};
    let actorMovieCount = {};
    let durationSum = 0;
    let directorCounts = {};
    let directorRatingSum = {};
    let directorMovieCount = {};
    let productionCompanyCounts = {};
    let productionCompanyRatingSum = {};
    let productionCompanyMovieCount = {};

    movies.forEach(movie => {
      if (includeWatchlist || movie.Status !== 'Watchlist') {
        const movieRating = parseFloat(movie.Rating) || 0;
        const genres = movie.Genre ? movie.Genre.split(', ') : [];
        const actors = movie.Cast ? movie.Cast.split(', ') : [];
        const director = movie.Director;
        const productionCompanies = movie['production_company'] ? movie['production_company'].split(', ') : [];

        const userRatingScaled = parseFloat(movie.Rating) * 2; // Scale to 1-10
        const publicRating = parseFloat(movie['Avg vote']);

        const tasteIndex = userRatingScaled > 0 ? userRatingScaled / publicRating : 0;


        genres.forEach(genre => {
          if (ratingMode === 'Count') {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          } else {
            genreRatingSum[genre] = (genreRatingSum[genre] || 0) + movieRating;
          }
          genreMovieCount[genre] = (genreMovieCount[genre] || 0) + 1;
          genreTasteIndexSum[genre] = (genreTasteIndexSum[genre] || 0) + tasteIndex;
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

        productionCompanies.forEach((company) => {
          if (ratingMode === 'Count') {
            productionCompanyCounts[company] = (productionCompanyCounts[company] || 0) + 1;
          } else {
            productionCompanyRatingSum[company] = (productionCompanyRatingSum[company] || 0) + movieRating;
          }
          productionCompanyMovieCount[company] = (productionCompanyMovieCount[company] || 0) + 1;
        });

        if (movie.Duration) {
          durationSum += parseDuration(movie.Duration);
        }
      }

    });

    if (ratingMode === 'Count') {
      setTopGenres(Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorCounts).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
      setTopProductionCompanies(Object.entries(productionCompanyCounts).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
    } else if (ratingMode === 'Simple Rating' || ratingMode === 'Balanced Rating') {
      setTopGenres(Object.entries(genreRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
      setTopProductionCompanies(Object.entries(productionCompanyRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
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

      const avgProductionCompanyRatings = {};
      for (const company in productionCompanyRatingSum) {
        if (productionCompanyMovieCount[company] >= minMoviesForMetrics) {
          avgProductionCompanyRatings[company] = (productionCompanyRatingSum[company] / productionCompanyMovieCount[company]).toFixed(2);
        }
      }
      setTopProductionCompanies(Object.entries(avgProductionCompanyRatings).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
    }
    setTotalDuration(formatDuration(durationSum));

    const genreTasteIndexAvg = {};

    Object.keys(genreTasteIndexSum).forEach(genre => {
      genreTasteIndexAvg[genre] = (genreTasteIndexSum[genre] / genreMovieCount[genre]).toFixed(3);
    });
    setGenreTasteIndexAvg(Object.entries(genreTasteIndexAvg)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [genre, avg]) => ({ ...acc, [genre]: avg }), {}));
    // setGenreTasteIndexAvg(genreTasteIndexAvg);


  };

  const handleRatingModeChange = (event) => {
    setRatingMode(event.target.value);
  };


  const handleExpandClickMain = () => {
    setExpandedMain(!expandedMain);
  };

  const handleExpandClickGenres = () => {
    setExpandedGenres(!expandedGenres);
  };

  const handleExpandClickTasteIndex = () => {
    setExpandedTasteIndex(!expandedTasteIndex);
  };

  const handleExpandClickActors = () => {
    setExpandedActors(!expandedActors);
  };

  const handleExpandClickDirectors = () => {
    setExpandedDirectors(!expandedDirectors);
  };

  const handleExpandClickProductionCompanies = () => {
    setExpandedProductionCompanies(!expandedProductionCompanies);
  };

  return (
    <Box sx={{ my: 4, borderRadius: 1, position: 'relative' }}>
      <Box display="flex" justifyContent="flex-start" alignItems="center">
        <ExpandMoreIcon onClick={handleExpandClickMain}
          style={{
            color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedMain ? 'rotate(0deg)' : 'rotate(270deg)',
            transition: 'transform 0.3s'
          }} />

        <Typography onClick={handleExpandClickMain} variant="h6" style={{ color: movieMetricsHeadingColor }}>{metricsHeading}</Typography>
      </Box>
      <Collapse in={expandedMain} timeout="auto" unmountOnExit>
        <Box display="flex" jjustifyContent="flex-start" alignItems="center" style={{ margin: '10px 0' }}>

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

          <FormControlLabel
            control={
              <Checkbox
                checked={includeWatchlist}
                onChange={(event) => setIncludeWatchlist(event.target.checked)}
                name="includeWatchlist"
                color="primary"
              />
            }
            label="Include Watchlist"
            style={{ margin: '10px' }} // Adjust styling as needed
          />
        </Box>



        <Box style={{ paddingBottom: '15px' }}>
          <Box display="flex" >
            <ExpandMoreIcon
              onClick={handleExpandClickGenres}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedGenres ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />
            <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickGenres}>Top {topGenresNumber} Genres:</Typography>
          </Box>
          <Collapse in={expandedGenres} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {topGenres.map(([genre, count], index) => (
                <Grid item key={genre}>
                  <Typography variant="body1" style={{ color: 'inherit' }}>
                    {index + 1}. {genre}: {count}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>

        {/* Top 5 Actors */}
        <Box style={{ paddingBottom: '15px' }}>
          <Box display="flex" >
            <ExpandMoreIcon
              onClick={handleExpandClickActors}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedActors ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />
            <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickActors}>Top {topActorsNumber} Actors:</Typography>
          </Box>
          <Collapse in={expandedActors} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {topActors.map(([actor, count], index) => (
                <Grid item key={actor}>
                  <Typography variant="body1" style={{ color: 'inherit' }}>
                    {index + 1}. {actor}: {count}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
        <Box style={{ paddingBottom: '15px' }}>
          <Box display="flex" >
            <ExpandMoreIcon
              onClick={handleExpandClickDirectors}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedDirectors ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />
            <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickDirectors}>Top {topDirectorsNumber} Directors:</Typography>
          </Box>
          <Collapse in={expandedDirectors} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {topDirectors.map(([director, count], index) => (
                <Grid item key={director}>
                  <Typography variant="body1" style={{ color: 'inherit' }}>
                    {index + 1}. {director}: {count}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>

        <Box style={{ paddingBottom: '15px' }}>
          <Box display="flex">
            <ExpandMoreIcon
              onClick={handleExpandClickProductionCompanies}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedProductionCompanies ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />
            <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickProductionCompanies}>Top {topProductionCompaniesNumber} Production Companies:</Typography>
          </Box>
          <Collapse in={expandedProductionCompanies} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {topProductionCompanies.map(([company, count], index) => (
                <Grid item key={company}>
                  <Typography variant="body1" style={{ color: 'inherit' }}>
                    {index + 1}. {company}: {count}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>

        <Box style={{ paddingBottom: '15px' }}>
          <Box display="flex" >
            <ExpandMoreIcon
              onClick={handleExpandClickTasteIndex}
              style={{
                color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedTasteIndex ? 'rotate(0deg)' : 'rotate(270deg)',
                transition: 'transform 0.3s'
              }} />
            <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickTasteIndex}>Genre Taste Index:</Typography>
          </Box>
          <Collapse in={expandedTasteIndex} timeout="auto" unmountOnExit>
            <Grid container spacing={2}>
              {Object.entries(genreTasteIndexAvg).map(([genre, avgIndex], index) => (
                <Grid item key={genre}>
                  <Typography variant="body1" style={{ color: 'inherit' }}>
                    {index + 1}. {genre}: {avgIndex}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>

        {/* Total Duration */}
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Total Movie Watching Time: {totalDuration}</Typography>
      </Collapse>
    </Box>
  );
};

export default Metrics;
