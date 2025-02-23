import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Collapse, Switch, FormControlLabel, IconButton, Checkbox, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandableSection from './expandableSection';

const Metrics = ({
  movies,
  themeMode,
  plugin
}) => {

  const {
    topActorsNumber,
    topGenresNumber,
    topDirectorsNumber,
    topProductionCompaniesNumber,
    topCollectionsNumber,
    topPerformersNumber,
    topYearsNumber,
    minMoviesForMetricsYears,
    minMoviesForMetrics,
    minMoviesForMetricsCollections,
    minMoviesForMetricsDirectors,
    movieMetricsHeadingColor,
    movieMetricsSubheadingColor,
    hideBudgetMetrics,
    hideGenreTasteIndexMetrics,
    budgetMetricsSubheadingColor,
    metricsHeading,
    apiKey,
    maxMoviesFromCollection,
    clickForInfo
  } = plugin.settings;


  const [topGenres, setTopGenres] = useState([]);
  const [topActors, setTopActors] = useState([]);
  const [totalActors, setTotalActors] = useState(0);
  const [totalDirectors, setTotalDirectors] = useState(0);
  const [totalProductionCompanies, setTotalProductionCompanies] = useState(0);
  const [topYears, setTopYears] = useState([]);
  const [topActorIndices, setTopActorIndices] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalTVDuration, setTotalTVDuration] = useState(0);
  const [topDirectors, setTopDirectors] = useState([]);
  const [topProductionCompanies, setTopProductionCompanies] = useState([]);
  const [topCollections, setTopCollections] = useState([]);
  const [underperformers, setUnderperformers] = useState([]);
  const [overperformers, setOverperformers] = useState([]);
  const [highestBudgets, setHighestBudgets] = useState([]);
  const [lowestBudgets, setLowestBudgets] = useState([]);
  const [mostRevenue, setMostRevenue] = useState([]);
  const [leastRevenue, setLeastRevenue] = useState([]);
  const [expandedMain, setExpandedMain] = useState(true);
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [expandedActors, setExpandedActors] = useState(false);
  const [expandedDirectors, setExpandedDirectors] = useState(false);
  const [expandedYears, setExpandedYears] = useState(false);
  const [expandedTasteIndex, setExpandedTasteIndex] = useState(false);
  const [expandedProductionCompanies, setExpandedProductionCompanies] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState(false);
  const [expandedBudgetMetrics, setExpandedBudgetMetrics] = useState(false);
  const [expandedUnderperformers, setExpandedUnderperformers] = useState(false);
  const [expandedOverperformers, setExpandedOverperformers] = useState(false);
  const [expandedHighestBudgets, setExpandedHighestBudgets] = useState(false);
  const [expandedLowestBudgets, setExpandedLowestBudgets] = useState(false);
  const [expandedMostRevenue, setExpandedMostRevenue] = useState(false);
  const [expandedLeastRevenue, setExpandedLeastRevenue] = useState(false);
  const [ratingMode, setRatingMode] = useState('Count');
  const [genreTasteIndexAvg, setGenreTasteIndexAvg] = useState({});
  const [includeWatchlist, setIncludeWatchlist] = useState(false);

  // useEffect(() => {
  //   setRatingMode('Combined Score');
  //   calculateMetrics();
  //   setRatingMode('Count');
  // }, [movies]);

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

    let genreTasteIndexSum = {};

    let genreRatingSum = {};
    let genreMovieCount = {};
    let actorRatingSum = {};
    let actorMovieCount = {};

    let actorMovieCountFromCollection = {};
    let durationSum = 0;
    let tvDurationSum = 0;

    let directorRatingSum = {};
    let directorMovieCount = {};

    let productionCompanyRatingSum = {};
    let productionCompanyMovieCount = {};

    let collectionRatingSum = {};
    let collectionMovieCount = {};
    let underperformersList = [];
    let overperformersList = [];
    let highestBudgetsList = [];
    let lowestBudgetsList = [];
    let mostRevenueList = [];
    let leastRevenueList = [];

    const avgGenreRatings = {};
    const avgActorRatings = {};
    const avgDirectorRatings = {};
    const avgProductionCompanyRatings = {};
    const avgCollectionRatings = {};

    const blockbusterActorCount = {};
    const blockbusterDirectorCount = {};
    const blockbusterGenreCount = {};
    const blockbusterProductionCompanyCount = {};
    const blockbusterYearCount = {};


    const weightCount = 1;
    const weightRating = 1;
    const weightAvgRating = 1;
    const weightTasteIndex = 1;

    // New data structures for top years
    let yearMovieCount = {};
    let yearRatingSum = {};

    movies.forEach(movie => {
      if (includeWatchlist || movie.Status !== 'Watchlist') {
        const movieRating = parseFloat(movie.Rating) || 0;
        const genres = movie.Genre ? movie.Genre.split(', ') : [];
        const actors = movie.Cast ? movie.Cast.split(', ') : [];
        const director = movie.Director;
        const productionCompanies = movie['production_company'] ? movie['production_company'].split(', ') : [];
        const collection = movie['belongs_to_collection'];

        const userRatingScaled = parseFloat(movie.Rating) * 2; // Scale to 1-10
        const publicRating = parseFloat(movie['Avg vote']);

        const tasteIndex = userRatingScaled > 0 ? userRatingScaled / publicRating : 0;

        // Extract the year from release_date
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : null;

        if (movieRating >= plugin.settings.BlockBusterDefinition) {
          // Count for actors
          actors.forEach(actor => {
            blockbusterActorCount[actor] = (blockbusterActorCount[actor] || 0) + 1;
          });

          // Count for directors
          if (director) {
            blockbusterDirectorCount[director] = (blockbusterDirectorCount[director] || 0) + 1;
          }

          // Count for genres
          genres.forEach(genre => {
            blockbusterGenreCount[genre] = (blockbusterGenreCount[genre] || 0) + 1;
          });

          // Count for production companies
          productionCompanies.forEach(company => {
            blockbusterProductionCompanyCount[company] = (blockbusterProductionCompanyCount[company] || 0) + 1;
          });

          // Count for years
          if (releaseYear) {
            blockbusterYearCount[releaseYear] = (blockbusterYearCount[releaseYear] || 0) + 1;
          }
        }


        if (releaseYear) {
          yearMovieCount[releaseYear] = (yearMovieCount[releaseYear] || 0) + 1;
          yearRatingSum[releaseYear] = (yearRatingSum[releaseYear] || 0) + movieRating;
        }

        genres.forEach(genre => {
          genreRatingSum[genre] = (genreRatingSum[genre] || 0) + movieRating;
          genreMovieCount[genre] = (genreMovieCount[genre] || 0) + 1;
          genreTasteIndexSum[genre] = (genreTasteIndexSum[genre] || 0) + tasteIndex;
        });

        actors.forEach((actor, index) => {
          let ratingMultiplier = movieRating;
          if (ratingMode === 'Balanced Rating' && index < 4) {
            ratingMultiplier *= 2;
          }
          actorRatingSum[actor] = (actorRatingSum[actor] || 0) + ratingMultiplier;
          actorMovieCount[actor] = (actorMovieCount[actor] || 0) + 1;

          if (!actorMovieCountFromCollection[actor]) {
            actorMovieCountFromCollection[actor] = {};
          }
          if (collection) {
            actorMovieCountFromCollection[actor][collection] = (actorMovieCountFromCollection[actor][collection] || 0) + 1;
          }


        });

        if (director) {
          directorRatingSum[director] = (directorRatingSum[director] || 0) + movieRating;
          directorMovieCount[director] = (directorMovieCount[director] || 0) + 1;
        }

        productionCompanies.forEach((company) => {
          productionCompanyRatingSum[company] = (productionCompanyRatingSum[company] || 0) + movieRating;
          productionCompanyMovieCount[company] = (productionCompanyMovieCount[company] || 0) + 1;
        });

        if (collection) {
          collectionRatingSum[collection] = (collectionRatingSum[collection] || 0) + movieRating;
          collectionMovieCount[collection] = (collectionMovieCount[collection] || 0) + 1;
        }

        if (movie.Duration) {
          durationSum += parseDuration(movie.Duration);
        }

        if (movie.episode_runtime && movie.episodes_seen) {
          tvDurationSum += (movie.episode_runtime * movie.episodes_seen);
        }

        if (movie.budget && movie.revenue) {
          const budget = parseFloat(movie.budget);
          const revenue = parseFloat(movie.revenue);
          if (budget > 0) {
            const ratio = revenue / budget;
            if (ratio < 1) {
              underperformersList.push({ title: movie.Title, ratio });
            } else {
              overperformersList.push({ title: movie.Title, ratio });
            }
            highestBudgetsList.push({ title: movie.Title, budget });
            lowestBudgetsList.push({ title: movie.Title, budget });
            mostRevenueList.push({ title: movie.Title, revenue });
            leastRevenueList.push({ title: movie.Title, revenue });
          }
        }
      }
    });

    setTotalActors(Object.keys(actorMovieCount).length);
    setTotalDirectors(Object.keys(directorMovieCount).length);
    setTotalProductionCompanies(Object.keys(productionCompanyMovieCount).length);

    if (ratingMode === 'Count') {
      setTopGenres(Object.entries(genreMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
      setTopProductionCompanies(Object.entries(productionCompanyMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
      setTopCollections(Object.entries(collectionMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topCollectionsNumber));
      setTopYears(Object.entries(yearMovieCount).sort((a, b) => b[1] - a[1]).slice(0, topYearsNumber));
    } else if (ratingMode === 'Simple Rating' || ratingMode === 'Balanced Rating') {
      setTopGenres(Object.entries(genreRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(actorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(directorRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
      setTopProductionCompanies(Object.entries(productionCompanyRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
      setTopCollections(Object.entries(collectionRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topCollectionsNumber));
      setTopYears(Object.entries(yearRatingSum).sort((a, b) => b[1] - a[1]).slice(0, topYearsNumber));
    } else if (ratingMode === 'Avg Rating') {
      for (const genre in genreRatingSum) {
        avgGenreRatings[genre] = (genreRatingSum[genre] / genreMovieCount[genre]).toFixed(2);
      }
      setTopGenres(Object.entries(avgGenreRatings).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));

      for (const director in directorRatingSum) {
        if (directorMovieCount[director] >= minMoviesForMetricsDirectors) {
          avgDirectorRatings[director] = (directorRatingSum[director] / directorMovieCount[director]).toFixed(2);
        }
      }
      setTopDirectors(Object.entries(avgDirectorRatings).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));

      for (const actor in actorRatingSum) {
        if (actorMovieCount[actor] >= minMoviesForMetrics) {
          avgActorRatings[actor] = (actorRatingSum[actor] / actorMovieCount[actor]).toFixed(2);
        }
      }
      setTopActors(Object.entries(avgActorRatings).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));

      for (const company in productionCompanyRatingSum) {
        if (productionCompanyMovieCount[company] >= minMoviesForMetricsDirectors) {
          avgProductionCompanyRatings[company] = (productionCompanyRatingSum[company] / productionCompanyMovieCount[company]).toFixed(2);
        }
      }
      setTopProductionCompanies(Object.entries(avgProductionCompanyRatings).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));

      for (const collection in collectionRatingSum) {
        if (collectionMovieCount[collection] >= minMoviesForMetricsCollections) {
          avgCollectionRatings[collection] = (collectionRatingSum[collection] / collectionMovieCount[collection]).toFixed(2);
        }
      }
      setTopCollections(Object.entries(avgCollectionRatings).sort((a, b) => b[1] - a[1]).slice(0, topCollectionsNumber));

      const avgYearRatings = {};
      for (const year in yearRatingSum) {
        if (yearMovieCount[year] >= minMoviesForMetricsYears) {
          avgYearRatings[year] = (yearRatingSum[year] / yearMovieCount[year]).toFixed(2);
        }
      }
      setTopYears(Object.entries(avgYearRatings).sort((a, b) => b[1] - a[1]).slice(0, topYearsNumber));
    }
    else if (ratingMode === 'Blockbuster Count') {
      setTopGenres(Object.entries(blockbusterGenreCount).sort((a, b) => b[1] - a[1]).slice(0, topGenresNumber));
      setTopActors(Object.entries(blockbusterActorCount).sort((a, b) => b[1] - a[1]).slice(0, topActorsNumber));
      setTopDirectors(Object.entries(blockbusterDirectorCount).sort((a, b) => b[1] - a[1]).slice(0, topDirectorsNumber));
      setTopProductionCompanies(Object.entries(blockbusterProductionCompanyCount).sort((a, b) => b[1] - a[1]).slice(0, topProductionCompaniesNumber));
      setTopYears(Object.entries(blockbusterYearCount).sort((a, b) => b[1] - a[1]).slice(0, topYearsNumber));
    }


    for (const genre in genreRatingSum) {
      avgGenreRatings[genre] = (genreRatingSum[genre] / genreMovieCount[genre]).toFixed(2);
    }
    for (const director in directorRatingSum) {
      if (directorMovieCount[director] >= minMoviesForMetricsDirectors) {
        avgDirectorRatings[director] = (directorRatingSum[director] / directorMovieCount[director]).toFixed(2);
      }
    }
    for (const actor in actorRatingSum) {

      let sumAboveThreshold = 0;
      for (const collection in actorMovieCountFromCollection[actor]) {
        sumAboveThreshold += Math.max(0, actorMovieCountFromCollection[actor][collection] - maxMoviesFromCollection);
      }
      // if (actorMovieCount[actor] > 10) {
      //   console.log("Actor is ", actor);
      //   console.log(actorMovieCount[actor]);
      //   console.log(actorMovieCountFromCollection[actor]);
      //   console.log(sumAboveThreshold);
      //   console.log((actorMovieCount[actor] - sumAboveThreshold));
      //   console.log("");
      // }
      // if ((actorMovieCount[actor] - sumAboveThreshold) >= minMoviesForMetrics) {
      //   avgActorRatings[actor] = (actorRatingSum[actor] / actorMovieCount[actor]).toFixed(2);
      // }
      if (actorMovieCount[actor] >= minMoviesForMetrics) {
        avgActorRatings[actor] = (actorRatingSum[actor] / actorMovieCount[actor]).toFixed(2);
      }


    }
    for (const company in productionCompanyRatingSum) {
      if (productionCompanyMovieCount[company] >= minMoviesForMetricsDirectors) {
        avgProductionCompanyRatings[company] = (productionCompanyRatingSum[company] / productionCompanyMovieCount[company]).toFixed(2);
      }
    }
    for (const collection in collectionRatingSum) {
      if (collectionMovieCount[collection] >= minMoviesForMetricsCollections) {
        avgCollectionRatings[collection] = (collectionRatingSum[collection] / collectionMovieCount[collection]).toFixed(2);
      }
    }

    const actorMovieCountSorted = Object.entries(actorMovieCount).sort((a, b) => b[1] - a[1]);
    const actorRatingSumSorted = Object.entries(actorRatingSum).sort((a, b) => b[1] - a[1]);
    const avgActorRatingSorted = Object.entries(avgActorRatings).sort((a, b) => b[1] - a[1]);

    function getAverageIndex(actorName) {
      const movieCountIndex = actorMovieCountSorted.findIndex(actor => actor[0] === actorName);
      const ratingSumIndex = actorRatingSumSorted.findIndex(actor => actor[0] === actorName);
      const avgRatingIndex = avgActorRatingSorted.findIndex(actor => actor[0] === actorName);

      const movieCountIndexSafe = movieCountIndex !== -1 ? movieCountIndex : 1000;
      const ratingSumIndexSafe = ratingSumIndex !== -1 ? ratingSumIndex : 1000;
      const avgRatingIndexSafe = avgRatingIndex !== -1 ? avgRatingIndex : 1000;

      return {
        averageIndex: (movieCountIndexSafe + ratingSumIndexSafe + avgRatingIndexSafe) / 3,
        countIndex: movieCountIndexSafe,
        sumIndex: ratingSumIndexSafe,
        avgRatIndex: avgRatingIndexSafe
      };
    }

    const topActorsx2 = actorMovieCountSorted.slice(0, topActorsNumber * 2).map(actor => actor[0]);

    const actorAverageIndexes = topActorsx2.map(actorName => {
      return {
        actor: actorName,
        averageIndex: getAverageIndex(actorName).averageIndex.toFixed(2)
      };
    });

    const detailedActorRanks = topActorsx2.map(actorName => {
      const { averageIndex, countIndex, sumIndex, avgRatIndex } = getAverageIndex(actorName);

      return {
        actor: actorName,
        averageIndex: averageIndex.toFixed(2),
        countIndex: countIndex,
        sumIndex: sumIndex,
        avgRatIndex: avgRatIndex
      };
    });

    // Sort the actors by their average index, lowest first
    actorAverageIndexes.sort((a, b) => a.averageIndex - b.averageIndex);
    detailedActorRanks.sort((a, b) => a.averageIndex - b.averageIndex);
    setTopActorIndices(detailedActorRanks);
    // Convert to the expected format of [actor, count] arrays
    const topActorsFormatted = actorAverageIndexes.slice(0, topActorsNumber).map(actor => [actor.actor, actor.averageIndex]);
    if (ratingMode === 'Combined Score') {
      setTopActors(topActorsFormatted);
    }

    setTotalDuration(formatDuration(durationSum));
    setTotalTVDuration(formatDuration(tvDurationSum));

    setUnderperformers(underperformersList.sort((a, b) => a.ratio - b.ratio).slice(0, topPerformersNumber));
    setOverperformers(overperformersList.sort((a, b) => b.ratio - a.ratio).slice(0, topPerformersNumber));
    setHighestBudgets(highestBudgetsList.sort((a, b) => b.budget - a.budget).slice(0, topPerformersNumber));
    setLowestBudgets(lowestBudgetsList.sort((a, b) => a.budget - b.budget).slice(0, topPerformersNumber));
    setMostRevenue(mostRevenueList.sort((a, b) => b.revenue - a.revenue).slice(0, topPerformersNumber));
    setLeastRevenue(leastRevenueList.sort((a, b) => a.revenue - b.revenue).slice(0, topPerformersNumber));

    const genreTasteIndexAvg = {};
    Object.keys(genreTasteIndexSum).forEach(genre => {
      genreTasteIndexAvg[genre] = (genreTasteIndexSum[genre] / genreMovieCount[genre]).toFixed(3);
    });
    setGenreTasteIndexAvg(Object.entries(genreTasteIndexAvg)
      .sort((a, b) => b[1] - a[1])
      .reduce((acc, [genre, avg]) => ({ ...acc, [genre]: avg }), {}));
  };



  function formatMoney(revenue) {
    if (revenue >= 1e9) {
      return (revenue / 1e9).toFixed(1) + 'Billion USD';
    } else if (revenue >= 1e6) {
      return (revenue / 1e6).toFixed(1) + 'Million USD';
    } else if (revenue >= 1e3) {
      return (revenue / 1e3).toFixed(0) + 'K USD';
    } else {
      return revenue.toFixed(2);
    }
  }


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

  const handleExpandClickYears = () => {
    setExpandedYears(!expandedYears);
  };

  const handleExpandClickProductionCompanies = () => {
    setExpandedProductionCompanies(!expandedProductionCompanies);
  };

  const handleExpandClickCollections = () => {
    setExpandedCollections(!expandedCollections);
  };

  const handleExpandClickBudgetMetrics = () => {
    setExpandedBudgetMetrics(!expandedBudgetMetrics);
  };

  const handleExpandClickUnderperformers = () => {
    setExpandedUnderperformers(!expandedUnderperformers);
  };

  const handleExpandClickOverperformers = () => {
    setExpandedOverperformers(!expandedOverperformers);
  };

  const handleExpandClickHighestBudgets = () => {
    setExpandedHighestBudgets(!expandedHighestBudgets);
  };

  const handleExpandClickLowestBudgets = () => {
    setExpandedLowestBudgets(!expandedLowestBudgets);
  };

  const handleExpandClickMostRevenue = () => {
    setExpandedMostRevenue(!expandedMostRevenue);
  };

  const handleExpandClickLeastRevenue = () => {
    setExpandedLeastRevenue(!expandedLeastRevenue);
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
        <Box display="flex" justifyContent="flex-start" alignItems="center" style={{ margin: '10px 0' }}>
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
              <MenuItem value="Blockbuster Count">Blockbuster Count</MenuItem>
              <MenuItem value="Combined Score">Combined Score</MenuItem>
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

        <ExpandableSection
          title={`Top ${topGenresNumber} Genres:`}
          items={topGenres.map(([genre, count]) => ({ genre, count }))}
          itemKey="genre"
          itemLabel="genre"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedGenres}
          onExpand={handleExpandClickGenres}

        />
        <ExpandableSection
          title={`Top ${topActorsNumber} Actors:`}
          items={topActors.map(([actor, count]) => ({ actor, count }))}
          topActorIndices={topActorIndices}
          itemKey="actor"
          itemLabel="actor"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedActors}
          onExpand={handleExpandClickActors}
          apiKey={apiKey}
          clickToView={clickForInfo}
        />
        <ExpandableSection
          title={`Top ${topDirectorsNumber} Directors:`}
          items={topDirectors.map(([director, count]) => ({ director, count }))}
          itemKey="director"
          itemLabel="director"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedDirectors}
          onExpand={handleExpandClickDirectors}
          apiKey={apiKey}
          clickToView={clickForInfo}

        />
        <ExpandableSection
          title={`Top ${topProductionCompaniesNumber} Production Companies:`}
          items={topProductionCompanies.map(([company, count]) => ({ company, count }))}
          itemKey="company"
          itemLabel="company"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedProductionCompanies}
          onExpand={handleExpandClickProductionCompanies}

        />
        <ExpandableSection
          title={`Top ${topCollectionsNumber} Collections:`}
          items={topCollections.map(([collection, count]) => ({ collection, count }))}
          itemKey="collection"
          itemLabel="collection"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedCollections}
          onExpand={handleExpandClickCollections}
        />
        <ExpandableSection
          title={`Top ${topYearsNumber} Years:`}
          items={topYears.map(([year, count]) => ({ year, count }))}
          itemKey="year"
          itemLabel="year"
          itemValue="count"
          headingColor={movieMetricsSubheadingColor}
          themeMode={themeMode}
          expanded={expandedYears}
          onExpand={handleExpandClickYears}

        />

        {!hideGenreTasteIndexMetrics && (
          <ExpandableSection
            title={`Genre Taste Index:`}
            items={Object.entries(genreTasteIndexAvg).map(([genre, avgIndex]) => ({ genre, avgIndex }))}
            itemKey="genre"
            itemLabel="genre"
            itemValue="avgIndex"
            headingColor={movieMetricsSubheadingColor}
            themeMode={themeMode}
            expanded={expandedTasteIndex}
            onExpand={handleExpandClickTasteIndex}

          />
        )}

        {!hideBudgetMetrics && (
          <Box style={{ paddingBottom: '15px' }}>
            <Box display="flex" >
              <ExpandMoreIcon
                onClick={handleExpandClickBudgetMetrics}
                style={{
                  color: themeMode === 'dark' ? 'white' : 'inherit', transform: expandedBudgetMetrics ? 'rotate(0deg)' : 'rotate(270deg)',
                  transition: 'transform 0.3s'
                }} />
              <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor, cursor: 'pointer' }} onClick={handleExpandClickBudgetMetrics}>Budget Metrics:</Typography>
            </Box>
            <Collapse in={expandedBudgetMetrics} timeout="auto" unmountOnExit>
              <Box style={{ paddingLeft: '15px' }}>
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Underperformers:`}
                  items={underperformers.map(({ title, ratio }) => ({ title, value: ratio.toFixed(2) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedUnderperformers}
                  onExpand={handleExpandClickUnderperformers}

                />
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Overperformers:`}
                  items={overperformers.map(({ title, ratio }) => ({ title, value: ratio.toFixed(2) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedOverperformers}
                  onExpand={handleExpandClickOverperformers}

                />
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Highest Budgets:`}
                  items={highestBudgets.map(({ title, budget }) => ({ title, value: formatMoney(budget) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedHighestBudgets}
                  onExpand={handleExpandClickHighestBudgets}

                />
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Lowest Budgets:`}
                  items={lowestBudgets.map(({ title, budget }) => ({ title, value: formatMoney(budget) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedLowestBudgets}
                  onExpand={handleExpandClickLowestBudgets}

                />
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Most Revenue:`}
                  items={mostRevenue.map(({ title, revenue }) => ({ title, value: formatMoney(revenue) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedMostRevenue}
                  onExpand={handleExpandClickMostRevenue}

                />
                <ExpandableSection
                  title={`Top ${topPerformersNumber} Least Revenue:`}
                  items={leastRevenue.map(({ title, revenue }) => ({ title, value: formatMoney(revenue) }))}
                  itemKey="title"
                  itemLabel="title"
                  itemValue="value"
                  themeMode={themeMode}
                  headingColor={budgetMetricsSubheadingColor}
                  expanded={expandedLeastRevenue}
                  onExpand={handleExpandClickLeastRevenue}

                />
              </Box>
            </Collapse>
          </Box>
        )}
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Total Movie Watching Time: {totalDuration}</Typography>
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Total Series Watching Time: {totalTVDuration}</Typography>
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Unique Actors: {totalActors}</Typography>
        <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Unique Directors: {totalDirectors}</Typography>
        {/* <Typography variant="subtitle1" style={{ color: movieMetricsSubheadingColor }}>Unique Production Companies: {totalProductionCompanies}</Typography> */}
      </Collapse>
    </Box>
  );
};

export default Metrics;
