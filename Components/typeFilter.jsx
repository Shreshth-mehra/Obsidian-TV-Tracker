// MovieTypeFilter.jsx
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText } from "@mui/material";
import { Platform } from "obsidian";

const MovieTypeFilter = ({ selectedTypes, handleTypeChange }) => {
  const types = ["Movie", "Series"];  // Define the types available for selection
  const isMobile = Platform.isMobile;
  return (
    <FormControl variant="outlined" sx={{ width: isMobile ? '70%' : '10vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
      <InputLabel sx={{ color: 'inherit' }}>Type</InputLabel>
      <Select
        labelId="type-mutiple-checkbox-label"
        id="type-mutiple-checkbox"
        multiple
        value={selectedTypes}
        onChange={handleTypeChange}
        input={<OutlinedInput label="Type" />}
        renderValue={(selected) => selected.join(', ')}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 48 * 4.5 + 8,
              width: 150,
            },
          },
        }}
        sx={{
          color: 'inherit',
          '& .MuiSelect-select': { paddingLeft: '14px' },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        {types.map((type) => (
          <MenuItem key={type} value={type} >
            <Checkbox checked={selectedTypes.indexOf(type) > -1} />
            <ListItemText primary={type} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MovieTypeFilter;
