import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, Box } from '@mui/material';
import { providerLogos } from './providerLogos';

const ProviderFilter = ({ providers, selectedProviders, handleProviderChange }) => {
  return (
    <FormControl fullWidth variant="outlined" sx={{ width: '8vw', '.MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' } }}>
      <InputLabel sx={{ color: 'inherit' }}>Providers</InputLabel>
      <Select
        multiple
        value={selectedProviders}
        onChange={handleProviderChange}
        input={<OutlinedInput label="Providers" />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((provider, index) => (
              <React.Fragment key={provider}>
                {provider === 'No Provider' ? (
                  <span style={{ fontSize: '12px' }}>No Provider</span>
                ) : (
                  <img
                    src={providerLogos[provider] || ''}
                    alt={provider}
                    style={{
                      height: '20px',
                      width: '20px',
                      objectFit: 'contain',
                      marginRight: '4px'
                    }}
                  />
                )}
                {index < selected.length - 1 && <span style={{ marginRight: '4px' }}>,</span>}
              </React.Fragment>
            ))}
          </Box>
        )}
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
          '& .MuiSelect-select': { 
            paddingLeft: '5px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            alignItems: 'center'
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        <MenuItem key="No Provider" value="No Provider" sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Checkbox checked={selectedProviders.indexOf('No Provider') > -1} />
          <span style={{ marginLeft: '8px' }}>No Provider</span>
        </MenuItem>
        
        {providers.map((provider) => (
          <MenuItem key={provider} value={provider} sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Checkbox checked={selectedProviders.indexOf(provider) > -1} />
            <img
              src={providerLogos[provider] || ''}
              alt={provider}
              style={{
                height: '24px',
                width: '24px',
                objectFit: 'contain'
              }}
            />
            <span style={{ marginLeft: '8px' }}>{provider}</span>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ProviderFilter;