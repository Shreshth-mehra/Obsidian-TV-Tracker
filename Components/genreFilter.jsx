// MovieGenreFilter.jsx
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput } from "@mui/material";
import { Platform } from "obsidian";

const MovieGenreFilter = ({ genres, selectedGenres, handleGenreChange }) => {
  const isMobile = Platform.isMobile;
  return (
    <FormControl variant="outlined" sx={{ width: isMobile ? '70%' : '8vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
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
              width: 250,
            },
          },
        }}
        sx={{
          color: 'inherit',
          '& .MuiSelect-select': { paddingLeft: '7px' },
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
  );
};

export default MovieGenreFilter;
