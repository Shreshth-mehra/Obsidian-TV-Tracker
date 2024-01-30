// AddMovieDialog.jsx
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";



const AddMovieDialog = ({ open, handleClose, handleAddMovie }) => {

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

  return (
    <Dialog open={open} onClose={handleClose} sx={{
      '& .MuiPaper-root': {
        backgroundColor: '#333', // Dark background
        color: 'white'
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
          InputLabelProps={{ style: { color: 'white' } }}
          sx={{
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fffff' }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
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
          InputLabelProps={{ style: { color: 'white' } }}
          sx={{
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fffff' }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
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
          InputLabelProps={{ style: { color: 'white' } }}
          sx={{
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fffff' }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          }}
          onChange={(e) => setMovieStatus(e.target.value)}
        />
        <TextField
          margin="dense"
          id="type"
          label="Type"
          fullWidth
          variant="outlined"
          value={movieType}
          InputLabelProps={{ style: { color: 'white' } }}
          sx={{
            input: { color: 'white' },
            '& .MuiOutlinedInput-root': { backgroundColor: '#fffff' }, // Apply background here
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
          }}
          onChange={(e) => setMovieType(e.target.value)}
        />
      </DialogContent>
      <DialogActions >
        <Button onClick={handleClose} style={{ color: 'white' }}>Cancel</Button>
        <Button onClick={handleSubmit} style={{ color: 'white' }}>Add</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMovieDialog;
