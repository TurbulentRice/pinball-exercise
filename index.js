const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3000;

const API_ORIGIN = 'https://pinballmap.com/api/v1';

/**
 * Serve client
 */
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Return locations and region data for coordinates
 */
app.get('/api/closest', async (req, res) => {
  const { latitude, longitude } = req.query;
  try {
    if (!latitude || !longitude) {
      throw new Error('Missing required fields.');
    }

    const regionRes = await axios.get(`${API_ORIGIN}/regions/closest_by_lat_lon.json?lat=${latitude}&lon=${longitude}`);
    const regionData = regionRes.data;

    if (regionData.errors) {
      throw new Error(regionData.errors);
    }

    const { region } = regionData;

    const locationsRes = await axios.get(`${API_ORIGIN}/region/${region.name}/locations.json`);
    const { locations } = locationsRes.data;

    return res.json({ locations, region });
  } catch(e) {
    console.error(e.message);
    return res.sendStatus(400);
  }
});

/**
 * Redirect 404 to client
 */
app.all('*', (req, res) => res.redirect('/'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
