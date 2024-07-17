import React, { useState } from 'react';
import { Box, Typography, Grid, Collapse, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { requestUrl, Platform } from "obsidian";

const ExpandableSection = ({ title, items, itemKey, itemLabel, itemValue, themeMode, expanded, onExpand, headingColor, apiKey, topActorIndices, clickToView }) => {
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedActor, setSelectedActor] = useState(null);
    const [actorInfo, setActorInfo] = useState(null);
    const [actorRanks, setActorRanks] = useState(null);

    const textColor = themeMode === 'dark' ? '#fff' : '#000';

    const fetchActorInfo = async (actorName) => {
        try {
            const searchResponse = await requestUrl({
                url: `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${actorName}`
            });
            const searchData = searchResponse.json;
            console.log("Search name is ", actorName);
            console.log('Search Response:', searchData);

            if (searchData.results.length > 0) {
                const actor = searchData.results[0];
                const actorId = actor.id;
                const actorKnownFor = actor.known_for.map(movie => movie.title).slice(0, 3);
                const actorImage = actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null;

                const actorResponse = await requestUrl({
                    url: `https://api.themoviedb.org/3/person/${actorId}?api_key=${apiKey}&append_to_response=movie_credits,tv_credits`
                });
                const actorData = actorResponse.json;
                console.log('Actor Response:', actorData);
                const movies = actorData.movie_credits.cast.filter(movie => movie.order < 10);
                const tvShows = actorData.tv_credits.cast.filter(show => show.episode_count >= 5);

                const actorInfo = {
                    totalMovies: movies.length,
                    totalTvShows: tvShows.length,
                    upcomingMovies: movies.filter(movie => new Date(movie.release_date) > new Date()).map(movie => movie.title).join(', '),
                    knownFor: actorKnownFor.join(', '),
                    birthday: actorData.birthday,
                    age: new Date().getFullYear() - new Date(actorData.birthday).getFullYear(),
                    popularity: actorData.popularity,
                    image: actorImage,
                };

                setActorInfo(actorInfo);
                if (topActorIndices) {
                    const actorRank = topActorIndices.find(rank => rank.actor === actorName);
                    setActorRanks(actorRank);
                } else {
                    setActorRanks(null);
                }
            } else {
                setActorInfo({ message: 'Actor not found' });
                setActorRanks(null);
            }
        } catch (error) {
            console.error('Failed to fetch actor information:', error);
            setActorInfo({ message: 'Failed to fetch actor information' });
            setActorRanks(null);
        }
    };

    const handleActorClick = async (actorName) => {
        if (apiKey && clickToView) {
            setSelectedActor(actorName);
            await fetchActorInfo(actorName);
            setOpenPopup(true);
        }
    };

    const handleClosePopup = () => {
        setOpenPopup(false);
        setActorInfo(null);
        setActorRanks(null);
    };

    return (
        <Box style={{ paddingBottom: '15px' }}>
            <Box display="flex">
                <ExpandMoreIcon
                    onClick={onExpand}
                    style={{
                        color: themeMode === 'dark' ? 'white' : 'inherit',
                        transform: expanded ? 'rotate(0deg)' : 'rotate(270deg)',
                        transition: 'transform 0.3s',
                    }}
                />
                <Typography variant="subtitle1" style={{ color: headingColor, cursor: 'pointer' }} onClick={onExpand}>
                    {title}
                </Typography>
            </Box>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Grid container spacing={2}>
                    {items.map((item, index) => (
                        <Grid item key={item[itemKey]}>
                            <Typography
                                variant="body1"
                                style={{ color: 'inherit', cursor: 'pointer' }}
                                onClick={() => handleActorClick(item[itemLabel])}
                            >
                                {index + 1}. {item[itemLabel]}: {item[itemValue]}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            </Collapse>
            <Dialog
                open={openPopup}
                onClose={handleClosePopup}
                fullWidth
                maxWidth="md"
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: themeMode === 'dark' ? '#333' : '#d3d3d3',
                        color: 'inherit',
                        position: 'relative',
                    }
                }}>
                <DialogTitle>
                    <Typography variant="h4" style={{ color: headingColor }}>{selectedActor}</Typography>
                </DialogTitle>
                <DialogContent style={{ display: 'flex', flexDirection: Platform.isMobile ? 'column' : 'row', alignItems: Platform.isMobile ? 'center' : 'flex-start', color: 'inherit', padding: '20px' }}>
                    {actorInfo && actorInfo.image && (
                        <Box>
                            <img
                                src={actorInfo.image}
                                alt={selectedActor}
                                style={{ maxHeight: '40vh', maxWidth: '100%', borderRadius: '8px', marginBottom: Platform.isMobile ? '20px' : '0', }}
                            />
                        </Box>
                    )}
                    <Box flex={1} style={{ marginLeft: Platform.isMobile ? '0' : '20px' }}>
                        {actorInfo ? (
                            actorInfo.message ? (
                                <Typography>{actorInfo.message}</Typography>
                            ) : (
                                <div>
                                    {actorInfo.totalMovies > 0 && (
                                        <>
                                            <Typography variant="h6" gutterBottom>Total Movies:</Typography>
                                            <Typography variant="body1" paragraph>{actorInfo.totalMovies}</Typography>
                                        </>
                                    )}
                                    {actorInfo.totalTvShows > 0 && (
                                        <>
                                            <Typography variant="h6" gutterBottom>Total TV Shows:</Typography>
                                            <Typography variant="body1" paragraph>{actorInfo.totalTvShows}</Typography>
                                        </>
                                    )}
                                    {actorInfo.upcomingMovies && (
                                        <>
                                            <Typography variant="h6" gutterBottom>Upcoming Movies:</Typography>
                                            <Typography variant="body1" paragraph>{actorInfo.upcomingMovies}</Typography>
                                        </>
                                    )}
                                    <Typography variant="h6" gutterBottom>Known For:</Typography>
                                    <Typography variant="body1" paragraph>{actorInfo.knownFor}</Typography>
                                    <Typography variant="h6" gutterBottom>Birthday:</Typography>
                                    <Typography variant="body1" paragraph>{actorInfo.age} yrs, {actorInfo.birthday}</Typography>
                                    <Typography variant="h6" gutterBottom>TMDB Popularity:</Typography>
                                    <Typography variant="body1" paragraph>{actorInfo.popularity}</Typography>
                                    {actorRanks && (
                                        <div>
                                            <Typography variant="h6" gutterBottom>Numbers in Your Library:</Typography>
                                            <Typography variant="body1" paragraph>Count Rank: {actorRanks.countIndex + 1}</Typography>
                                            <Typography variant="body1" paragraph>Simple Rating Rank: {actorRanks.sumIndex + 1}</Typography>
                                            <Typography variant="body1" paragraph>Avg Rating Rank: {actorRanks.avgRatIndex + 1}</Typography>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            <Typography>Loading...</Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePopup} color="primary" style={{ color: 'inherit' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExpandableSection;
