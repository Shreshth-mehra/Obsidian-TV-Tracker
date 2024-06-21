import React from 'react';
import { Box, Typography, Collapse, Grid, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ExpandableSection = ({ title, items, itemKey, itemLabel, itemValue, themeMode, expanded, onExpand, headingColor }) => {
    return (
        <Box style={{ paddingBottom: '15px' }}>
            <Box display="flex">
                {/* <IconButton  style={{ padding: 0 }}> */}
                <ExpandMoreIcon
                    onClick={onExpand}
                    style={{
                        color: themeMode === 'dark' ? 'white' : 'inherit',
                        transform: expanded ? 'rotate(0deg)' : 'rotate(270deg)',
                        transition: 'transform 0.3s',
                    }}
                />
                {/* </IconButton> */}
                <Typography variant="subtitle1" style={{ color: headingColor, cursor: 'pointer' }} onClick={onExpand}>
                    {title}
                </Typography>
            </Box>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Grid container spacing={2}>
                    {items.map((item, index) => (
                        <Grid item key={item[itemKey]}>
                            <Typography variant="body1" style={{ color: 'inherit' }}>
                                {index + 1}. {item[itemLabel]}: {item[itemValue]}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            </Collapse>
        </Box>
    );
};

export default ExpandableSection;
