/* =========================================================
   PINE COMPANION
   Handles filtering, searching, saved places, map markers,
   random suggestions, and the footer copyright year.
========================================================= */


/* =========================================================
   APPLICATION STATE
========================================================= */

/**
 * Loads saved destination IDs from localStorage.
 * Invalid values are ignored and duplicate IDs are removed.
 */
function loadSavedPlaces() {
    try {
        const storedValue = JSON.parse(
            localStorage.getItem("pineQuietSaved") || "[]"
        );

        if (!Array.isArray(storedValue)) {
            return [];
        }

        return [...new Set(storedValue)].filter((placeId) =>
            places.some((place) => place.id === placeId)
        );
    } catch (error) {
        console.warn("Unable to read saved places:", error);
        return [];
    }
}


/**
 * Writes the current saved-place list to localStorage.
 */
function storeSavedPlaces() {
    try {
        localStorage.setItem(
            "pineQuietSaved",
            JSON.stringify(state.saved)
        );

        return true;
    } catch (error) {
        console.error("Unable to save places:", error);
        return false;
    }
}


// Stores the current filter, search term, saved places,
// Leaflet map instance, and active map markers.
const state = {
    filter: "all",
    search: "",
    saved: loadSavedPlaces(),
    map: null,
    markers: new Map()
};


/* =========================================================
   DOM HELPERS
========================================================= */

// Shortcut for selecting one element.
const select = (selector) => document.querySelector(selector);

// Shortcut for selecting multiple elements.
const selectAll = (selector) => document.querySelectorAll(selector);

// Frequently used page elements.
const placeList = select("#placeList");
const savedGrid = select("#savedGrid");
const toast = select("#toast");
const savedCount = select("#savedCount");
const resultCount = select("#resultCount");


/* =========================================================
   SECURITY AND DISPLAY HELPERS
========================================================= */

/**
 * Escapes HTML characters before inserting text into templates.
 * This helps prevent accidental HTML injection.
 */
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


/**
 * Creates the small illustrated landscape shown on each place card.
 * The colors come from the destination's palette property.
 */
function createPlaceArtwork(place) {
    const [skyColor, landColor, accentColor] = place.palette;

    return `
    <svg
      viewBox="0 0 190 125"
      role="img"
      aria-label="Abstract Maine landscape for ${escapeHTML(place.name)}"
    >
      <rect
        width="190"
        height="125"
        fill="${skyColor}"
      />

      <circle
        cx="148"
        cy="28"
        r="15"
        fill="${accentColor}"
      />

      <path
        d="M0 69c29-15 52-8 79-21 31-14 52 3 77-7 13-6 24-7 34-5v89H0Z"
        fill="${landColor}"
        opacity=".84"
      />

      <path
        d="M0 91c31-8 55 5 88-5 31-10 54 6 78 1 9-2 17-2 24 0v38H0Z"
        fill="#eaf3ef"
        opacity=".75"
      />

      <path
        d="m28 49-16 28h11L8 101h40L34 77h11z"
        fill="#174f49"
      />

      <path
        d="m64 58-13 22h9L48 99h33L69 80h9z"
        fill="#174f49"
        opacity=".88"
      />
    </svg>
  `;
}


/* =========================================================
   FILTERING AND SEARCHING
========================================================= */

/**
 * Returns only the places that match the current filter
 * and search term.
 */
function getVisiblePlaces() {
    const searchTerm = state.search.toLowerCase().trim();

    return places.filter((place) => {
        const matchesFilter =
            state.filter === "all" ||
            place.tags.includes(state.filter);

        const searchableValues = [
            place.name,
            place.town,
            place.region,
            place.type,
            place.note
        ];

        const matchesSearch =
            !searchTerm ||
            searchableValues.some((value) =>
                value.toLowerCase().includes(searchTerm)
            );

        return matchesFilter && matchesSearch;
    });
}


/**
 * Changes the active destination filter.
 */
function setFilter(filterName) {
    state.filter = filterName;

    // Visually mark the selected filter button.
    selectAll(".filter").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filterName
        );
    });

    renderPlaces();

    select("#discover").scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================================================
   PLACE CARD RENDERING
========================================================= */

/**
 * Renders the main list of destinations.
 */
function renderPlaces(updateMap = true) {
    const visiblePlaces = getVisiblePlaces();

    resultCount.textContent =
        `${visiblePlaces.length} ${
            visiblePlaces.length === 1 ? "place" : "places"
        }`;

    if (!visiblePlaces.length) {
        placeList.innerHTML = `
      <div class="no-results">
        <strong>No calm corners found.</strong>
        <p>Try another town or filter.</p>
      </div>
    `;

        if (updateMap) {
            updateMapMarkers([]);
        }

        return;
    }

    placeList.innerHTML = visiblePlaces
        .map((place) => {
            const isSaved = state.saved.includes(place.id);

            return `
        <article
          class="place-card"
          data-id="${place.id}"
          tabindex="0"
          aria-label="Show ${escapeHTML(place.name)} on the map"
        >
          <div class="place-image">
            ${createPlaceArtwork(place)}
          </div>

          <div>
            <span class="place-type">
              ${escapeHTML(place.type)} · ${escapeHTML(place.region)}
            </span>

            <h3>${escapeHTML(place.name)}</h3>

            <p class="place-note">
              ${escapeHTML(place.note)}
            </p>

            <div class="place-tags">
              <span class="pill calm">
                Calm match: ${escapeHTML(place.calmMatch)}
              </span>

              <span class="pill">
                ${escapeHTML(place.bestWindow)}
              </span>

              <span class="pill">
                ${escapeHTML(place.parking)}
              </span>
            </div>
          </div>

          <button
            class="save-button ${isSaved ? "saved" : ""}"
            type="button"
            data-save="${place.id}"
            aria-label="${isSaved ? "Remove" : "Save"} ${escapeHTML(place.name)}"
          >
            ${isSaved ? "♥" : "♡"}
          </button>
        </article>
      `;
        })
        .join("");

    bindPlaceCardEvents();

    if (updateMap) {
        updateMapMarkers(visiblePlaces);
    }
}


/**
 * Adds click and keyboard events to newly rendered place cards.
 */
function bindPlaceCardEvents() {
    placeList.querySelectorAll(".place-card").forEach((card) => {
        card.addEventListener("click", (event) => {
            // Do not open the map marker when the save button is clicked.
            if (!event.target.closest("[data-save]")) {
                focusPlaceOnMap(card.dataset.id);
            }
        });

        card.addEventListener("keydown", (event) => {
            // Pressing Enter on a heart should only activate the heart.
            if (
                event.key === "Enter" &&
                !event.target.closest("[data-save]")
            ) {
                focusPlaceOnMap(card.dataset.id);
            }
        });
    });

    // Only bind hearts inside the main destination list.
    // Saved-list hearts receive their listeners in renderSavedPlaces().
    placeList.querySelectorAll("[data-save]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleSavedPlace(button.dataset.save);
        });
    });
}


/* =========================================================
   SAVED PLACES
========================================================= */

/**
 * Saves or removes a destination.
 */
function toggleSavedPlace(placeId) {
    const isAlreadySaved = state.saved.includes(placeId);

    if (isAlreadySaved) {
        state.saved = state.saved.filter(
            (savedId) => savedId !== placeId
        );
    } else {
        state.saved = [...state.saved, placeId];
    }

    // Save the updated list in the visitor's browser.
    const savedSuccessfully = storeSavedPlaces();

    updateSavedCount();

    showToast(
        savedSuccessfully
            ? (
                isAlreadySaved
                    ? "Removed from saved places"
                    : "Saved for a quiet day"
            )
            : "Saved places could not be updated"
    );

    // Refresh heart states without resetting the current map view.
    renderPlaces(false);
    renderSavedPlaces();
}


/**
 * Updates the saved-place number in the navigation.
 */
function updateSavedCount() {
    savedCount.textContent = state.saved.length;
}


/**
 * Renders every destination currently saved by the visitor.
 */
function renderSavedPlaces() {
    const savedPlaces = places.filter((place) =>
        state.saved.includes(place.id)
    );

    savedGrid.innerHTML = savedPlaces
        .map((place) => {
            return `
                <article class="saved-card">
                    <div class="place-image">
                        ${createPlaceArtwork(place)}
                    </div>

                    <span class="place-type">
                        ${escapeHTML(place.type)} · ${escapeHTML(place.town)}
                    </span>

                    <h3>${escapeHTML(place.name)}</h3>

                    <p class="place-note">
                        ${escapeHTML(place.note)}
                    </p>

                    <!-- All destination details stay together -->
                    <div class="place-tags">
                        <span class="pill calm">
                            Calm match: ${escapeHTML(place.calmMatch)}
                        </span>

                        <span class="pill">
                            ${escapeHTML(place.bestWindow)}
                        </span>

                        <span class="pill">
                            ${escapeHTML(place.parking)}
                        </span>
                    </div>

                    <!-- Each button now uses its own destination ID -->
                    <div class="saved-card-footer">
                        <button
                            class="save-button saved"
                            type="button"
                            data-save="${place.id}"
                            aria-label="Remove ${escapeHTML(place.name)} from saved places"
                        >
                            ♥
                        </button>
                    </div>
                </article>
            `;
        })
        .join("");

    const emptyState = select("#emptyState");
    const hasSavedPlaces = savedPlaces.length > 0;

    emptyState.style.display = hasSavedPlaces ? "none" : "block";
    savedGrid.style.display = hasSavedPlaces ? "grid" : "none";

    savedGrid.querySelectorAll("[data-save]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleSavedPlace(button.dataset.save);
        });
    });
}

/**
 * Opens the saved places section.
 */
function openSavedSection() {
    const savedSection = select("#savedSection");

    savedSection.hidden = false;
    renderSavedPlaces();

    savedSection.scrollIntoView({
        behavior: "smooth"
    });
}


/**
 * Closes the saved places section.
 */
function closeSavedSection() {
    select("#savedSection").hidden = true;

    select("#discover").scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================================================
   LEAFLET MAP
========================================================= */

/**
 * Creates the Leaflet map and OpenStreetMap tile layer.
 */
function initializeMap() {
    // Hide the map if Leaflet failed to load.
    if (!window.L) {
        select(".map-wrap").hidden = true;
        return;
    }

    state.map = L.map("map", {
        zoomControl: false,
        scrollWheelZoom: false
    }).setView([44.35, -69.15], 7);

    L.control
        .zoom({
            position: "bottomright"
        })
        .addTo(state.map);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(state.map);

    updateMapMarkers(getVisiblePlaces());
}


/**
 * Removes old markers and creates markers for visible places.
 */
function updateMapMarkers(visiblePlaces) {
    if (!state.map) {
        return;
    }

    // Remove existing markers from the map.
    state.markers.forEach((marker) => {
        state.map.removeLayer(marker);
    });

    state.markers.clear();

    visiblePlaces.forEach((place) => {
        const markerIcon = L.divIcon({
            className: "",
            html: `
        <div class="custom-marker">
          <span>✦</span>
        </div>
      `,
            iconSize: [34, 34],
            iconAnchor: [17, 30]
        });

        const marker = L.marker(
            [place.lat, place.lng],
            {
                icon: markerIcon
            }
        )
            .addTo(state.map)
            .bindPopup(`
        <strong>${escapeHTML(place.name)}</strong>
        <br>
        ${escapeHTML(place.town)} · ${escapeHTML(place.calmMatch)}
      `);

        state.markers.set(place.id, marker);
    });

    fitMapToMarkers();
}


/**
 * Adjusts the map so all currently visible markers fit on screen.
 */
function fitMapToMarkers() {
    if (!state.map || !state.markers.size) {
        return;
    }

    const markerGroup = L.featureGroup(
        [...state.markers.values()]
    );

    const bounds = markerGroup
        .getBounds()
        .pad(0.16);

    state.map.fitBounds(bounds);
}


/**
 * Zooms the map to a selected destination.
 */
function focusPlaceOnMap(placeId) {
    const place = places.find(
        (item) => item.id === placeId
    );

    if (!place || !state.map) {
        return;
    }

    // Highlight the matching destination card.
    selectAll(".place-card").forEach((card) => {
        card.classList.toggle(
            "selected",
            card.dataset.id === placeId
        );
    });

    state.map.flyTo(
        [place.lat, place.lng],
        11,
        {
            duration: 0.8
        }
    );

    state.markers
        .get(placeId)
        ?.openPopup();
}


/* =========================================================
   RANDOM DESTINATION
========================================================= */

/**
 * Selects a random destination from the current results.
 * If no results are visible, it selects from all places.
 */
function chooseRandomPlace() {
    const visiblePlaces = getVisiblePlaces();
    const placePool = visiblePlaces.length
        ? visiblePlaces
        : places;

    const randomIndex = Math.floor(
        Math.random() * placePool.length
    );

    const randomPlace = placePool[randomIndex];

    select("#discover").scrollIntoView({
        behavior: "smooth"
    });

    // Wait briefly for scrolling before highlighting the place.
    setTimeout(() => {
        focusPlaceOnMap(randomPlace.id);

        select(`[data-id="${randomPlace.id}"]`)
            ?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
    }, 400);

    showToast(`Try ${randomPlace.name}`);
}


/* =========================================================
   TOAST NOTIFICATIONS
========================================================= */

/**
 * Displays a temporary notification near the bottom of the page.
 */
function showToast(message) {
    clearTimeout(showToast.timeout);

    toast.textContent = message;
    toast.classList.add("show");

    showToast.timeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

// Filter buttons.
selectAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
        setFilter(button.dataset.filter);
    });
});

// Search input.
select("#searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderPlaces();
});

// Reset map button.
select("#mapReset").addEventListener(
    "click",
    fitMapToMarkers
);

// Random destination button.
select("#surpriseButton").addEventListener(
    "click",
    chooseRandomPlace
);

// Open saved places.
select("#savedButton").addEventListener(
    "click",
    openSavedSection
);

// Close saved places.
select("#closeSaved").addEventListener(
    "click",
    closeSavedSection
);


/* =========================================================
   COPYRIGHT YEAR
========================================================= */

// Automatically displays the current year in the footer.
const copyrightYear = select("#copyrightYear");

if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
}

/* =========================================================
   CURRENT MAINE WEATHER
   Uses Open-Meteo to retrieve current conditions for
   Portland, Maine. Open-Meteo does not require an API key.
========================================================= */

function getWeatherDisplay(weatherCode, isDay) {
    const weatherConditions = {
        0: {
            icon: isDay ? "☀" : "☾",
            description: "Clear"
        },
        1: {
            icon: isDay ? "🌤" : "☾",
            description: "Mostly clear"
        },
        2: {
            icon: "⛅",
            description: "Partly cloudy"
        },
        3: {
            icon: "☁",
            description: "Cloudy"
        },
        45: {
            icon: "🌫",
            description: "Foggy"
        },
        48: {
            icon: "🌫",
            description: "Foggy"
        },
        51: {
            icon: "🌦",
            description: "Light drizzle"
        },
        53: {
            icon: "🌦",
            description: "Drizzle"
        },
        55: {
            icon: "🌧",
            description: "Heavy drizzle"
        },
        61: {
            icon: "🌦",
            description: "Light rain"
        },
        63: {
            icon: "🌧",
            description: "Rain"
        },
        65: {
            icon: "🌧",
            description: "Heavy rain"
        },
        71: {
            icon: "🌨",
            description: "Light snow"
        },
        73: {
            icon: "❄",
            description: "Snow"
        },
        75: {
            icon: "❄",
            description: "Heavy snow"
        },
        80: {
            icon: "🌦",
            description: "Rain showers"
        },
        81: {
            icon: "🌧",
            description: "Rain showers"
        },
        82: {
            icon: "🌧",
            description: "Heavy showers"
        },
        95: {
            icon: "⛈",
            description: "Thunderstorms"
        }
    };

    return (
        weatherConditions[weatherCode] || {
            icon: "☁",
            description: "Current conditions"
        }
    );
}


/**
 * Loads current weather for Portland, Maine.
 */
async function loadCurrentWeather() {
    const weatherIcon = select("#weatherIcon");
    const weatherStatus = select("#weatherStatus");

    // Stop if the weather elements are not present.
    if (!weatherIcon || !weatherStatus) {
        return;
    }

    const latitude = 43.6591;
    const longitude = -70.2568;

    const weatherURL =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        "&current=temperature_2m,weather_code,is_day" +
        "&temperature_unit=fahrenheit" +
        "&timezone=America%2FNew_York";

    try {
        const response = await fetch(weatherURL);

        if (!response.ok) {
            throw new Error("Weather request failed.");
        }

        const weatherData = await response.json();
        const currentWeather = weatherData.current;

        const display = getWeatherDisplay(
            currentWeather.weather_code,
            currentWeather.is_day === 1
        );

        const temperature = Math.round(
            currentWeather.temperature_2m
        );

        weatherIcon.textContent = display.icon;
        weatherStatus.textContent =
            `${display.description} · ${temperature}°F`;
    } catch (error) {
        console.error("Unable to load weather:", error);

        weatherIcon.textContent = "☁";
        weatherStatus.textContent = "Weather unavailable";
    }
}


/* =========================================================
   INITIAL PAGE SETUP
========================================================= */

// Display the saved count immediately.
updateSavedCount();

// Render saved and available destinations.
renderSavedPlaces();
renderPlaces();

// Create the map after the page content is ready.
initializeMap();

// Load weather
loadCurrentWeather();
