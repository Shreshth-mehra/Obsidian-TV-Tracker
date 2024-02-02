// AddMovieDialog.jsx
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Select, MenuItem, FormControl, InputLabel } from "@mui/material";




const AddMovieDialog = ({ open, handleClose, handleAddMovie, themeMode }) => {

  const [movieName, setMovieName] = useState('');
  const [movieRating, setMovieRating] = useState('');
  const [movieStatus, setMovieStatus] = useState('Watched');
  const [movieType, setMovieType] = useState('Movie');


  const handleSubmit = () => {
    // Here you would call the TMDB API to fetch movie details
    // For now, we will just call handleAddMovie with the input values
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
        <TextField

          margin="dense"
          id="rating"
          label="Rating"
          fullWidth
          variant="outlined"
          value={movieRating}
          InputLabelProps={{ style: { color: textColor } }}
          sx={{
            input: { color: textColor },
            '& .MuiOutlinedInput-root': { backgroundColor: textColor }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: textColor },
          }}
          onChange={(e) => setMovieRating(e.target.value)}
        />
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
