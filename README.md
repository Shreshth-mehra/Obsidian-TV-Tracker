# Obsidian-TV-Tracker

Movie and TV show tracker plugin for Obsidian

# Description

A simple Movie and TV show library to keep track of favourite movies and shows. Each Movie and TV show is saved as a markdown file in a folder of your choice. Each file has YAML content which is used to Display, filter and sort content. This product uses the TMDB API but is not endorsed or certified by TMDB. The TMDB API is free for personal uses and requires a license for commercial use. To be able to add new Movies and TV shows you will need to get your personal API key from TMDB. Simply create an account at https://www.themoviedb.org/signup and get the API key. You will then have to enter your API key in the settings for this plugin.

A template library of Movies and TV shows is available on request to play with the plugin.

# Usage

The Plugin is accesible as a 'Star' Ribbon icon. On clicking, this will open a new View called 'TV Tracker' with a Grid of all the movies and shows found in the specified path in the settings. The Header displays multiple options to sort and filter the content displayed. Please note that if search results are 0 then all titles are displayed. The header is hidden in a pop up on mobile app.

## Adding new titles

The easiest way for adding new titles is through the add new button in the header. You will be prompted to enter 4 details

1. Name - Used for searching TMDB API
2. Rating - Your rating for the title as an integer betwen (0-5)
3. Status - For watchlist please enter 'Watchlist' else it will not show up in the watchlist. For all others you can enter that status to whatever you like. I usually choose from Watched (for movies), Complete, Incomplete, In Progress (for TV shows)
4. Type - Please select from Movie or Series

If you wish to batch add titles from a csv, I can provide python scripts that I used myself

## Metrics

The Movie Metrics shows top Genres, Actors, Directors and total viewing time from your library. There are 4 options to choose from for deciding the metric for Top in each category. The total viewing time only displays the viewing time of Movies and does not include Series

1. Count - Based on how many titles are there in your library for the category
2. Simple Rating - Based on sum of Rating for each category. For example, when evaluating Top Actors the points for say Sandra Bullock will be calculated as sum of the ratings for each of her movies and shows in your library
3. Balance Rating - Similar to Simple rating but an Actor gets more points if they are in the 4 Cast members for a title. For Top Genre and Directors acts the same way as Simple Rating
4. Avg Rating - Avg rating for the person/genre if they have a minimum number of titles (This number can be changed from settings)

## Settings

There are 13 configurable settings. The two most improtant ones are the TMDB API key and the Folder path. The folder path is relative to the root of your obsidian vault (where the .obsidian folder is). So if the content is in a folder called Movies which is in the root, then the path would simply be 'Movies'

# Key things to note

1. When entering a movie in the watchlist. Please enter the rating as 1 or higher otherwise the movie will not be displayed
2. After adding a title, the TV tracker will ahve to be reloaded for the title to show up.
3. If the movie has a special character in it's name such as ! or : . Please remove the special charcter from the markdown file name after creating it through Add new.
4. If there are no results to show for a search then all titles will be displayed but the Showing results will read 0
5. If the entire library is large and cache was recently cleared or does not exist yet then incorrect Poster paths might be displayed for a while. Please be patient at this point as it will eventually resolve itself
6. If you change the theme in your vault from Light ot Dark or the other way around. Please turn the plugin off and then turn it on again for necessary changes to reflect.

# Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. You will have to obtain your own personal TMDB API to use this plugin.The TMDB API is used for fetching all necessary details about each title including but not limited to Official title, psoter, Cast members, Genre, Avg rating, Popularity etc.
![TMDB_Logo](https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg)
