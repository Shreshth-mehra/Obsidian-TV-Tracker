// AddMovieDialog.jsx
import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Select, MenuItem, FormControl, InputLabel, Slider } from "@mui/material";




const AddMovieDialog = ({ open, handleClose, handleAddMovie, themeMode }) => {

  const [movieName, setMovieName] = useState('');
  const [movieRating, setMovieRating] = useState('');
  const [movieStatus, setMovieStatus] = useState('Watched');
  const [movieType, setMovieType] = useState('Movie');


  const handleSubmit = () => {

    handleAddMovie({
      name: movieName,
      rating: movieRating,
      status: movieStatus,
      type: movieType
    });
    handleClose();
  };

  const textColor = themeMode === 'dark' ? '#fff' : '#000';
  const textBoxColor = themeMode === 'dark' ? '#ffffff' : 'inherit';

  return (
    <Dialog open={open} onClose={handleClose} sx={{
      '& .MuiPaper-root': {
        backgroundColor: themeMode === 'dark' ? '#333' : '#d3d3d3',
        color: textColor,
        position: 'relative',
      }
    }}>
      <DialogTitle >Add New Movie</DialogTitle>
      <DialogContent >
        <TextField
          margin="dense"
          id="name"
          label="Name"
          fullWidth
          variant="outlined"
          value={movieName}
          InputLabelProps={{ style: { color: textColor } }}
          sx={{
            input: { color: textColor },
            '& .MuiOutlinedInput-root': { backgroundColor: textColor }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: textColor },
          }}


          onChange={(e) => setMovieName(e.target.value)}
        />
        <Box sx={{ width: '100%', margin: 'dense' }}>
          <Typography id="rating-slider" gutterBottom>
            Rating
          </Typography>
          <Slider
            aria-labelledby="rating-slider"
            value={typeof movieRating === 'number' ? movieRating : 0}
            onChange={(e, newValue) => setMovieRating(newValue)}
            step={0.5}
            marks
            min={0}
            max={5}
            valueLabelDisplay="auto"
            sx={{
              '& .MuiSlider-thumb': {
                color: textColor, // Custom thumb color
              },
              '& .MuiSlider-track': {
                color: textColor, // Custom track color
              },
              '& .MuiSlider-rail': {
                color: '#bfbfbf', // Custom rail color
              },
              '& .MuiSlider-mark': {
                color: textColor, // Custom mark color
                backgroundColor: textColor, // Custom mark background color if needed
              },
              '& .MuiSlider-markLabel': {
                color: textColor, // Custom mark label color
              },
            }}
          />
        </Box>
        <TextField
          margin="dense"
          id="status"
          label="Status"
          fullWidth
          variant="outlined"
          value={movieStatus}
          InputLabelProps={{ style: { color: textColor } }}
          sx={{
            input: { color: textColor },
            '& .MuiOutlinedInput-root': { backgroundColor: textColor }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: textColor },
          }}
          onChange={(e) => setMovieStatus(e.target.value)}
        />
        <FormControl fullWidth margin="dense" variant="outlined">
          <InputLabel id="type-label" style={{ color: textColor }}>Type</InputLabel>
          <Select
            labelId="type-label"
            id="type"
            value={movieType}
            onChange={(e) => setMovieType(e.target.value)}
            label="Type"
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
      </DialogContent>
      <DialogActions >
        <Button onClick={handleClose} style={{ color: 'inherit' }}>Cancel</Button>
        <Button onClick={handleSubmit} style={{ color: 'inherit' }}>Add</Button>
      </DialogActions>

    </Dialog>
  );
};

export default AddMovieDialog;
