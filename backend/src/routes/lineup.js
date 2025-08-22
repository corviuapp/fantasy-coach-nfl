import express from 'express';
import Groq from 'groq-sdk';
import { YahooService } from '../../YahooService.js';
const router = express.Router();

const yahooService = new YahooService();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/optimize', async (req, res) => {
  try {
    const { roster, leagueKey, sessionId } = req.body;

    if (!roster || !Array.isArray(roster)) {
      return res.status(400).json({
        error: 'Se requiere un array de jugadores en el roster'
      });
    }

    if (!leagueKey || !sessionId) {
      return res.status(400).json({
        error: 'Se requiere leagueKey y sessionId para obtener configuraciones de la liga'
      });
    }

    // Obtener configuraciones de la liga de Yahoo
    let leagueSettings = null;
    let rosterPositions = [];
    let scoringSettings = null;
    
    try {
      const accessToken = await getAccessTokenFromSession(sessionId);
      if (accessToken) {
        leagueSettings = await yahooService.getLeagueSettings(accessToken, leagueKey);
        
        // Extraer game_key del league_key para obtener roster positions
        const gameKey = leagueKey.split('.')[0] + '.l.' + leagueKey.split('.')[2];
        const gameKeyOnly = leagueKey.split('.')[0];
        
        try {
          const rosterPositionsData = await yahooService.getRosterPositions(accessToken, gameKeyOnly);
          const statCategoriesData = await yahooService.getStatCategories(accessToken, gameKeyOnly);
          
          rosterPositions = parseRosterPositions(rosterPositionsData);
          scoringSettings = parseScoringSettings(statCategoriesData, leagueSettings);
        } catch (error) {
          console.log('Could not fetch roster positions or scoring settings:', error.message);
        }
      }
    } catch (error) {
      console.log('Could not fetch Yahoo league settings:', error.message);
    }

    const playersWithProjections = await getPlayerProjections(roster, scoringSettings);
    const playersWithMatchups = await analyzeMatchups(playersWithProjections);
    
    // Usar Groq para analizar los datos
    console.log('About to call Groq with roster length:', playersWithMatchups.length);
    
    let groqResponse = null;
    try {
      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'user',
          content: `Analiza los siguientes datos de jugadores de fantasy football y proporciona recomendaciones de lineup optimizado. Devuelve una respuesta en formato JSON con las siguientes propiedades: lineup_optimizado (array de jugadores recomendados para iniciar), cambios_sugeridos (array de cambios recomendados), y explicaciones (array de explicaciones detalladas para cada decisión). Datos: ${JSON.stringify(playersWithMatchups)}`
        }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      groqResponse = JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Groq API error:', error.message);
      groqResponse = null;
    }
    const optimizedLineup = groqResponse || await generateOptimizedLineup(playersWithMatchups, rosterPositions, leagueSettings);

    res.json({
      lineup_optimizado: optimizedLineup.lineup,
      cambios_sugeridos: optimizedLineup.changes,
      explicaciones: optimizedLineup.explanations
    });

  } catch (error) {
    console.error('Error optimizing lineup:', error);
    res.status(500).json({
      error: 'Error interno del servidor al optimizar lineup'
    });
  }
});

async function getPlayerProjections(roster, scoringSettings) {
  return roster.map(player => {
    const basePoints = Math.random() * 25 + 5;
    
    // Aplicar modificadores de scoring si están disponibles
    let adjustedPoints = basePoints;
    if (scoringSettings) {
      // Ajustar puntos basado en el tipo de scoring (PPR, medio PPR, standard)
      if (scoringSettings.pprValue > 0 && (player.position === 'WR' || player.position === 'RB' || player.position === 'TE')) {
        // Los receptores obtienen más puntos en ligas PPR
        adjustedPoints += Math.random() * scoringSettings.pprValue * 8; // Simular recepciones
      }
    }
    
    return {
      ...player,
      projection: {
        points: adjustedPoints,
        confidence: Math.random() * 100,
        ceiling: adjustedPoints + Math.random() * 10,
        floor: Math.max(0, adjustedPoints - Math.random() * 8),
        scoringType: scoringSettings?.scoringType || 'standard'
      }
    };
  });
}

async function analyzeMatchups(players) {
  return players.map(player => ({
    ...player,
    matchup: {
      difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)],
      opponent_rank: Math.floor(Math.random() * 32) + 1,
      weather_impact: Math.random() > 0.7 ? 'Negative' : 'Neutral',
      injury_status: ['Healthy', 'Questionable', 'Doubtful'][Math.floor(Math.random() * 3)]
    }
  }));
}

async function generateOptimizedLineup(players, rosterPositions, leagueSettings) {
  let startPlayers = [];
  let availablePlayers = [...players];
  
  // Si tenemos restricciones de posición, úsalas
  if (rosterPositions && rosterPositions.length > 0) {
    startPlayers = optimizeWithPositionConstraints(availablePlayers, rosterPositions);
  } else {
    // Fallback al método original si no hay restricciones
    startPlayers = players
      .sort((a, b) => b.projection.points - a.projection.points)
      .slice(0, Math.min(9, players.length));
  }
  
  const sitPlayers = players.filter(player => 
    !startPlayers.find(starter => starter.player_id === player.player_id)
  );

  // Generate smarter START/SIT recommendations considering position constraints
  const changes = generateStartSitRecommendations(startPlayers, sitPlayers, rosterPositions);

  const explanations = startPlayers.map(player => ({
    player_id: player.player_id,
    player_name: player.name || 'Unknown Player',
    explanation: `Start recomendado: ${player.projection.points.toFixed(1)} puntos proyectados, matchup ${player.matchup.difficulty.toLowerCase()} vs equipo ranked #${player.matchup.opponent_rank}`
  }));

  return {
    lineup: startPlayers.map(player => ({
      player_id: player.player_id,
      player_name: player.name || 'Unknown Player',
      position: player.display_position || player.position,
      projected_points: player.projection.points.toFixed(1),
      confidence: Math.round(player.projection.confidence),
      scoring_type: player.projection.scoringType || 'standard',
      lineup_position: player.optimized_position
    })),
    changes,
    explanations,
    roster_requirements: rosterPositions,
    scoring_settings: leagueSettings?.scoring_type
  };
}

// Helper functions
async function getAccessTokenFromSession(sessionId) {
  try {
    // Import session store from server
    const { sessionStore } = await import('../../server.js');
    const session = sessionStore.get(sessionId);
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting access token from session:', error);
    return null;
  }
}

function parseRosterPositions(rosterPositionsData) {
  try {
    if (!rosterPositionsData?.fantasy_content?.game?.roster_positions) {
      return [];
    }
    
    const positions = rosterPositionsData.fantasy_content.game.roster_positions;
    const rosterReqs = [];
    
    // Parse Yahoo roster positions format
    for (let i = 0; i < positions.count; i++) {
      const position = positions[i]?.roster_position;
      if (position) {
        rosterReqs.push({
          position: position.position,
          position_type: position.position_type,
          count: position.count || 1,
          is_starting_position: position.is_starting_position === '1'
        });
      }
    }
    
    return rosterReqs;
  } catch (error) {
    console.error('Error parsing roster positions:', error);
    return [];
  }
}

function parseScoringSettings(statCategoriesData, leagueSettings) {
  try {
    const scoring = {
      scoringType: 'standard',
      pprValue: 0,
      statModifiers: {}
    };
    
    // Parse scoring type from league settings
    if (leagueSettings?.fantasy_content?.league?.settings?.scoring_type) {
      scoring.scoringType = leagueSettings.fantasy_content.league.settings.scoring_type;
    }
    
    // Parse stat categories for PPR information
    if (statCategoriesData?.fantasy_content?.game?.stat_categories) {
      const stats = statCategoriesData.fantasy_content.game.stat_categories;
      
      // Look for reception stats to determine PPR value
      for (let i = 0; i < stats.count; i++) {
        const stat = stats[i]?.stat_category;
        if (stat && stat.name === 'Receptions') {
          scoring.pprValue = parseFloat(stat.value) || 0;
          break;
        }
      }
    }
    
    return scoring;
  } catch (error) {
    console.error('Error parsing scoring settings:', error);
    return { scoringType: 'standard', pprValue: 0, statModifiers: {} };
  }
}

function optimizeWithPositionConstraints(players, rosterPositions) {
  const lineup = [];
  const availablePlayers = [...players];
  
  // Sort players by projected points descending
  availablePlayers.sort((a, b) => b.projection.points - a.projection.points);
  
  // Fill required positions first
  const startingPositions = rosterPositions.filter(pos => pos.is_starting_position);
  
  for (const posReq of startingPositions) {
    const { position, count } = posReq;
    let filled = 0;
    
    for (let i = availablePlayers.length - 1; i >= 0 && filled < count; i--) {
      const player = availablePlayers[i];
      
      // Check if player can fill this position
      if (canPlayerFillPosition(player, position)) {
        player.optimized_position = position;
        lineup.push(player);
        availablePlayers.splice(i, 1);
        filled++;
      }
    }
  }
  
  return lineup;
}

function canPlayerFillPosition(player, requiredPosition) {
  const playerPos = player.display_position || player.position;
  
  // Direct position match
  if (playerPos === requiredPosition) {
    return true;
  }
  
  // Handle FLEX positions
  if (requiredPosition === 'W/R/T') {
    return ['WR', 'RB', 'TE'].includes(playerPos);
  }
  
  if (requiredPosition === 'W/R') {
    return ['WR', 'RB'].includes(playerPos);
  }
  
  // Handle other flexible positions
  if (requiredPosition === 'BN') {
    return true; // Bench can hold any position
  }
  
  return false;
}

function generateStartSitRecommendations(startPlayers, benchPlayers, rosterPositions) {
  const recommendations = [];
  
  // Find potential improvements: bench players who could replace starters
  benchPlayers.forEach(benchPlayer => {
    const betterThanStarters = startPlayers.filter(starter => {
      // Check if bench player can play starter's position and has higher projection
      const canReplace = canPlayerFillPosition(benchPlayer, starter.optimized_position || starter.position);
      const betterProjection = benchPlayer.projection.points > starter.projection.points;
      
      return canReplace && betterProjection;
    });
    
    if (betterThanStarters.length > 0) {
      const worstStarter = betterThanStarters.sort((a, b) => a.projection.points - b.projection.points)[0];
      
      recommendations.push({
        player_id: benchPlayer.player_id,
        player_name: benchPlayer.name || 'Unknown Player',
        action: 'start',
        reason: `Proyección superior (${benchPlayer.projection.points.toFixed(1)} vs ${worstStarter.projection.points.toFixed(1)} pts) y puede jugar ${worstStarter.optimized_position || worstStarter.position}`,
        replaces: worstStarter.player_id
      });
      
      recommendations.push({
        player_id: worstStarter.player_id,
        player_name: worstStarter.name || 'Unknown Player',
        action: 'sit',
        reason: `Menor proyección (${worstStarter.projection.points.toFixed(1)} pts) comparado con ${benchPlayer.name} en banca`,
        replaced_by: benchPlayer.player_id
      });
    }
  });
  
  // If no position-based improvements found, fall back to basic recommendations
  if (recommendations.length === 0) {
    const lowPerformers = benchPlayers
      .sort((a, b) => a.projection.points - b.projection.points)
      .slice(0, 3);
      
    lowPerformers.forEach(player => {
      recommendations.push({
        player_id: player.player_id,
        player_name: player.name || 'Unknown Player',
        action: 'sit',
        reason: `Proyección baja (${player.projection.points.toFixed(1)} pts) y matchup ${player.matchup?.difficulty?.toLowerCase() || 'desconocido'}`
      });
    });
  }
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

export default router;
