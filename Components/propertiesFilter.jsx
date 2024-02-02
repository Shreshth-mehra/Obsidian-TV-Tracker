// MoviePropertiesFilter.jsx
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput } from "@mui/material";
import { Platform } from "obsidian";

const MoviePropertiesFilter = ({ movieProperties, selectedProperties, handlePropertyChange }) => {
  const isMobile = Platform.isMobile;
  return (
    <FormControl variant="outlined" sx={{ width: isMobile ? '70%' : '10vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
      <InputLabel sx={{ color: 'inherit' }}>Properties</InputLabel>
      <Select
        multiple
        value={selectedProperties}
        onChange={handlePropertyChange}
        input={<OutlinedInput label="Properties" />}
        renderValue={(selected) => selected.join(', ')}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 224,
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
        {movieProperties.map((property) => (
          <MenuItem key={property} value={property}>
            <Checkbox checked={selectedProperties.indexOf(property) > -1} />
            <ListItemText primary={property} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default MoviePropertiesFilter;
