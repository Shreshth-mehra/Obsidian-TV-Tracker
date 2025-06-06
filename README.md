# Obsidian-TV-Tracker

Movie and TV show tracker plugin for Obsidian

# Showcase as of v1.1.0 (More features in v1.3.0)

![General](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/general2.gif)

![Discover](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/discover.gif)

![Add new](https://raw.githubusercontent.com/Shreshth-mehra/Obsidian-TV-Tracker/main/Showcase/addnew2.gif)

# New in v1.3.16
-  Added an Direct Obsidian Command for adding new titles. This will allow you to add new titles from anywhere in Obsidian. You can also assign a hotkey to this command for even faster access.
- Added the command for this which are previously available in the settings. Will work on currently opened file.

### These are commands that are available in the command palette
- **Movie and TV show tracker: Search and add movie/TV show** - to library (User can select the item after that they can add the satus and rating)
- **Movie and TV show tracker: Add episode list for current file** -  (Also fetch the New Season if Available & New Episodes as well)
- **Movie and TV show tracker: Update current file with new data**
- **Movie and TV show tracker: Update Episode tracking for current file**
- **Movie and TV show tracker: Update Streaming availability for current file**

# New in v1.3.15
Small bug fix
- Removed the double quotes from the Available on Property.
Please update all files using the Update button for fetching OTT provider information. 

# New in v1.3.14
- Added an option to select the "**No Provider**" in the providers filtering option

# New in v1.3.13
- Don't have to refresh the plugin to see newly added titles. The plugin will now automatically fetch the newly added or edited files.

# New in v1.3.12
- Added the filtering option OTT Providers  

# New in v1.3.11
- Added Search filter option for OTT providers. Simply type the OTT in the search bar.
- Fixed a bug where movies with special characters in their name couldn't be added 

# New in v1.3.9
- Added Country specific availability on streaming services
- Added Metrics for different OTT providers

Please see "Available on" section below for further information

I work on this in my spare time. If you enjoy using this, please say Thank you or
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/shreshthmehra)

Happy to implement any feature requests you have or better yet, if you wish you can create pull requests.

# Description

A simple Movie and TV show library to keep track of favourite movies and shows. The discover feature helps you find new movies and shows based on your library and ratings. Better and more algorithms for discover new coming soon.

Each Movie and TV show is saved as a markdown file in a folder of your choice (Specified in the settings). Each file has YAML content which is used to Display, filter and sort content. To be able to add new Movies and TV shows you will need to get your personal API key from TMDB (Free for non-commercial use). Simply create an account at https://www.themoviedb.org/signup and get the API key. You will then have to enter your API key in the settings for this plugin.

A template library of Movies and TV shows is available in the github repo https://github.com/Shreshth-mehra/Obsidian-TV-Tracker.

Note: The plugin does not refresh on its own, please close and open the plugin again to see newly added titles.

# Usage

The Plugin is accesible as a 'Star' Ribbon icon. On clicking, this will open a new View called 'TV Tracker' with a Grid of all the movies and shows found in the specified path in the settings. The Header displays multiple options to sort and filter the content displayed. Please note that if search results are 0 then all titles are displayed. The header is hidden in a pop up on mobile app.

## Adding new titles

The easiest way for adding new titles is through the add new button in the header. You will be prompted to enter 4 details

1. Name - Used for searching TMDB API
2. Rating - Your rating for the title as a number between 0-5 (in increments of 0.5)
3. Status - For watchlist please enter 'Watchlist' else it will not show up in the watchlist. For all others you can enter that status to whatever you like. I usually choose from Watched (for movies), Complete, Incomplete, In Progress (for TV shows)
4. Type - Please select from Movie or Series

If you wish to batch add titles from a csv, I can provide python scripts that I used myself

## Discover

After selecting the genre you will be shown titles from your own library in that genre. You can then select the type of movies/show you are in a mood for and then the algorithm recommends new movies/shows you haven't seen.

## Metrics

The Movie Metrics shows top Genres, Actors, Directors, Production Companies and total viewing time from your library. It also shows Budget metrics and Genre taste index.

There are 4 options to choose from for deciding the metric for Top in each category. The total viewing time only displays the viewing time of Movies and does not include Series.

1. Count - Based on how many titles are there in your library for the category
2. Simple Rating - Based on sum of Rating for each category. For example, when evaluating Top Actors the points for Sandra Bullock will be calculated as the sum of the ratings for each of her movies and tv shows in your library.
3. Balanced Rating - Similar to Simple rating but an Actor gets more points if they are in the first 4 Cast members for a title. For Top Genre, Directors, Production Companies act the same way as Simple Rating
4. Avg Rating - Avg rating for the person/genre if they have a minimum number of titles (This number can be changed from settings)
5. Combined Score - Applies only to Actors for now. Takes the rank of the actor across Count, Simple rating and Avg rating and combines it into a single rank.

Genre taste index is the ration of User rating to public rating for each of the title in that genre. So, if your genre taste index for Documentries is 1.2 that means that you rate documentary movies 1.2 times higher on average than public ratings. Keep in mind that the public ratings are fetched from TMDB and are on a scale of 1 to 10. The user rating is multiplied by 2 for this calculation to be on the same scale. Additionally, the rating mode does not affect this metric.

Setting Language filter also changes the metrics. For example, if you have English (en) and Spanish (es) movies in your vault and 'en' filter is applied then the metrics will only include movies with original_language as 'en'

### Available On
The plugin now displays streaming service logos on each title's card, showing where you can watch it. This feature is country-specific, and you can set your country in the plugin settings.

To enable this feature:
0. Update to v1.3.9
1. Set your country in the plugin settings
2. Click the "Update streaming availability" button to add the streaming information to your titles

If you change your country setting later, you'll need to click the update button again to refresh the streaming information for all titles.

If you encounter any issues while updating streaming availability, please check the console logs for error details and share them in a GitHub issue for assistance.

### Click for info

If enabled in settings, on clicking an Actor or Director name in the metrics will show a pop up with Photo of the person, total movies, upcoming movies, known for movies, age and ranks in your library.

Total Movies only includes movies in which the Actor is within the first 10 cast members
Total Shows only includes shows in which the Actor appeared more than 5 times (This is to prevent talk show appearances from being included)
Ranks in your library - To reduce processsing these are only computed and saved for the 2\* topActorsnumber in your library. If a person falls out of this range then their rank will be dispalyed as 1001. Additionally, if an actor is clicked who does not have enough movies to qualify for Avg rating (this number is set in the Settings) then the Avg rating rank will also be 1001.

## Settings

The plugin was designed for high customization and hence has multiple configurable settings. The two most improtant ones are the TMDB API key and the Folder path. The folder path is relative to the root of your obsidian vault (where the .obsidian folder is). So, if the content is in a folder called Movies which is in the root, then the path would simply be 'Movies'

## Search and Filters
The filters are self explanatory. As for the search, it shows all results where the entered search term is found in any of Title, Cast, Directors, Production Company, Collection, Year or Available On.

If the Search returns 0 results then all Titles will be displayed

### Updating Files

As of version 1.3.0 options to update previously existing files has been added. I have tested the plugin on multiple test cases but please keep a backup of your library before proceeding. If any errors occur, please create an issue on Github and I will work towards solving it as soon as possible.

# Key things to note

1. When entering a movie in the watchlist. Please enter the rating as 1 or higher otherwise the movie will not be displayed
2. After adding a title, the TV tracker will have to be reloaded for the title to show up.
3. If the movie has a special character in it's name such as '!' , ':' , '?' or '&' . Please remove the special character from the markdown file name after creating it through Add new.
4. If the entire library is large and cache was recently cleared or does not exist yet then incorrect Poster paths might be displayed for a while. Please be patient as it will eventually resolve itself.
5. If you change the theme in your vault from Light ot Dark or the other way around. Please turn the plugin off and then turn it on again for necessary changes to reflect.

# Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. You will have to obtain your own personal TMDB API to use this plugin.The TMDB API is used for fetching all necessary details about each title including but not limited to Official title, poster, Cast members, Genre, Avg rating, Popularity etc.
![TMDB_Logo](https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg)

# Support

If you enjoyed using this code or found it helpful, feel free to say thank you by buying me a coffee. https://www.buymeacoffee.com/shreshthmehra
![image](https://github.com/Shreshth-mehra/Obsidian-TV-Tracker/assets/39000100/070b470b-5051-4d42-8be0-4b417acacc0a)
