import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Box, IconButton, Drawer, Typography, Button } from "@mui/material";


const MovieSearchPopup = ({ movies, onSelect, onClose }) => {
    if (!movies) return null;

    return (
        <Dialog open={Boolean(movies.length)} onClose={() => onSelect(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Select a Movie</DialogTitle>
            <DialogContent dividers>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {movies.map((movie) => (
                        <div key={movie.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => onSelect(movie)}>
                            <img
                                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} // Adjust size as needed
                                alt={movie.title}
                                style={{ borderRadius: '4px', marginRight: '20px', width: '100px', height: '150px', objectFit: 'cover' }}
                            />
                            <Typography variant="subtitle1" noWrap>
                                {movie.title}
                            </Typography>
                        </div>
                    ))}
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MovieSearchPopup;