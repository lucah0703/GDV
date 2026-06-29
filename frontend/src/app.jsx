import { useState } from "react";
import "./app.css";

import Reichweite from "./components/Reichweite";
import Verfuegbarkeit from "./components/Verfuegbarkeit";

const cities = {
  Mannheim: [
    { name: "Universität Mannheim", students: "ca. 10.800", coords: [49.4831, 8.4632] },
    { name: "DHBW Mannheim", students: "ca. 5.900", coords: [49.4734, 8.5256] },
    { name: "Technische Hochschule Mannheim", students: "ca. 5.200", coords: [49.4691, 8.4823] },
  ],
  Karlsruhe: [
    { name: "KIT", students: "ca. 24.000", coords: [49.0095, 8.4116] },
    { name: "Hochschule Karlsruhe", students: "ca. 8.300", coords: [49.0158, 8.3916] },
    { name: "Pädagogische Hochschule Karlsruhe", students: "ca. 3.300", coords: [49.0135, 8.3965] },
  ],
  Stuttgart: [
    { name: "Universität Stuttgart", students: "ca. 20.500", coords: [48.7812, 9.1735] },
    { name: "Universität Hohenheim", students: "ca. 9.200", coords: [48.7112, 9.2132] },
    { name: "DHBW Stuttgart", students: "ca. 8.300", coords: [48.7744, 9.1685] },
  ],
};

const poisByCity = {
  Mannheim: [
    { name: "Mannheim Hbf", type: "Bahnhof", icon: "🚉", coords: [49.479, 8.469], address: "Willy-Brandt-Platz 17, 68161 Mannheim" },
    { name: "Wohnheim Innenstadt", type: "Wohnheim", icon: "🏠", coords: [49.489, 8.462], address: "Innenstadt, 68159 Mannheim" },
    { name: "Hochschulsport Mannheim", type: "Sportanlage", icon: "⚽", coords: [49.492, 8.475], address: "Nähe Universität Mannheim" },
    { name: "Luisenpark Mannheim", type: "Freizeit", icon: "🌳", coords: [49.4844, 8.4966], address: "Theodor-Heuss-Anlage 2, Mannheim" },
  ],
  Karlsruhe: [
    { name: "Karlsruhe Hbf", type: "Bahnhof", icon: "🚉", coords: [48.9937, 8.4005], address: "Bahnhofplatz 1a, 76137 Karlsruhe" },
    { name: "Wohnheim Waldhornstraße", type: "Wohnheim", icon: "🏠", coords: [49.0107, 8.4146], address: "Waldhornstraße, Karlsruhe" },
    { name: "Hochschulsport KIT", type: "Sportanlage", icon: "⚽", coords: [49.012, 8.423], address: "KIT Campus Süd, Karlsruhe" },
  ],
  Stuttgart: [
    { name: "Stuttgart Hbf", type: "Bahnhof", icon: "🚉", coords: [48.7834, 9.1816], address: "Arnulf-Klett-Platz 2, 70173 Stuttgart" },
    { name: "Wohnheim Stuttgart-Mitte", type: "Wohnheim", icon: "🏠", coords: [48.776, 9.172], address: "Stuttgart-Mitte" },
    { name: "Hochschulsport Stuttgart", type: "Sportanlage", icon: "⚽", coords: [48.781, 9.188], address: "Nähe Universität Stuttgart" },
  ],
};

const mobilityStationsByCity = {
  Mannheim: [
    {
      name: "Nextbike Universität Mannheim",
      provider: "Nextbike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [49.4835, 8.464],
      capacity: 18,
      availability: { morning: 12, midday: 8, evening: 3 },
    },
    {
      name: "Nextbike Schloss",
      provider: "Nextbike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [49.4827, 8.462],
      capacity: 14,
      availability: { morning: 0, midday: 4, evening: 8 },
    },
    {
      name: "Bolt Universität Mannheim",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      vehicle: "scooter",
      coords: [49.4838, 8.4652],
      capacity: 10,
      availability: { morning: 4, midday: 2, evening: 8 },
    },
    {
      name: "Nextbike Mannheim Hbf",
      provider: "Nextbike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [49.479, 8.469],
      capacity: 15,
      availability: { morning: 4, midday: 7, evening: 1 },
    },
    {
      name: "Bolt Paradeplatz",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      vehicle: "scooter",
      coords: [49.4875, 8.466],
      capacity: 10,
      availability: { morning: 6, midday: 3, evening: 8 },
    },
  ],
  Karlsruhe: [
    {
      name: "Nextbike KIT Campus Süd",
      provider: "Nextbike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [49.0095, 8.4116],
      capacity: 20,
      availability: { morning: 14, midday: 9, evening: 4 },
    },
    {
      name: "Bolt Karlsruhe Hbf",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      vehicle: "scooter",
      coords: [48.9937, 8.4005],
      capacity: 12,
      availability: { morning: 3, midday: 6, evening: 9 },
    },
  ],
  Stuttgart: [
    {
      name: "Nextbike Universität Stuttgart",
      provider: "Nextbike",
      type: "Bike-Station",
      vehicle: "bike",
      coords: [48.7812, 9.1735],
      capacity: 18,
      availability: { morning: 10, midday: 6, evening: 3 },
    },
    {
      name: "Bolt Stuttgart Hbf",
      provider: "Bolt",
      type: "Scooter-Pick-up",
      vehicle: "scooter",
      coords: [48.7834, 9.1816],
      capacity: 14,
      availability: { morning: 5, midday: 8, evening: 11 },
    },
  ],
};

export default function App() {
  const [city, setCity] = useState("Mannheim");
  const [school, setSchool] = useState(cities.Mannheim[0]);
  const [showAvailability, setShowAvailability] = useState(false);

  function changeCity(value) {
    setCity(value);
    setSchool(cities[value][0]);
  }

  function changeSchool(value) {
    const selectedSchool = cities[city].find((s) => s.name === value);
    setSchool(selectedSchool);
  }

  return (
  <div className="app">
    <div className="dashboard-shell">
      <header className="header">
        <div>
          <h1>Mikromobilität für Studierende</h1>
          <p>Budget-Reichweite, echte Verfügbarkeit und POI-Erreichbarkeit</p>
        </div>

        <div className="selectors">
          <label>
            Stadt
            <select value={city} onChange={(e) => changeCity(e.target.value)}>
              {Object.keys(cities).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Hochschule
            <select
              value={school.name}
              onChange={(e) => changeSchool(e.target.value)}
            >
              {cities[city].map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
          </label>

          <button onClick={() => setShowAvailability(!showAvailability)}>
            {showAvailability
              ? "Zur Budget-Ansicht"
              : "Verfügbarkeiten anzeigen"}
          </button>
        </div>
      </header>

      {!showAvailability ? (
        <Reichweite
          city={city}
          school={school}
          pois={poisByCity[city] || []}
          stations={mobilityStationsByCity[city] || []}
        />
      ) : (
        <Verfuegbarkeit
          city={city}
          school={school}
          stations={mobilityStationsByCity[city] || []}
        />
      )}
    </div>
  </div>
);
}