import axios from 'axios';

export class YahooService {
  constructor() {
    this.clientId = process.env.YAHOO_CLIENT_ID;
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET;
    this.redirectUri = process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/auth/yahoo/callback';
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
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: code,
        grant_type: 'authorization_code'
      });

      const response = await axios.post(
        'https://api.login.yahoo.com/oauth2/get_token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
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
    try {
      const response = await axios.get(
        'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games/nfl/leagues?format=json',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Yahoo API error:', error);
      throw error;
    }
  }

  async getLeagueSettings(accessToken, leagueKey) {
    try {
      const response = await axios.get(
        `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/settings?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Yahoo League Settings API error:', error);
      throw error;
    }
  }

  async getRosterPositions(accessToken, gameKey) {
    try {
      const response = await axios.get(
        `https://fantasysports.yahooapis.com/fantasy/v2/game/${gameKey}/roster_positions?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Yahoo Roster Positions API error:', error);
      throw error;
    }
  }

  async getStatCategories(accessToken, gameKey) {
    try {
      const response = await axios.get(
        `https://fantasysports.yahooapis.com/fantasy/v2/game/${gameKey}/stat_categories?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Yahoo Stat Categories API error:', error);
      throw error;
    }
  }
}
