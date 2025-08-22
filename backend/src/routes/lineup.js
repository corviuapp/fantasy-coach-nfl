import express from 'express';
import Groq from 'groq-sdk';
const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/optimize', async (req, res) => {
  try {
    const { roster } = req.body;

    if (!roster || !Array.isArray(roster)) {
      return res.status(400).json({
        error: 'Se requiere un array de jugadores en el roster'
      });
    }

    const playersWithProjections = await getPlayerProjections(roster);
    const playersWithMatchups = await analyzeMatchups(playersWithProjections);
    
    // Usar Groq para analizar los datos
    const completion = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: `Analiza los siguientes datos de jugadores de fantasy football y proporciona recomendaciones de lineup optimizado. Devuelve una respuesta en formato JSON con las siguientes propiedades: lineup_optimizado (array de jugadores recomendados para iniciar), cambios_sugeridos (array de cambios recomendados), y explicaciones (array de explicaciones detalladas para cada decisión). Datos: ${JSON.stringify(playersWithMatchups)}`
      }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const groqResponse = JSON.parse(completion.choices[0].message.content);
    const optimizedLineup = groqResponse || await generateOptimizedLineup(playersWithMatchups);

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

async function getPlayerProjections(roster) {
  return roster.map(player => ({
    ...player,
    projection: {
      points: Math.random() * 25 + 5,
      confidence: Math.random() * 100,
      ceiling: Math.random() * 35 + 10,
      floor: Math.random() * 15 + 2
    }
  }));
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

async function generateOptimizedLineup(players) {
  const startPlayers = players
    .sort((a, b) => b.projection.points - a.projection.points)
    .slice(0, Math.min(9, players.length));
  
  const sitPlayers = players.filter(player => 
    !startPlayers.find(starter => starter.player_id === player.player_id)
  );

  const changes = sitPlayers.slice(0, 3).map(player => ({
    player_id: player.player_id,
    player_name: player.name || 'Unknown Player',
    action: 'sit',
    reason: `Proyección baja (${player.projection.points.toFixed(1)} pts) y matchup ${player.matchup.difficulty.toLowerCase()}`
  }));

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
      confidence: Math.round(player.projection.confidence)
    })),
    changes,
    explanations
  };
}

export default router;
