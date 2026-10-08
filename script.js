/*
  Name: Sangye Tengkhar
  Date: 10.08.2026
  CSC 372-01

  JavaScript for the TVmaze Show Gallery page. Fetches matching shows from the
  TVmaze search endpoint, then makes a second fetch request to load the main
  cast of each matching show. Results are rendered as cards inside the gallery.
*/

/* ---------- Configuration ---------- */
let SEARCH_URL = "https://api.tvmaze.com/search/shows?q=";
let SHOWS_URL = "https://api.tvmaze.com/shows/";
let MAX_RESULTS = 10;
let DEFAULT_QUERY = "friends";

/* ---------- Element references ---------- */
let form = document.getElementById("search-form");
let input = document.getElementById("search-input");
let gallery = document.getElementById("gallery");
let statusMessage = document.getElementById("status");


/**
 * Displays a message to the user in the status area.
 * @param {string} text - the message to display
 * @param {boolean} isError - true if this is an error message
 */
function showStatus(text, isError) {
  statusMessage.textContent = text;
  if (isError) {
    statusMessage.className = "error";
  } else {
    statusMessage.className = "";
  }
}


/**
 * Removes HTML tags from a summary string and returns plain text.
 * @param {string} htmlText - the summary string, possibly containing HTML
 * @return {string} the plain text version of the summary
 */
function stripHtml(htmlText) {
  if (!htmlText) {
    return "";
  }
  let parser = new DOMParser();
  let doc = parser.parseFromString(htmlText, "text/html");
  let text = doc.body.textContent || "";
  return text.replace(/\s+/g, " ").trim();
}


/**
 * Formats a premiere date string like "2005-03-26" as a readable date.
 * @param {string} value - the raw date string from the API
 * @return {string} a formatted date or "Not available"
 */
function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  let d = new Date(value + "T00:00:00");
  if (isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


/**
 * Formats a full ISO timestamp as a readable date and time.
 * @param {string} value - the raw timestamp string from the API
 * @return {string} a formatted date and time or "Not available"
 */
function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }
  let d = new Date(value);
  if (isNaN(d.getTime())) {
    return "Not available";
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}


/**
 * Fetches a URL, checks the response status, and returns parsed JSON.
 * Follows the four-stage fetch workflow: build URL, await response,
 * check response.ok, parse body.
 * @param {string} url - the full URL to fetch
 * @return {Promise<Object>} the parsed JSON response
 */
async function getJson(url) {
  let response = await fetch(url);
  if (!response.ok) {
    let error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  return response.json();
}


/**
 * Adds a label and value pair to a definition list.
 * @param {HTMLElement} list - the <dl> element to append to
 * @param {string} label - the term shown in a <dt>
 * @param {string} value - the description shown in a <dd>
 */
function addDetail(list, label, value) {
  let dt = document.createElement("dt");
  dt.textContent = label;
  let dd = document.createElement("dd");
  dd.textContent = value;
  list.appendChild(dt);
  list.appendChild(dd);
}


/**
 * Builds a single show card as a DOM element.
 * @param {Object} show - a show object from the TVmaze search results
 * @return {HTMLElement} the completed card element
 */
function createCard(show) {
  let card = document.createElement("article");
  card.className = "card";

  /* Poster or fallback */
  let posterBox = document.createElement("div");
  posterBox.className = "card-poster";

  if (show.image && show.image.medium) {
    let img = document.createElement("img");
    img.src = show.image.medium;
    img.alt = "Poster for " + (show.name || "this show");
    posterBox.appendChild(img);
  } else {
    let noPoster = document.createElement("p");
    noPoster.className = "poster-fallback";
    noPoster.textContent = "No poster available";
    posterBox.appendChild(noPoster);
  }
  card.appendChild(posterBox);

  /* Body */
  let body = document.createElement("div");
  body.className = "card-body";

  let title = document.createElement("h2");
  if (show.name) {
    title.textContent = show.name;
  } else {
    title.textContent = "Untitled";
  }
  body.appendChild(title);

  let summaryText = stripHtml(show.summary);
  let summary = document.createElement("p");
  summary.className = "summary";
  if (summaryText !== "") {
    if (summaryText.length > 220) {
      summary.textContent = summaryText.slice(0, 220) + "...";
    } else {
      summary.textContent = summaryText;
    }
  } else {
    summary.textContent = "Not available";
  }
  body.appendChild(summary);

  let details = document.createElement("dl");
  details.className = "details";

  addDetail(details, "Premiered", formatDate(show.premiered));
  addDetail(details, "Last updated", formatDateTime(show.updated));

  let genreText = "Not available";
  if (show.genres && show.genres.length > 0) {
    genreText = show.genres.join(", ");
  }
  addDetail(details, "Genres", genreText);

  let ratingText = "Not available";
  if (show.rating && show.rating.average !== null && show.rating.average !== undefined) {
    ratingText = show.rating.average + " / 10";
  }
  addDetail(details, "Rating", ratingText);

  body.appendChild(details);

  let castHeading = document.createElement("h3");
  castHeading.textContent = "Main cast";
  body.appendChild(castHeading);

  let castList = document.createElement("ul");
  castList.className = "cast-list";
  let loadingItem = document.createElement("li");
  loadingItem.textContent = "Loading...";
  castList.appendChild(loadingItem);
  body.appendChild(castList);

  let link = document.createElement("a");
  link.className = "show-link";
  if (show.url) {
    link.href = show.url;
  } else {
    link.href = SHOWS_URL + show.id;
  }
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "View on TVmaze";
  body.appendChild(link);

  card.appendChild(body);
  return card;
}


/**
 * Makes a second fetch request to load the cast for one show and fills
 * the card's cast list. If the request fails, the card shows "Not available".
 * @param {number} showId - the TVmaze id of the show
 * @param {HTMLElement} card - the card element to update
 */
async function loadCast(showId, card) {
  let castList = card.querySelector(".cast-list");
  if (!castList) {
    return;
  }

  try {
    let url = SHOWS_URL + showId + "/cast";
    let cast = await getJson(url);

    castList.textContent = "";

    if (!cast || cast.length === 0) {
      let noneItem = document.createElement("li");
      noneItem.textContent = "Not available";
      castList.appendChild(noneItem);
      return;
    }

    let count = cast.length;
    if (count > 5) {
      count = 5;
    }

    for (let i = 0; i < count; i++) {
      let item = document.createElement("li");
      if (cast[i].person && cast[i].person.name) {
        item.textContent = cast[i].person.name;
      } else {
        item.textContent = "Not available";
      }
      castList.appendChild(item);
    }

  } catch (error) {
    console.warn("Could not load cast for show " + showId, error);
    castList.textContent = "";
    let failItem = document.createElement("li");
    failItem.textContent = "Not available";
    castList.appendChild(failItem);
  }
}


/**
 * Handles an error from a fetch request by showing an appropriate message.
 * @param {Error} error - the error thrown by getJson or fetch
 */
function handleError(error) {
  if (error.status === 429) {
    showStatus("The TVmaze rate limit was reached. Please wait a moment and try again.", true);
  } else if (error.status) {
    showStatus("The request failed (HTTP " + error.status + "). Please try again.", true);
  } else {
    showStatus("Something went wrong contacting TVmaze. Check your connection and try again.", true);
  }
  console.error("TVmaze request error:", error);
}


/**
 * Searches TVmaze for shows matching the given query and renders the results.
 * @param {string} query - the text entered by the visitor
 */
async function searchShows(query) {
  let trimmed = query.trim();

  if (trimmed === "") {
    gallery.textContent = "";
    showStatus("Please enter a search term.", true);
    return;
  }

  gallery.textContent = "";
  showStatus("Loading results...", false);

  try {
    let url = SEARCH_URL + encodeURIComponent(trimmed);
    let results = await getJson(url);

    if (!results || results.length === 0) {
      showStatus('No shows found for "' + trimmed + '". Try a different search.', true);
      return;
    }

    let count = results.length;
    if (count > MAX_RESULTS) {
      count = MAX_RESULTS;
    }

    let cards = [];
    for (let i = 0; i < count; i++) {
      let card = createCard(results[i].show);
      gallery.appendChild(card);
      cards.push(card);
    }

    if (count === 1) {
      showStatus('Showing 1 result for "' + trimmed + '".', false);
    } else {
      showStatus('Showing ' + count + ' results for "' + trimmed + '".', false);
    }

    for (let j = 0; j < count; j++) {
      await loadCast(results[j].show.id, cards[j]);
    }

  } catch (error) {
    gallery.textContent = "";
    handleError(error);
  }
}


/* ---------- Form submit ---------- */
form.addEventListener("submit", function (event) {
  event.preventDefault();
  searchShows(input.value);
});


/* ---------- Default search on page load ---------- */
input.value = DEFAULT_QUERY;
searchShows(DEFAULT_QUERY);