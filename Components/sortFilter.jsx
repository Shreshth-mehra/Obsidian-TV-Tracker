// MovieRatingFilter.jsx
import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Container, Button, Box } from "@mui/material";
import { Platform } from "obsidian";

const SortFilter = ({ sortOption, onSortChange, sortOrder, toggleSortOrder }) => {
  const isMobile = Platform.isMobile;
  return (
    <Container sx={{ width: isMobile ? '70%' : '8vw' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box>
          <FormControl variant="outlined" sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
            <InputLabel htmlFor="sort-dropdown" sx={{ color: 'inherit' }}>Sort</InputLabel>
            <Select
              id="sort-dropdown"
              value={sortOption}
              onChange={onSortChange}
              label="Sort"

              sx={{
                color: 'inherit',
                '& .MuiSelect-select': { paddingLeft: '14px' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
                '& .MuiSvgIcon-root': { color: 'inherit' },
              }}
            >
              <MenuItem value="Rating">Rating</MenuItem>
              <MenuItem value="Alphabetical">Alphabetical</MenuItem>
              <MenuItem value="Avg vote">Avg Vote</MenuItem>
              <MenuItem value="Hidden Gem factor">Hidden Gem factor</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box mt={1}>
          <Button onClick={toggleSortOrder} sx={{ color: 'inherit', padding: '2px' }}>
            {sortOrder === 'ascending' ? 'Asc' : 'Desc'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default SortFilter;
