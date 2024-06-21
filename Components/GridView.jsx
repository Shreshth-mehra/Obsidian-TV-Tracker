import React from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';


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
    // console.log("Path is " + filePath);
    plugin.app.workspace.openLinkText(filePath, '/', true);
  }

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
              <Typography variant="body2" color="text.secondary" style={{ color: 'inherit' }}>
                Status: {movie.Status}
              </Typography>
              {selectedProperties.map((prop) => (
                <Typography key={prop} variant="body2" color="inherit">
                  {`${prop}: ${movie[prop]}`}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MovieGrid;
