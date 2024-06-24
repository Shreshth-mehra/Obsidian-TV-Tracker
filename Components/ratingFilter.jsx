// MovieRatingFilter.jsx
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { Platform } from "obsidian";

const MovieRatingFilter = ({ selectedRating, handleRatingChange }) => {
  const isMobile = Platform.isMobile;
  return (
    <FormControl variant="outlined" sx={{ width: isMobile ? '70%' : '5vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
      <InputLabel htmlFor="rating-dropdown" sx={{ color: 'inherit' }}>Rating</InputLabel>
      <Select
        id="rating-dropdown"
        value={selectedRating}
        label="Rating"
        onChange={handleRatingChange}
        sx={{
          color: 'inherit',
          '& .MuiSelect-select': { paddingLeft: '5px' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        {[1, 2, 3, 3.5, 4, 4.5, 5].map(rating => (
          <MenuItem key={rating} value={rating}>{rating}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MovieRatingFilter;
