import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { providerLogos } from './providerLogos';

const MovieGrid = ({ movies, selectedProperties, numberOfColumns, toggleFittedImage, movieCardColor, plugin }) => {


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

  function openFile(filePath) {

    plugin.app.workspace.openLinkText(filePath, '/', true);
  }

  // Function to parse provider names, handling both quoted and unquoted strings
  const parseProviders = (providersString) => {
    if (!providersString) return [];
    
    // Remove surrounding quotes if present
    const cleanString = providersString.replace(/^"|"$/g, '');
    
    // Split by comma and trim each provider name
    return cleanString.split(',').map(provider => provider.trim());
  };

  return (
    <Grid container spacing={2}>
      {movies.map((movie, index) => (
        <Grid key={index} xs={6} sm={12 / numberOfColumns} md={12 / numberOfColumns}>
          <Card onClick={() => openFile(movie.filePath)} style={{ margin: 8, backgroundColor: movieCardColor, color: 'inherit' }}>
            <CardMedia
              component="img"
              height="140"
              image={movie.Poster}
              alt={movie.Title}
              style={toggleFittedImage ? { objectFit: 'contain' } : {}}
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div" style={{ color: 'inherit' }}>
                {movie.Title}
              </Typography>
              {movie.Status !== 'Watchlist' && (
                <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                  Rating: {generateStars(movie.Rating)}
                </Typography>
              )}
              {movie.Type !== 'Movie' && plugin.settings.showEPSeen && movie.total_episodes && (movie.episodes_seen !== undefined && movie.episodes_seen !== null) && (
                <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                  Episodes: {movie.episodes_seen}/{movie.total_episodes}
                </Typography>
              )}
              {movie.Status === 'Watchlist' && (
                <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                  Status: {movie.Status}
                </Typography>
              )}
              {selectedProperties.map((prop) => (
                <Typography key={prop} variant="body2" color="inherit">
                  {`${prop}: ${movie[prop]}`}
                </Typography>
              ))}
              {movie['Available On'] && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {parseProviders(movie['Available On']).map((platform) => {
                      const logoUrl = providerLogos[platform];
                      return logoUrl ? (
                        <img
                          key={platform}
                          src={logoUrl}
                          alt={platform}
                          style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                          title={platform}
                        />
                      ) : null;
                    })}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MovieGrid;
