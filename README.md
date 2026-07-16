# 🌲 Pine Companion

**Pine Companion** is a responsive travel discovery web app for solo
travelers who prefer quiet, cozy, peaceful experiences throughout Maine.

Rather than focusing on crowded tourist attractions, the app highlights
calm coastlines, independent bookshops, gardens, parks, scenic walks,
and other places suited to slower, more intentional travel.

## 🌐 Live Demo

Explore Pine Companion here:

**[pinecompanion.xyz](https://pinecompanion.xyz)**

## ✨ Features

-   Explore real destinations across Maine
-   Filter places by:
    -   Coastal
    -   Cozy
    -   Peaceful
    -   Easy Parking
-   Search by destination, town, region, or activity
-   View destinations on an interactive Leaflet map
-   Save favorite places using browser `localStorage`
-   Use the **Pick One for Me** button for a random suggestion
-   View current Portland, Maine weather using the Open-Meteo API
-   Browse a responsive, accessible interface inspired by Maine's coast
    and forests

## 📁 Project Structure

``` text
pine-companion/
├── index.html
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── data.js
    └── app.js
```

## 🚀 Run the App

Open `index.html` directly in your browser, or run:

``` bash
python -m http.server 8000
```

Then visit:

``` text
http://localhost:8000
```

## 🌿 Calm Match

Each destination includes a **Calm Match** label describing the type of
experience the place may offer.

-   **Very calm** - ideal for a peaceful, low-key outing
-   **Calm** - generally relaxed, especially outside peak times
-   **Cozy calm** - a comfortable indoor or small-town experience
-   **Cozy stop** - relaxing, but potentially more active because of
    its location

Calm Match is just a guide. It's not a safety score or a
guarantee that a destination will be quiet.

## 🗺️ Destination Information

All listed destinations are real places in Maine.

Each entry may include: 
- Location and region 
- Destination type 
- Calm Match 
- Suggested visiting window 
- Parking information 
- A short description 
- Map coordinates 
- An official source URL

Hours, fees, parking, closures, seasonal access, weather, and crowd
levels can change. Please verify details before traveling.

## 🌤️ Weather

The hero section displays current weather for Portland, Maine using the
Open-Meteo API. No API key is required.

## ❤️ Saved Places and Privacy

Saved destinations are stored locally in the visitor's browser using
`localStorage`.

This version: 
- Does not require an account 
- Does not send saved places to a database 
- Does not collect personal information 
- Allows saved data to be removed by clearing browser storage

## 🛠️ Technologies Used

-   HTML5
-   CSS3
-   JavaScript
-   Leaflet
-   OpenStreetMap
-   Open-Meteo API
-   Browser `localStorage`

## 📄 License

See [`LICENSE.txt`](./LICENSE.txt) for the full license terms.

## ⭐ Support the Project

If you find **Pine Companion** useful, consider giving the repository a star.