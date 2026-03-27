export const searchCityOrCountry = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '10',
    'accept-language': 'en',
  });

  const response = await fetch(`${process.env.OSM_API_URL}/search?${params}`, {
    headers: {
      'User-Agent': `nom-nom-save-api/1.0 (${process.env.EMAIL_USER})`,
    },
  });

  if (!response.ok) {
    throw new Error(`OSM API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return parseSearchResponse(data);
};

export const parseSearchResponse = (data: any[]) => {
  const seen = new Set<string>();

  return data
    .map(item => {
      const city = item.address?.city || item.address?.town || item.address?.village;
      const countryCode = item.address?.country_code?.toUpperCase() || '';
      const country = item.address?.country || '';
      const state = item.address?.state;
      const postcode = item.address?.postcode;

      const key = `${postcode || ''}-${city || ''}-${countryCode}`;
      if (seen.has(key)) return null;
      seen.add(key);

      return {
        properties: {
          osmId: item.osm_id,
          name: city || country,
          type: city ? 'city' : 'country',
          countryCode,
          country,
          state,
          city,
          postcode,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        },
      };
    })
    .filter(Boolean);
};
