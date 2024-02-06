import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const MovieCard = ({ movie, onAddToWatchlist }) => {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        setExpanded(!expanded);
    };

    const getShortOverview = (overview) => {
        const words = overview.split(' ');
        if (words.length > 30) {
            return `${words.slice(0, 30).join(' ')}...`;
        }
        return overview;
    };

    return (
        <Card sx={{ minWidth: 200, margin: '0 8px', position: 'relative' }}>
            <CardMedia
                component="img"
                image={`https://image.tmdb.org/t/p/w500${movie.backdropPath}`}
                alt={movie.title}
                height="140"
            />
            <CardContent>
                <Typography gutterBottom variant="h6" component="div" sx={{ color: 'inherit' }}>
                    {movie.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" onClick={toggleExpand} sx={{ color: 'inherit', padding: '10px' }} >
                    {expanded ? movie.overview : getShortOverview(movie.overview)}
                    <ExpandMoreIcon onClick={toggleExpand} size="small" />
                </Typography>
                <Typography variant="body2" sx={{ color: 'inherit' }} >
                    Rating: {movie.rating} | Popularity: {movie.popularity}
                </Typography>
            </CardContent>
            <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                <Button variant="outlined" size="small" onClick={() => onAddToWatchlist(movie)}>
                    Add to Watchlist
                </Button>
            </Box>
        </Card>
    );
};

export default MovieCard