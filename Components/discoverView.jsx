import React, { useState } from 'react';
import { Container, Box, IconButton, Dialog, DialogActions, DialogContent, FormControl, InputLabel, MenuItem, Select, DialogTitle, Button, Checkbox, ListItemText, OutlinedInput, Grid, Card, CardMedia, CardContent, Typography, CardActionArea } from '@mui/material';
import { Platform } from "obsidian";
import MovieCard from "./recommendationMovieCard"


const DiscoverPopup = ({ open, onClose, genres, movies, themeMode, movieCardColor, apiKey }) => {
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedType, setSelectedType] = useState('Movie');
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedMovies, setSelectedMovies] = useState([]);
    const [selectedLogicalOperator, setSelectedLogicalOperator] = useState('OR');
    const [recommendations, setRecommendations] = useState([]);
    const [showRecommendations, setShowRecommendations] = useState(false);
    // const [selectedCountry, setSelectedCountry] = useState('CA');

    const applyFilters = () => {
        const filtered = movies.filter(movie => {
            // Exclude movies with Status 'Watchlist'
            if (movie.Status === 'Watchlist') {
                return false;
            }
            if (movie.Genre) {
                const genreMatch = selectedGenres.reduce((acc, genre) => {
                    if (selectedLogicalOperator === 'OR') {
                        return acc || movie.Genre.split(', ').includes(genre);
                    } else { // 'AND' logic
                        return acc && movie.Genre.split(', ').includes(genre);
                    }
                }, selectedLogicalOperator === 'OR' ? false : true);

                const matchesType = selectedType === movie.Type;
                return genreMatch && matchesType;
            }
        });

        setFilteredMovies(filtered);
    };

    async function fetchTMDBRecommendations(movieID, type) {
        const url = `https://api.themoviedb.org/3/${type}/${movieID}/recommendations?api_key=${apiKey}`;
        return fetch(url).then(response => response.json()); // Return the promise of the fetch request
    }

    const handleNext = async () => {
        if (!showResults) {
            applyFilters();
            setShowResults(true); // Switch to results view
        } else {
            //console.log("Getting recommendations");
            let allRecommendations = [];

            // Map over selectedMovies to get all promises of recommendations
            const recommendationPromises = selectedMovies.map(movie => {
                const type = selectedType === 'Movie' ? 'movie' : 'tv';
                return fetchTMDBRecommendations(movie['TMDB ID'], type); // fetchTMDBRecommendations should return a Promise
            });

            // Wait for all promises to resolve
            try {
                const recommendationResults = await Promise.all(recommendationPromises);
                recommendationResults.forEach((result, index) => {
                    console.log(`Recommendations for movie ${index + 1}:`, result);
                });
                recommendationResults.forEach((response, index) => {
                    if (response.results && response.results.length) {
                        // console.log(`Recommendations for movie ${index + 1}:`, response.results);
                        allRecommendations.push(...response.results);
                    } else {
                        console.log(`No recommendations found for movie ${index + 1}`);
                    }
                });

                // Process the recommendations to count occurrences and calculate average rating and popularity
                const movieStats = processRecommendations(allRecommendations);
                const uniqueRecommendations = filterRecommendations(movieStats);
                // console.log(`Unique movie statistics:`, uniqueRecommendations);

                // Sort the array based on the criteria: occurrence, then avg rating, then popularity
                const sortedMovies = sortMovies(uniqueRecommendations);

                // Log the top 10 movies
                // console.log(sortedMovies.slice(0, 10));
                setRecommendations(sortedMovies.slice(0, 10));
                setShowRecommendations(true);
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            }

        }
    };
    const processRecommendations = (recommendations) => {
        // Create an object to keep track of occurrences, and store additional movie information
        const statsObj = {};

        // Create a set of selected movies' TMDB IDs for quick lookup
        const selectedMovieIds = new Set(selectedMovies.map(movie => movie['TMDB ID']));

        recommendations.forEach(recommendation => {
            const { id, vote_average, popularity, backdrop_path, overview, vote_count } = recommendation;

            console.log(`Processing recommendation:`, recommendation);

            if (statsObj.hasOwnProperty(id)) {
                let movie = statsObj[id];
                movie.occurrences += 1;
                console.log(`Updated movie stats (occurrences):`, movie);
            } else {
                statsObj[id] = {
                    id: id, // Store the ID
                    occurrences: 1,
                    rating: vote_average, // Directly use vote_average
                    popularity: popularity,
                    title: recommendation.title || recommendation.name, // Depending on movie or TV series
                    backdropPath: backdrop_path,
                    overview: overview,
                    voteCount: vote_count,
                    watchlist: false
                };
                console.log(`New movie added to stats:`, statsObj[id]);
            }
        });



        // Convert the stats object into an array
        const moviesArray = Object.values(statsObj);
        console.log(`Processed movie statistics:`, moviesArray);

        return moviesArray;
    };

    const filterRecommendations = (processedRecommendations) => {
        // Convert movies to a map for easy access by TMDB ID, including their status
        const moviesMap = new Map(movies.map(movie => [movie['TMDB ID'].toString(), movie]));

        const filteredAndAdjustedRecommendations = processedRecommendations.map(recommendation => {
            const movie = moviesMap.get(recommendation.id.toString());
            if (movie) {
                if (movie.Status === 'Watchlist') {
                    // If the movie is on the watchlist, increase its occurrences but don't exclude it
                    return {
                        ...recommendation,
                        occurrences: recommendation.occurrences + 3,
                        watchlist: true
                    };
                } else {
                    // If the movie has any status other than 'Watchlist', mark it to be excluded
                    return {
                        ...recommendation,
                        exclude: true
                    };
                }
            }
            // If the movie isn't found in the moviesMap, it means it's not excluded based on ID
            return recommendation;
        }).filter(recommendation => !recommendation.exclude); // Exclude movies marked for exclusion

        // Remove the temporary 'exclude' property from the recommendations
        const finalRecommendations = filteredAndAdjustedRecommendations.map(({ exclude, ...rest }) => rest);

        return finalRecommendations;
    };


    const sortMovies = (movieStats) => {
        return movieStats.sort((a, b) => {
            // First, sort by occurrences. More occurrences come first.
            if (a.occurrences !== b.occurrences) {
                return b.occurrences - a.occurrences;
            }
            // If occurrences are the same, then sort by avgRating. Higher ratings come first.
            else if (a.rating !== b.rating) {
                return b.rating - a.rating;
            }
            // If both occurrences and avgRating are the same, you could keep their order as is
            // or use any other property for further sorting. Assuming no further criteria is needed.
            return 0; // Keep existing order if occurrences and avgRating are the same.
        });
    };

    const handleGenreChange = (event) => {
        const {
            target: { value },
        } = event;

        setSelectedGenres(typeof value === 'string' ? value.split(',') : value);
    };

    const handleMovieSelect = (movie) => {
        setSelectedMovies((prevSelected) => {
            if (prevSelected.find(selectedMovie => selectedMovie.Title === movie.Title)) {
                return prevSelected.filter(selectedMovie => selectedMovie.Title !== movie.Title); // Deselect if already selected
            } else {
                return [...prevSelected, movie]; // Select if not already selected
            }
        });
    };

    const isMovieSelected = (movie) => {
        return selectedMovies.some(selectedMovie => selectedMovie.Title === movie.Title);
    };

    const generateStars = (rating) => {
        let stars = '';
        for (let i = 0; i < Math.floor(rating); i++) {
            stars += '⭐'; // full star
        }
        if (rating % 1 !== 0) {
            stars += '✨'; // half star
        }
        return stars;
    };

    const resetStates = () => {
        setSelectedGenres([]);
        setSelectedType('Movie');
        setFilteredMovies([]);
        setShowResults(false);
        setSelectedMovies([]);
        setRecommendations([]);
        setShowRecommendations(false);
    };

    const textColor = themeMode === 'dark' ? '#fff' : '#000';
    const isMobile = Platform.isMobile;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" sx={{
            '& .MuiPaper-root': {
                backgroundColor: themeMode === 'dark' ? '#333' : '#d3d3d3',
                color: textColor,
                position: 'relative',
            }
        }}>
            <DialogTitle>{showResults ? 'What are you in mood for? Please select similar movies from your library' : 'Discover'}</DialogTitle>
            <DialogContent>

                {!showResults ? (
                    <Container>

                        <Box sx={{ display: 'flex', flexDirection: 'Row', alignItems: 'center' }}>
                            <FormControl variant="outlined" sx={{ width: isMobile ? '50vw' : '10vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
                                <InputLabel sx={{ color: 'inherit' }}>Genres</InputLabel>
                                <Select
                                    multiple
                                    value={selectedGenres}
                                    onChange={handleGenreChange}
                                    input={<OutlinedInput label="Genres" />}
                                    renderValue={(selected) => selected.join(', ')}
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: 224,
                                                width: 150,
                                            },
                                        },
                                    }}
                                    sx={{
                                        color: 'inherit',
                                        '& .MuiSelect-select': { paddingLeft: '14px' },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                                        '& .MuiSvgIcon-root': { color: 'inherit' },
                                    }}
                                >
                                    {genres.map((genre) => (
                                        <MenuItem key={genre.id} value={genre.name}>
                                            <Checkbox checked={selectedGenres.indexOf(genre.name) > -1} />
                                            <ListItemText primary={genre.name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl variant="outlined" sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel sx={{ color: 'inherit' }}>Logic</InputLabel>
                                <Select
                                    value={selectedLogicalOperator}
                                    onChange={(e) => setSelectedLogicalOperator(e.target.value)}
                                    label="Logic"
                                    sx={{
                                        color: 'inherit',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                                    }}
                                >
                                    <MenuItem value="OR">OR</MenuItem>
                                    <MenuItem value="AND">AND</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <FormControl fullWidth margin="dense" variant="outlined">
                            {/* <InputLabel id="type-discover" style={{ color: textColor }} >Type</InputLabel> */}
                            <Select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                sx={{
                                    color: textColor,
                                    '& .MuiOutlinedInput-root': { backgroundColor: 'inherit', color: textColor },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                                }}
                            >
                                <MenuItem value="Movie">Movie</MenuItem>
                                <MenuItem value="Series">Series</MenuItem>
                            </Select>
                        </FormControl>
                    </Container>
                ) : showRecommendations ? (<Box sx={{ display: 'flex', overflowX: 'auto', mt: 2 }}>
                    {recommendations.map((movie, index) => (
                        <MovieCard
                            key={index}
                            movie={movie}
                            type={selectedType}
                            apiKey={apiKey}
                            onAddToWatchlist={(movie) => {
                                // Handle adding the movie to the watchlist
                                console.log("Adding to watchlist:", movie.title);
                                // Potentially update state or call an API here
                            }}

                        />
                    ))}
                </Box>
                ) : (
                    <Container>
                        <div style={{ position: 'sticky', top: 0, backgroundColor: themeMode === 'dark' ? '#333' : '#d3d3d3', zIndex: 1 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ color: textColor, mb: 2 }}>
                                {filteredMovies.length} results in your library
                            </Typography>
                            {selectedMovies.length > 0 && (
                                <Typography variant="subtitle1" gutterBottom sx={{ color: textColor, mb: 2 }}>
                                    Selected: {selectedMovies.map(movie => movie.Title).join(', ')}
                                </Typography>
                            )}
                        </div>

                        <Grid container spacing={4}>
                            {filteredMovies.map((movie, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={2} key={index}> {/* Responsive grid items */}
                                    <Card style={{ margin: isMobile ? '2' : '8', backgroundColor: movieCardColor, color: 'inherit', position: 'relative' }} onClick={() => handleMovieSelect(movie)}>

                                        <CardMedia
                                            component="img"
                                            height="auto"  // Adjust height to 'auto' or a specific value
                                            image={movie.Poster}
                                            alt={movie.Title}
                                            style={{ objectFit: 'contain' }} // Ensure the image takes up the whole area
                                        />
                                        <CardContent>
                                            <Typography gutterBottom variant="h6" component="div" style={{ color: 'inherit' }}>
                                                {movie.Title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                                                Rating: {generateStars(movie.Rating)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                                                Genres: {movie.Genre}
                                            </Typography>
                                        </CardContent>
                                        {isMovieSelected(movie) && (
                                            <IconButton onClick={(e) => {
                                                e.stopPropagation();
                                                handleMovieSelect(movie);
                                            }} sx={{ position: 'absolute', bottom: 0, right: 0, color: 'primary.main', zIndex: 2, transform: 'scale(1.5)' }}>
                                                <Checkbox checked iconStyle={{ fill: 'white' }} />
                                            </IconButton>
                                        )}

                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Container>
                )}

            </DialogContent>
            <DialogActions>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: 2 }}>
                    {/* <FormControl variant="outlined" size="small">
                        <InputLabel>Country for Available on</InputLabel>
                        <Select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            label="Country"
                        >
                          
                            <MenuItem value="US">United States</MenuItem>
                            <MenuItem value="CA">Canada</MenuItem>
                            <MenuItem value="IN">India</MenuItem>
                           
                        </Select>
                    </FormControl> */}
                </Box>
                {showResults && (
                    <Button onClick={() => {
                        resetStates();
                        onClose(); // Close the dialog after reset
                    }} color="secondary">
                        Cancel
                    </Button>
                )}
                <Button onClick={handleNext}>{showResults ? 'Discover new' : 'Next'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DiscoverPopup;
