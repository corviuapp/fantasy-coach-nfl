import axios from 'axios';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export class YahooService {
  constructor() {
    this.clientId = process.env.YAHOO_CLIENT_ID;
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET;
    this.redirectUri = process.env.YAHOO_REDIRECT_URI;
    
    // Debug logs temporales
    console.log('YahooService initialized:');
    console.log('Client ID:', this.clientId ? 'SET (' + this.clientId.substring(0, 20) + '...)' : 'NOT SET');
    console.log('Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', this.redirectUri);
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'fspt-r',
      language: 'en-us'
    });
    
    return `https://api.login.yahoo.com/oauth2/request_auth?${params}`;
  }

  async getAccessToken(code) {
  try {
    // Yahoo requiere Basic Auth, NO enviar client_id/secret en params
    const params = new URLSearchParams({
      redirect_uri: this.redirectUri,
      code: code,
      grant_type: 'authorization_code'
    });

    // Crear Basic Auth header
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    console.log('Requesting token with Basic Auth...');
    console.log('Redirect URI:', this.redirectUri);

    const response = await axios.post(
      'https://api.login.yahoo.com/oauth2/get_token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Yahoo token error:', error.response?.data);
    throw error;
  }
}

async getUserLeagues(accessToken) {
  console.log('Searching for NFL leagues (including 2025 season)...\\n');
  
  // NFL game keys por año - AGREGAMOS 2025
  const nflSeasons = [
    { year: '2025', key: '460' },  // <-- Estimado, puede variar
    { year: '2024', key: '449' },
    { year: '2023', key: '423' },
    { year: '2022', key: '414' }
  ];
  
  const results = {};
  
  // Primero intentar obtener las ligas actuales (2025)
  try {
    console.log('1. Checking current season (2025) leagues...');
    const currentResponse = await axios.get(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl;seasons=2025/leagues?format=json',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    const leagues = currentResponse.data?.fantasy_content?.users?.[0]?.user?.[1]?.games?.[0]?.game?.[1]?.leagues;
    
    if (leagues && leagues.length > 0) {
      console.log(`✅ Found ${leagues.length} leagues in 2025!`);
      results.current2025 = currentResponse.data;
    } else {
      console.log('📭 No leagues found for 2025');
    }
    
  } catch (error) {
    console.log('❌ 2025 season error:', error.response?.status);
  }
  
  // Buscar sin filtro de temporada (debería traer las activas)
  try {
    console.log('\\n2. Getting current/active leagues (no year filter)...');
    const activeResponse = await axios.get(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;is_available=1;game_codes=nfl/leagues?format=json',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    results.activeLeagues = activeResponse.data;
    console.log('Active leagues response received');
    
  } catch (error) {
    console.log('❌ Active leagues error:', error.response?.status);
  }
  
  // Probar cada temporada
  for (const season of nflSeasons) {
    try {
      console.log(`\\n3. Checking NFL ${season.year}...`);
      
      const response = await axios.get(
        `https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=${season.year};game_codes=nfl/leagues?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );
      
      const data = response.data?.fantasy_content?.users?.[0]?.user?.[1]?.games;
      
      if (data && data.length > 0) {
        console.log(`✅ Found data for ${season.year}`);
        results[`season_${season.year}`] = data;
      } else {
        console.log(`📭 No data for ${season.year}`);
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️ ${season.year} season not available`);
      } else {
        console.log(`❌ ${season.year} error: ${error.response?.status}`);
      }
    }
  }
  
  console.log('\\n=== SEARCH COMPLETE ===');
  return results;
}
}
