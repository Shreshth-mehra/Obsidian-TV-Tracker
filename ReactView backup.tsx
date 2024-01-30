import * as React from "react";
import { useEffect, useState } from "react"; 
import { Platform, TFile } from "obsidian";
import MovieGrid from "GridView"
import matter from 'gray-matter';
import { Container, Select, MenuItem, FormControl, InputLabel, Grid, Checkbox, ListItemText, OutlinedInput } from "@mui/material";

interface ReactViewProps {
  files: TFile[];
}

export const ReactView: React.FC<ReactViewProps> = ({files}) => {
  // Change movie state to movies, which will be an array
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedRating, setSelectedRating] = useState(1);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [movieProperties, setMovieProperties] = useState([]);

  useEffect(() => {

    function parseMarkdown(markdownContent) {
      const parsed = matter(markdownContent);
      return {
          content: parsed.content,
          data: parsed.data
      };
    }

    async function processFile(file:TFile) {
      const content = await this.app.vault.read(file);
      const result = parseMarkdown(content);
      return result.data; // return the data instead of setting the state here
    }

    async function getYAMLforMovies(){
      const allMovies = [];
      for (let file of files) {
        const movieData = await processFile(file);
        allMovies.push(movieData); // accumulate the movie data
      }
      setMovies(allMovies); // set the accumulated movies data into the state
    }

    const propertiesSet = new Set();
    movies.forEach(movie => {
      Object.keys(movie).forEach(key => propertiesSet.add(key));
    });
    setMovieProperties(Array.from(propertiesSet));


    getYAMLforMovies();

  }, [files,movies]);

  const handlePropertyChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedProperties(typeof value === 'string' ? value.split(',') : value);
  };


  const handleRatingChange = (event) => {
    const rating = event.target.value;
    setSelectedRating(rating);
    filterMovies(rating);
  };

  // Function to filter movies based on the selected rating
  const filterMovies = (rating) => {
    const highRatedMovies = movies.filter(movie => movie.rating >=rating);
    setFilteredMovies(highRatedMovies);
  };

  // Check if movies are still being fetched
  if (!movies || movies.length === 0) {
    return <div>Loading...</div>;
  }

  // Render each movie in the grid
  return (
    <Container>
   <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1>Movie List</h1>
            <Container > 
              <FormControl variant="outlined" sx={{ width: '100px', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}>
                    <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' }, '&.MuiInputLabel-shrink': { color: 'white', transform: 'translate(14px, -6px) scale(0.75)' } }}>Properties</InputLabel>
                    <Select
                      multiple
                      value={selectedProperties}
                      onChange={handlePropertyChange}
                      sx={{
                        color: 'white',
                        '& .MuiSelect-select': { paddingLeft: '14px' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '& .MuiSvgIcon-root': { color: 'white' },
                      }}
                      input={<OutlinedInput label="Properties" />}
                      renderValue={(selected) => selected.join(', ')}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 224,
                            width: 250,
                          },
                        },
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
            <FormControl variant="outlined" sx={{ width: '100px', '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' } }}>
                <InputLabel htmlFor="rating-dropdown" sx={{ color: 'white', '&.Mui-focused': { color: 'white' }, '&.MuiInputLabel-shrink': { color: 'white', transform: 'translate(14px, -6px) scale(0.75)' } }}>Rating</InputLabel>
                <Select
                  id="rating-dropdown"
                  value={selectedRating}
                  label="Rating"
                  onChange={handleRatingChange}
                  sx={{
                    color: 'white',
                    '& .MuiSelect-select': { paddingLeft: '14px' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '& .MuiSvgIcon-root': { color: 'white' },
                  }}
                >
                  {[1, 2, 3, 4, 5].map(rating => (
                      <MenuItem key={rating} value={rating}>{rating}</MenuItem>
                  ))}
                </Select>
            </FormControl>
            </Container>
        </header>
        <MovieGrid movies = {filteredMovies.length > 0 ? filteredMovies : movies} selectedProperties={selectedProperties}></MovieGrid>
    </Container>
  );
};
