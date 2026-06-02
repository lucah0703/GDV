import { useEffect, useState } from 'react';
import './App.css';
import Map from './Map.jsx';

const cityData = {
  Mannheim: {
    center: [49.4831, 8.4632],
    points: [
      { name: 'Universität Mannheim', coords: [49.4831, 8.4632] },
      { name: 'DHBW Mannheim', coords: [49.4734, 8.5256] },
      { name: 'Technische Hochschule Mannheim', coords: [49.4691, 8.4823] }
    ]
  },
  Karlsruhe: {
    center: [49.0095, 8.4116],
    points: [
      { name: 'KIT', coords: [49.0095, 8.4116] },
      { name: 'Hochschule Karlsruhe', coords: [49.0158, 8.3916] },
      { name: 'Pädagogische Hochschule Karlsruhe', coords: [49.0135, 8.3965] }
    ]
  },
  Stuttgart: {
    center: [48.7812, 9.1735],
    points: [
      { name: 'Universität Stuttgart', coords: [48.7812, 9.1735] },
      { name: 'Universität Hohenheim', coords: [48.7112, 9.2132] },
      { name: 'DHBW Stuttgart', coords: [48.7744, 9.1685] }
    ]
  }
};

const providerData = [
  { city: 'Mannheim', provider: 'Lime', type: 'Bike', price: 1.85 },
  { city: 'Mannheim', provider: 'Tier', type: 'Scooter', price: 2.10 },
  { city: 'Mannheim', provider: 'Nextbike', type: 'Bike', price: 1.60 },
  { city: 'Mannheim', provider: 'Voi', type: 'Scooter', price: 2.00 },
  { city: 'Mannheim', provider: 'Donkey Republic', type: 'Bike', price: 1.75 },
  { city: 'Mannheim', provider: 'Bird', type: 'Scooter', price: 1.95 },
  { city: 'Karlsruhe', provider: 'Bird', type: 'Scooter', price: 1.95 },
  { city: 'Karlsruhe', provider: 'Nextbike', type: 'Bike', price: 1.60 },
  { city: 'Karlsruhe', provider: 'Lime', type: 'Bike', price: 1.85 },
  { city: 'Karlsruhe', provider: 'Voi', type: 'Scooter', price: 2.00 },
  { city: 'Karlsruhe', provider: 'Tier', type: 'Scooter', price: 2.15 },
  { city: 'Karlsruhe', provider: 'Donkey Republic', type: 'Bike', price: 1.75 },
  { city: 'Stuttgart', provider: 'Voi', type: 'Scooter', price: 2.00 },
  { city: 'Stuttgart', provider: 'Donkey Republic', type: 'Bike', price: 1.75 },
  { city: 'Stuttgart', provider: 'Lime', type: 'Bike', price: 1.90 },
  { city: 'Stuttgart', provider: 'Tier', type: 'Scooter', price: 2.10 },
  { city: 'Stuttgart', provider: 'Bird', type: 'Scooter', price: 1.95 },
  { city: 'Stuttgart', provider: 'Nextbike', type: 'Bike', price: 1.60 }
];

const providerLogoData = {
  Lime: { abbrev: 'L', color: '#22c55e' },
  Tier: { abbrev: 'T', color: '#0ea5e9' },
  Bird: { abbrev: 'B', color: '#2563eb' },
  Nextbike: { abbrev: 'N', color: '#7c3aed' },
  Voi: { abbrev: 'V', color: '#f97316' },
  'Donkey Republic': { abbrev: 'DR', color: '#f59e0b' }
};

function getProviderLogo(provider) {
  return (
    providerLogoData[provider] || {
      abbrev: provider
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      color: '#64748b'
    }
  );
}

function App() {
  const [selectedCity, setSelectedCity] = useState('Mannheim');
  const [selectedStart, setSelectedStart] = useState(null);
  const [viewMode, setViewMode] = useState('Karte');
  const [tariffMode, setTariffMode] = useState('Student');
  const [selectedTypes, setSelectedTypes] = useState(['Bike', 'Scooter']);
  const [selectedProviders, setSelectedProviders] = useState(providerData.map((item) => item.provider));
  const [listFilter, setListFilter] = useState('all');

  useEffect(() => {
    // Effect removed - startpoint is not auto-selected
  }, []);

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    setSelectedStart(null);
  };

  const handleStartChange = (event) => {
    const nextPoint = cityData[selectedCity].points.find(
      (point) => point.name === event.target.value
    );
    if (nextPoint) {
      setSelectedStart(nextPoint);
    }
  };

  const handleTariffMode = (mode) => {
    setTariffMode(mode);
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type]
    );
  };

  const handleProviderToggle = (provider) => {
    setSelectedProviders((current) =>
      current.includes(provider) ? current.filter((item) => item !== provider) : [...current, provider]
    );
  };

  const providerGroups = [
    {
      type: 'Bike',
      providers: Array.from(new Set(providerData.filter((item) => item.type === 'Bike').map((item) => item.provider))).sort()
    },
    {
      type: 'Scooter',
      providers: Array.from(new Set(providerData.filter((item) => item.type === 'Scooter').map((item) => item.provider))).sort()
    }
  ];

  useEffect(() => {
    setSelectedProviders((current) =>
      current.filter((provider) =>
        providerData.some((item) => item.provider === provider && selectedTypes.includes(item.type))
      )
    );
  }, [selectedTypes]);

  const sortedProviders = providerData
    .filter((item) => item.city === selectedCity)
    .filter((item) => selectedTypes.includes(item.type))
    .filter((item) => selectedProviders.includes(item.provider))
    .sort((a, b) => a.price - b.price);

  const costProviders = sortedProviders.slice(0, 10);
  const bikeCosts = costProviders.filter((item) => item.type === 'Bike');
  const scooterCosts = costProviders.filter((item) => item.type === 'Scooter');
  const allCosts = [...bikeCosts, ...scooterCosts];
  const maxCost = allCosts.length ? Math.max(...allCosts.map((item) => item.price)) : 1;

  const handleViewMode = (mode) => {
    setViewMode(mode);
  };

  return (
    <div className="dashboard-container">
      <header className="top-bar">
        <div className="title-section">
          <h1>Micromobility Dashboard</h1>
          <p>Wähle deine Stadt und einen Startpunkt aus, um zu sehen, wie weit du in <strong>30 Minuten</strong> kommst!</p>
        </div>
        <div className="top-controls">
          <span className="view-label">Ansicht</span>
          <button className={`mode-btn ${viewMode === 'Karte' ? 'active' : ''}`} onClick={() => handleViewMode('Karte')}>
            Karte
          </button>
          <button className={`mode-btn ${viewMode === 'Auflistung' ? 'active' : ''}`} onClick={() => handleViewMode('Auflistung')}>
            Auflistung
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar-left">
          <div className="card">
            <h3>1. Stadt & Startpunkt</h3>
            <label htmlFor="city-select">Stadt wählen</label>
            <select id="city-select" value={selectedCity} onChange={handleCityChange}>
              {Object.keys(cityData).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <label htmlFor="start-select">Startpunkt wählen</label>
            <select id="start-select" value={selectedStart?.name || ''} onChange={handleStartChange}>
              <option value="" disabled>
                Wähle deinen Startpunkt
              </option>
              {cityData[selectedCity].points.map((point) => (
                <option key={point.name} value={point.name}>
                  {point.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card">
            <h3>2. Tarifmodus</h3>
            <div className="toggle-row compact">
              <button className={`toggle-pill ${tariffMode === 'Student' ? 'active' : ''}`} onClick={() => handleTariffMode('Student')}>
                Gratis Studententarif
              </button>
              <button className={`toggle-pill ${tariffMode === 'Regular' ? 'active' : ''}`} onClick={() => handleTariffMode('Regular')}>
                Regulärer Tarif
              </button>
            </div>
            <p className="card-note">30 Minuten gratis mit Studententarif, danach normale Gebühren.</p>
          </div>

          <div className="card">
            <h3>3. Fahrzeugtyp</h3>
            <div className="checkbox-list compact">
              <label className="checkbox-item compact">
                <input type="checkbox" checked={selectedTypes.includes('Bike')} onChange={() => handleTypeToggle('Bike')} />
                <span>Bike / E-Bike</span>
              </label>
              <label className="checkbox-item compact">
                <input type="checkbox" checked={selectedTypes.includes('Scooter')} onChange={() => handleTypeToggle('Scooter')} />
                <span>E-Scooter</span>
              </label>
            </div>
          </div>

          <div className="card">
            <h3>4. Anbieter</h3>
            <div className="provider-grid compact">
              {providerGroups.map(({ type, providers }) =>
                selectedTypes.includes(type) ? (
                  <div key={type} className="provider-group-filter">
                    <div className="provider-group-title">{type}</div>
                    {providers.map((provider) => {
                      const logo = getProviderLogo(provider);
                      return (
                        <label key={provider} className="checkbox-item compact provider-filter-item">
                          <input
                            type="checkbox"
                            checked={selectedProviders.includes(provider)}
                            onChange={() => handleProviderToggle(provider)}
                          />
                          <span className="provider-logo provider-logo-small" style={{ background: logo.color }}>
                            {logo.abbrev}
                          </span>
                          <span>{provider}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </aside>

        <main className="map-area">
          {viewMode === 'Auflistung' ? (
            <div className="provider-list-view">
              <h3>Anbieter in der 30-min-Zone</h3>
              <p>Sortiert von günstig nach teuer. Scooter und Bike/E-Bike getrennt.</p>
              {sortedProviders.length > 0 && (
                <div className="provider-minimum">
                  Niedrigster Preis: <strong>{sortedProviders[0].price.toFixed(2)} €/30 min</strong>
                </div>
              )}
              <div className="provider-group">
                <h4>Scooter</h4>
                <ol>
                  {sortedProviders.filter((item) => item.type === 'Scooter').map((item) => (
                    <li key={`${item.provider}-scooter`} className="provider-item">
                      <span>
                        <span className="provider-logo" style={{ background: getProviderLogo(item.provider).color }}>
                          {getProviderLogo(item.provider).abbrev}
                        </span>
                        <span className="provider-type-icon scooter"></span>
                        {item.provider}
                      </span>
                      <span>{item.price.toFixed(2)} €</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="provider-group">
                <h4>Bike / E-Bike</h4>
                <ol>
                  {sortedProviders.filter((item) => item.type === 'Bike').map((item) => (
                    <li key={`${item.provider}-bike`} className="provider-item">
                      <span>
                        <span className="provider-logo" style={{ background: getProviderLogo(item.provider).color }}>
                          {getProviderLogo(item.provider).abbrev}
                        </span>
                        <span className="provider-type-icon bike"></span>
                        {item.provider}
                      </span>
                      <span>{item.price.toFixed(2)} €</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <>
              <Map center={selectedStart?.coords || cityData[selectedCity].center} label={selectedStart?.name || null} markerCoords={selectedStart?.coords || null} />
              <div className="map-legend">
                <h4>Legende</h4>
                <ul>
                  <li>
                    <span className="legend-icon legend-start">📍</span> Ausgewählter Startpunkt
                  </li>
                  <li>
                    <span className="legend-icon">🎓</span> Studentische Wohnheime
                  </li>
                  <li>
                    <span className="legend-icon">🚉</span> Bahnhöfe
                  </li>
                  <li>
                    <span className="legend-icon">🏟️</span> Hochschulsportstätte
                  </li>
                </ul>
              </div>
            </>
          )}
        </main>

        <aside className="sidebar-right">
          <div className="card">
            <h3>Kostenvergleich <small>(30 Minuten)</small></h3>
            <div className="tab-buttons">
              <button
                data-filter="all"
                className={listFilter === 'all' ? 'active' : ''}
                onClick={() => setListFilter('all')}
              >
                Alle
              </button>
              <button
                data-filter="bike"
                className={listFilter === 'bike' ? 'active' : ''}
                onClick={() => setListFilter('bike')}
              >
                Bikes
              </button>
              <button
                data-filter="scooter"
                className={listFilter === 'scooter' ? 'active' : ''}
                onClick={() => setListFilter('scooter')}
              >
                Scooter
              </button>
            </div>
            <div className="chart-section">
              {(listFilter === 'all' || listFilter === 'bike') && bikeCosts.length > 0 && (
                <>
                  <h4>Bikes</h4>
                  {bikeCosts.map((item) => {
                    const logo = getProviderLogo(item.provider);
                    return (
                      <div key={`${item.provider}-bike-chart`} className="chart-row">
                        <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="provider-logo provider-logo-small" style={{ background: logo.color }}>
                            {logo.abbrev}
                          </span>
                          {item.provider}
                        </span>
                        <div className="bar-container">
                          <div className="bar bike-bar" style={{ width: `${(item.price / maxCost) * 100}%` }}></div>
                        </div>
                        <span className="price">{item.price.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </>
              )}
              {(listFilter === 'all' || listFilter === 'scooter') && scooterCosts.length > 0 && (
                <>
                  <h4 style={{ marginTop: '20px' }}>Scooter</h4>
                  {scooterCosts.map((item) => {
                    const logo = getProviderLogo(item.provider);
                    return (
                      <div key={`${item.provider}-scooter-chart`} className="chart-row">
                        <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="provider-logo provider-logo-small" style={{ background: logo.color }}>
                            {logo.abbrev}
                          </span>
                          {item.provider}
                        </span>
                        <div className="bar-container">
                          <div className="bar scooter-bar" style={{ width: `${(item.price / maxCost) * 100}%` }}></div>
                        </div>
                        <span className="price">{item.price.toFixed(2)} €</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
          <div className="card note-card">
            <h3>Hinweis</h3>
            <p>Die angezeigten Kosten basieren auf den regulären Preisen der Anbieter und können je nach Tarifmodus variieren.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;