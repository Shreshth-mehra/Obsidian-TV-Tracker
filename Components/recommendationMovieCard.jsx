import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';

const MovieCard = ({ movie, onAddToWatchlist, type, apiKey }) => {
    const [expanded, setExpanded] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [castList, setCastList] = useState([]);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    const getShortOverview = (overview) => {
        const words = overview.split(' ');
        if (words.length > 15) {
            return `${words.slice(0, 15).join(' ')}...`;
        }
        return overview;
    };

    useEffect(() => {
        const baseUrl = 'https://api.themoviedb.org/3';
        let trailerUrl, castUrl;

        if (type === 'Movie') {
            trailerUrl = `${baseUrl}/movie/${movie.id}/videos?api_key=${apiKey}&language=en-US`;
            castUrl = `${baseUrl}/movie/${movie.id}/credits?api_key=${apiKey}`;
        } else if (type === 'Series') {
            trailerUrl = `${baseUrl}/tv/${movie.id}/videos?api_key=${apiKey}&language=en-US`;
            castUrl = `${baseUrl}/tv/${movie.id}/credits?api_key=${apiKey}`;
        } else {
            console.error('Unsupported type');
            return;
        }

        // Fetch Trailer
        const fetchTrailer = async () => {
            try {
                const response = await fetch(trailerUrl);
                const data = await response.json();
                const trailer = data.results.find(video => video.type === 'Trailer');
                if (trailer) {
                    setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
                }
            } catch (error) {
                console.error('Error fetching trailer:', error);
            }
        };

        // Fetch Cast
        const fetchCast = async () => {
            try {
                const response = await fetch(castUrl);
                const data = await response.json();
                if (data.cast && Array.isArray(data.cast)) {
                    setCastList(data.cast.slice(0, 5));
                }
            } catch (error) {
                console.error('Error fetching cast:', error);
            }
        };

        fetchTrailer();
        fetchCast();
    }, [movie.id, type]); // Dependency array ensures this effect runs when movie.id or type changes

    return (
        <Card sx={{ display: 'flex', flexDirection: 'column', minWidth: 200, margin: '0 8px' }}>
            <CardMedia
                component="img"
                image={`https://image.tmdb.org/t/p/w500${movie.backdropPath}`}
                alt={movie.title}
                height="140"
            />
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" sx={{ color: 'inherit' }}>
                    {movie.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ color: 'inherit', cursor: 'pointer' }} onClick={toggleExpand}>
                    {expanded ? movie.overview : getShortOverview(movie.overview)}
                    <ExpandMoreIcon size="small" />
                </Typography>
                <Typography variant="body2" sx={{ color: 'inherit', paddingTop: '10px' }} >
                    Rating: {movie.rating} | Popularity: {movie.popularity}
                </Typography>
                {trailerUrl && (
                    <Typography variant="body2" sx={{ color: 'lightblue', paddingTop: '10px' }}>
                        <a href={trailerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'lightblue', display: 'flex', alignItems: 'center' }}>
                            Trailer <LinkIcon fontSize="small" style={{ marginLeft: '5px' }} />
                        </a>
                    </Typography>
                )}
                {castList.length > 0 && (
                    <Typography variant="body2" sx={{ color: 'inherit', paddingTop: '10px' }}>
                        Cast: {castList.map((cast, index) => (
                            <React.Fragment key={index}>
                                {cast.name}{index < castList.length - 1 ? ', ' : ''}
                            </React.Fragment>
                        ))}
                    </Typography>
                )}
            </CardContent>
            <Box sx={{ padding: '10px' }}>
                {!movie.watchlist ? (
                    <Button variant="outlined" size="small" style={{ color: 'inherit' }} onClick={() => onAddToWatchlist(movie)}>
                        Add to Watchlist
                    </Button>) : (
                    <Button variant="outlined" size="small" style={{ color: 'inherit' }}>
                        Already in Watchlist
                    </Button>

                )
                }
            </Box>
        </Card>
    );
};

export default MovieCard;
