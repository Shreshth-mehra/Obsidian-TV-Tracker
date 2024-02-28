# Obsidian-TV-Tracker

Movie and TV show tracker plugin for Obsidian

I work on this in my spare time. If you enjoy using this, please say Thank you or 
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/shreshthmehra)

Happy to implement any feature requests you have or better yet, if you wish you can create pull requests.

## Showcase

![General](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/general2.gif)

![Discover](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/discover.gif)

![Add new](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/addnew2.gif)



# Description

A simple Movie and TV show library to keep track of favourite movies and shows. The discover feature helps you find new movies and shows based on your library and ratings. Better and more algorithms for discover new coming soon. 

Each Movie and TV show is saved as a markdown file in a folder of your choice (Specified in the settings). Each file has YAML content which is used to Display, filter and sort content. To be able to add new Movies and TV shows you will need to get your personal API key from TMDB. Simply create an account at https://www.themoviedb.org/signup and get the API key. You will then have to enter your API key in the settings for this plugin.

A template library of Movies and TV shows is available in the github repo https://github.com/Shreshth-mehra/Obsidian-TV-Tracker.

Note: The plugin does not refresh on its own, please close and open the plugin again to see newly added titles.

## Upcoming

I have already started work on the next update and am planning the following major changes

1. Discover New - Multiple algorithms to choose from for discovering
2. Faster performance
3. Improved UI scaling

# Usage

The Plugin is accesible as a 'Star' Ribbon icon. On clicking, this will open a new View called 'TV Tracker' with a Grid of all the movies and shows found in the specified path in the settings. The Header displays multiple options to sort and filter the content displayed. Please note that if search results are 0 then all titles are displayed. The header is hidden in a pop up on mobile app.

## Adding new titles

The easiest way for adding new titles is through the add new button in the header. You will be prompted to enter 4 details

1. Name - Used for searching TMDB API
2. Rating - Your rating for the title as an integer betwen (0-5)
3. Status - For watchlist please enter 'Watchlist' else it will not show up in the watchlist. For all others you can enter that status to whatever you like. I usually choose from Watched (for movies), Complete, Incomplete, In Progress (for TV shows)
4. Type - Please select from Movie or Series

If you wish to batch add titles from a csv, I can provide python scripts that I used myself

## Discover

After selecting the genre you will be shown titles from your own library in that genre. You can then select the type of movies/show you are in a mood for and then the algorithm recommends new movies/shows you haven't seen. 

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
3. If the movie has a special character in it's name such as '!' , ':' , '?' or '&' . Please remove the special character from the markdown file name after creating it through Add new.
4. If there are no results to show for a search then all titles will be displayed but the Showing results will read 0
5. If the entire library is large and cache was recently cleared or does not exist yet then incorrect Poster paths might be displayed for a while. Please be patient at this point as it will eventually resolve itself
6. If you change the theme in your vault from Light ot Dark or the other way around. Please turn the plugin off and then turn it on again for necessary changes to reflect.


# Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. You will have to obtain your own personal TMDB API to use this plugin.The TMDB API is used for fetching all necessary details about each title including but not limited to Official title, poster, Cast members, Genre, Avg rating, Popularity etc.
![TMDB_Logo](https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg)

# Support

If you enjoyed using this code or found it helpful, feel free to say thank you by buying me a coffee. https://www.buymeacoffee.com/shreshthmehra
![image](https://github.com/Shreshth-mehra/Obsidian-TV-Tracker/assets/39000100/070b470b-5051-4d42-8be0-4b417acacc0a)
