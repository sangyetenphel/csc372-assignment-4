# TVmaze Show Gallery

A small web app for searching TV shows. Type a show name and it displays matching shows as cards with the poster, summary, premiere date, genres, rating and main cast, using live data from the free [TVmaze API](https://www.tvmaze.com/api).

Built with plain HTML, CSS and JavaScript (no frameworks or build step) for CSC 372 at UNC Greensboro, Assignment 4.

## Features

- **Search:** looks up shows by name through the TVmaze search endpoint and shows up to 10 results. A search for "friends" runs automatically when the page loads.
- **Show cards:** each card has the poster (or a "No poster available" placeholder), title, a summary trimmed to about 220 characters, premiere date, last-updated time, genres and rating.
- **Main cast:** after the results appear, a second request per show loads its cast and lists the first five actors.
- **Link out:** every card links to the show's page on TVmaze.
- **Clear feedback:** the page shows status messages for loading, empty searches and no results, and a specific message when the TVmaze rate limit is hit (HTTP 429), when a request fails, or when there is no connection.
- **Responsive layout:** the gallery uses flexbox with wrapping, so cards rearrange to fit phones, tablets and desktops.

## How it works

1. Submitting the form calls `searchShows()`, which requests `https://api.tvmaze.com/search/shows?q=<query>`.
2. `getJson()` wraps `fetch`, checks `response.ok` and throws an error that carries the HTTP status, so failures are handled in one place by `handleError()`.
3. `createCard()` builds each card with DOM methods (`createElement` and `textContent`, never `innerHTML`), so text from the API is never run as HTML. Show summaries arrive as HTML and are converted to plain text with `DOMParser` first.
4. `loadCast()` then requests `https://api.tvmaze.com/shows/<id>/cast` for each show and fills in that card's cast list. If one cast request fails, only that card shows "Not available"; the rest of the page keeps working.

## Project structure

```
index.html   Page layout: search form, status message, gallery and footer
styles.css   Styling for the header, cards and flexbox gallery
script.js    Fetching, error handling and building the show cards
```

## Running it locally

No installation is needed. Either:

- open `index.html` in a browser, or
- in VS Code, use the **Live Preview** extension; this repository's `.vscode/settings.json` already points it at `index.html`.

An internet connection is required, since all data comes from the TVmaze API. The API does not need a key.

## Built with

- HTML5, CSS3 (flexbox) and JavaScript (ES2017+, `async`/`await` and the Fetch API)
- [TVmaze API](https://www.tvmaze.com/api) for show and cast data

## Credits

Show data is provided by [TVmaze](https://www.tvmaze.com/) and licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Created by Sangye Tengkhar, October 2026.
