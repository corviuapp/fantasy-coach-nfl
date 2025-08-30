import { useState, useEffect } from 'react';
import RulesExplainer from './components/RulesExplainer';
import ExpertConsensus from './components/ExpertConsensus';
import AskCoach from './components/AskCoach';
// Removed API_URL import - using hardcoded URLs

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginData, setLoginData] = useState({ 
    email: 'demo@example.com', 
    password: 'demo123' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftRecs, setDraftRecs] = useState([]);
  const [leagues, setLeagues] = useState([]);

  // LineupOptimizer Component
  const LineupOptimizer = ({ leagues }) => {
    const [selectedLeague, setSelectedLeague] = useState('');
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recommendations, setRecommendations] = useState(null);
    const [showRecommendations, setShowRecommendations] = useState(false);
    const [recommendationsLoading, setRecommendationsLoading] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState('');

    const accessToken = localStorage.getItem('yahoo_accessToken');
    const availableLeagues = leagues.filter(league => league.draft_status === 'postdraft');


    const fetchRoster = async (leagueKey, teamKey = null) => {
      const accessToken = localStorage.getItem('yahoo_accessToken');
      if (!accessToken || !leagueKey) return;
      
      setLoading(true);
      try {
        const url = teamKey ? 
          `https://fantasy-coach-backend-production.up.railway.app/api/yahoo/roster?accessToken=${accessToken}&leagueKey=${leagueKey}&teamKey=${teamKey}` :
          `https://fantasy-coach-backend-production.up.railway.app/api/yahoo/roster?accessToken=${accessToken}&leagueKey=${leagueKey}`;
        
        console.log(`🚨 FRONTEND DEBUG: Llamando a roster con:`);
        console.log(`   - leagueKey: ${leagueKey}`);
        console.log(`   - teamKey: ${teamKey || 'AUTO-DETECT'}`);
        console.log(`   - URL completa: ${url}`);
        
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        console.log('🚨 EMERGENCY DEBUG - Raw roster data:', JSON.stringify(data, null, 2));
        
        try {
          // Try the new format first (current backend response)
          let roster = data?.roster;
          let team = null;
          
          // If new format fails, try the old format
          if (!roster) {
            team = data?.fantasy_content?.team;
            if (team && team[1] && team[1].roster && team[1].roster[0]) {
              roster = team[1].roster;
            }
          }
          
          console.log('🚨 ROSTER STRUCTURE:', roster);
          console.log('🚨 TEAM STRUCTURE:', team);
          
          if (roster && roster[0] && roster[0].players) {
            const playersData = roster[0].players;
            console.log('🚨 PLAYERS DATA:', playersData);
            
            const players = [];
            
            for (let i = 0; i < playersData.count; i++) {
              const playerObj = playersData[i];
              if (playerObj && playerObj.player) {
                const playerArray = playerObj.player;
                if (Array.isArray(playerArray) && playerArray.length >= 2) {
                  const playerInfo = playerArray[0];
                  const playerMeta = playerArray[1];
                  players.push({
                    player_id: playerInfo[0]?.player_id || playerInfo[1]?.player_id || i,
                    name: playerInfo[2]?.name?.full || playerInfo[3]?.name?.full || 'Unknown',
                    position: playerInfo[4]?.display_position || playerInfo[5]?.display_position || 'POS',
                    team: playerInfo[6]?.editorial_team_abbr || playerInfo[7]?.editorial_team_abbr || 'TEAM',
                    status: playerInfo[8]?.status || '',
                    selected_position: playerMeta?.selected_position?.[1]?.position || 'BN'
                  });
                }
              }
            }
            
            console.log('✅ Processed players:', players);
            setRoster(players);
          } else {
            console.log('❌ No roster found in data structure');
            setRoster([]);
          }
          setLoading(false);
        } catch (err) {
          console.error('❌ Processing error:', err);
          setError('Error processing roster');
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Error fetching roster:', err);
        alert('Error fetching roster. Please try again.');
        setLoading(false);
      }
    };

    const handleLeagueSelect = (e) => {
      const leagueKey = e.target.value;
      setSelectedLeague(leagueKey);
      setSelectedTeam('');
      setRoster([]);
      
      if (leagueKey) {
        // Auto-select and load user's team if available
        const selectedLeagueData = leagues.find(league => league.id === leagueKey);
        if (selectedLeagueData?.user_team_key) {
          console.log(`🚨 AUTO-SELECTING user team: ${selectedLeagueData.user_team_name} (${selectedLeagueData.user_team_key})`);
          setSelectedTeam(selectedLeagueData.user_team_key);
          // Auto-load roster for user's team
          fetchRoster(leagueKey, selectedLeagueData.user_team_key);
        }
      }
    };


    const handleGetRecommendations = async () => {
      if (!roster.length || !selectedLeague) {
        setError('Please select a league and load roster first');
        return;
      }

      setRecommendationsLoading(true);
      setError('');
      
      try {
        const accessToken = localStorage.getItem('yahoo_accessToken');
        const response = await fetch("https://fantasy-coach-backend-production.up.railway.app/api/lineup/optimize", {
          method: 'POST',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roster: roster,
            leagueKey: selectedLeague,
            accessToken: accessToken
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setRecommendations(data);
          setShowRecommendations(true);
        } else {
          setError(data.message || 'Error getting recommendations');
        }
      } catch (err) {
        console.error('Error getting recommendations:', err);
        setError('Failed to get recommendations. Please try again.');
      } finally {
        setRecommendationsLoading(false);
      }
    };

    const getPlayerRecommendation = (player) => {
      return recommendations?.cambios_sugeridos?.find(c => c.player_id === player.player_id) || null;
    };

    const startingLineup = roster.filter(player => player.selected_position !== 'BN');
    const bench = roster.filter(player => player.selected_position === 'BN');

    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start/Sit Analyzer</h2>
        
        {!accessToken ? (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <p className="text-center text-gray-600 py-10">
              🔗 Please connect your Yahoo account to access Start/Sit recommendations
            </p>
          </div>
        ) : availableLeagues.length === 0 ? (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
            <p className="text-center text-gray-600 py-10">
              📅 No leagues with completed drafts found
            </p>
          </div>
        ) : (
          <>
            {/* League Selector */}
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select League:
              </label>
              <select 
                value={selectedLeague}
                onChange={handleLeagueSelect}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              >
                <option value="">Choose a league...</option>
                {availableLeagues.map((league) => (
                  <option key={league.league_key} value={league.league_key}>
                    {league.name} ({league.team_count} teams)
                  </option>
                ))}
              </select>

              {/* Team Status */}
              {selectedLeague && (
                <>
                  {(() => {
                    const selectedLeagueData = leagues.find(league => league.id === selectedLeague);
                    if (selectedLeagueData?.user_team_key) {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                          <p className="text-sm text-green-800">
                            ✅ <strong>Your team:</strong> {selectedLeagueData.user_team_name} ({selectedLeagueData.user_team_key})
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                          <p className="text-sm text-red-800">
                            ⚠️ <strong>Team not found:</strong> This league doesn't have user team information.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </>
              )}
            </div>

            {loading && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
                <p className="text-center text-gray-600">Loading roster...</p>
              </div>
            )}

            {roster.length > 0 && (
              <>
                {/* Get Recommendations Button */}
                <div className="mb-6 text-center">
                  <button
                    onClick={handleGetRecommendations}
                    disabled={recommendationsLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    {recommendationsLoading ? 'Getting Recommendations...' : 'Get Start/Sit Recommendations'}
                  </button>
                </div>

                {/* Roster Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {/* Starting Lineup */}
                  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Starting Lineup ({startingLineup.length})
                    </h3>
                    <div className="space-y-0.5">
                      {startingLineup.map((player) => {
                        const recommendation = getPlayerRecommendation(player);
                        const isRecommendedSit = recommendation?.action === 'sit';
                        const isRecommendedStart = recommendation?.action === 'start';
                        const shouldShowStartBadge = showRecommendations && !recommendation;
                        return (
                        <div key={player.player_id} className={`border rounded-md p-1 ${
                          isRecommendedSit ? 'border-red-300 bg-red-50' :
                          isRecommendedStart ? 'border-green-300 bg-green-50' :
                          shouldShowStartBadge ? 'border-green-300 bg-green-50' :
                          'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-xs text-gray-900">{player.name}</h4>
                              <div className="text-xs text-gray-600 mt-0.5">
                                <span className="font-medium">{player.position}</span> - {player.team}
                                {player.selected_position !== player.position && (
                                  <span className="ml-2 text-indigo-600">({player.selected_position})</span>
                                )}
                              </div>
                              {player.status && (
                                <div className="mt-0.5">
                                  <span className={`text-xs px-1 py-0.5 rounded-full ${
                                    player.status === 'Q' ? 'bg-yellow-100 text-yellow-800' :
                                    player.status === 'O' ? 'bg-red-50 text-red-600' :
                                    player.status === 'IR' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {player.status === 'Q' ? 'Questionable' :
                                     player.status === 'O' ? 'Out' :
                                     player.status === 'IR' ? 'IR' :
                                     player.status}
                                  </span>
                                </div>
                              )}
                              {recommendation ? (
                                <div className="mt-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    recommendation.action === 'sit' ? 'bg-red-50 text-red-600' :
                                    recommendation.action === 'start' ? 'bg-green-50 text-green-600' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {recommendation.action === 'sit' ? 'Recommended SIT' :
                                     recommendation.action === 'start' ? 'Recommended START' :
                                     `${recommendation.action.toUpperCase()}`}
                                  </span>
                                  {recommendation.reason && (
                                    <div className="text-xs text-gray-600 mt-0.5">
                                      {recommendation.reason}
                                    </div>
                                  )}
                                </div>
                              ) : shouldShowStartBadge && (
                                <div className="mt-1">
                                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-600">
                                    Recommended START
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {startingLineup.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No players in starting lineup</p>
                      )}
                    </div>
                  </div>

                  {/* Bench */}
                  <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                      Bench ({bench.length})
                    </h3>
                    <div className="space-y-0.5">
                      {bench.map((player) => {
                        const recommendation = getPlayerRecommendation(player);
                        const isRecommendedStart = recommendation?.action === 'start';
                        const isRecommendedSit = recommendation?.action === 'sit';
                        return (
                        <div key={player.player_id} className={`border rounded-md p-1 ${
                          isRecommendedStart ? 'border-green-300 bg-green-50' :
                          isRecommendedSit ? 'border-red-300 bg-red-50' :
                          'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-xs text-gray-900">{player.name}</h4>
                              <div className="text-xs text-gray-600 mt-0.5">
                                <span className="font-medium">{player.position}</span> - {player.team}
                              </div>
                              {player.status && (
                                <div className="mt-0.5">
                                  <span className={`text-xs px-1 py-0.5 rounded-full ${
                                    player.status === 'Q' ? 'bg-yellow-100 text-yellow-800' :
                                    player.status === 'O' ? 'bg-red-50 text-red-600' :
                                    player.status === 'IR' ? 'bg-red-50 text-red-600' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {player.status === 'Q' ? 'Questionable' :
                                     player.status === 'O' ? 'Out' :
                                     player.status === 'IR' ? 'IR' :
                                     player.status}
                                  </span>
                                </div>
                              )}
                              {recommendation && (
                                <div className="mt-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    recommendation.action === 'sit' ? 'bg-red-50 text-red-600' :
                                    recommendation.action === 'start' ? 'bg-green-50 text-green-600' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {recommendation.action === 'sit' ? 'Recommended SIT' :
                                     recommendation.action === 'start' ? 'Recommended START' :
                                     `${recommendation.action.toUpperCase()}`}
                                  </span>
                                  {recommendation.reason && (
                                    <div className="text-xs text-gray-600 mt-0.5">
                                      {recommendation.reason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                      {bench.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No players on bench</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* League Information */}
                {recommendations && (recommendations.roster_requirements || recommendations.scoring_settings) && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-2 shadow-sm border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">League Configuration</h3>
                    
                    {recommendations.scoring_settings && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-700">Scoring Format: </span>
                        <span className="text-xs text-gray-600 capitalize">{recommendations.scoring_settings}</span>
                      </div>
                    )}
                    
                    {recommendations.roster_requirements && recommendations.roster_requirements.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Roster Requirements:</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                          {recommendations.roster_requirements
                            .filter(req => req.is_starting_position)
                            .map((req, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {req.count}x {req.position}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Recommendations */}
                {recommendations && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-2 shadow-sm border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">AI Recommendations</h3>
                    
                    {/* Cambios Sugeridos */}
                    {recommendations.cambios_sugeridos && recommendations.cambios_sugeridos.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Suggested Changes</h4>
                        <div className="space-y-2">
                          {recommendations.cambios_sugeridos.map((cambio, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-blue-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {cambio.player_name || `Player ${cambio.player_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                      cambio.action === 'start' ? 'bg-green-50 text-green-600' :
                                      cambio.action === 'sit' ? 'bg-red-50 text-red-600' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {cambio.action === 'start' ? 'START' :
                                       cambio.action === 'sit' ? 'SIT' :
                                       cambio.action?.toUpperCase()}
                                    </span>
                                  </div>
                                  {cambio.reason && (
                                    <div className="text-sm text-gray-700 mt-2">
                                      {cambio.reason}
                                    </div>
                                  )}
                                  {(cambio.replaces || cambio.replaced_by) && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {cambio.replaces && `Replaces: Player ${cambio.replaces}`}
                                      {cambio.replaced_by && `Replaced by: Player ${cambio.replaced_by}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lineup Optimizado */}
                    {recommendations.lineup_optimizado && recommendations.lineup_optimizado.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Optimized Lineup</h4>
                        <div className="space-y-2">
                          {recommendations.lineup_optimizado.map((player, index) => (
                            <div key={index} className="bg-white rounded-lg p-2 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {player.player_name || player.name || `Player ${player.player_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {player.position} - {player.team}
                                    {player.lineup_position && (
                                      <span className="ml-2 text-indigo-600">→ {player.lineup_position}</span>
                                    )}
                                    {player.scoring_type && player.scoring_type !== 'standard' && (
                                      <span className="ml-2 text-green-600 text-xs">({player.scoring_type})</span>
                                    )}
                                  </div>
                                </div>
                                {player.projected_points && (
                                  <div className="text-sm font-medium text-blue-600">
                                    {player.projected_points} pts
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {selectedLeague && roster.length === 0 && !loading && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                <p className="text-center text-gray-600 py-10">
                  No roster data found for this league
                </p>
              </div>
            )}
          </>
        )}
      </>
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch("https://fantasy-coach-backend-production.up.railway.app/api/auth/login", {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setShowLogin(false);
      } else {
        setError('Invalid credentials. Use demo@example.com / demo123');
      }
    } catch (err) {
      setError(`Cannot connect to backend. Make sure it's running on https://fantasy-coach-backend-production.up.railway.app`);
    }
    
    setLoading(false);
  };

  const loadDraftRecommendations = async () => {
    try {
      const response = await fetch("https://fantasy-coach-backend-production.up.railway.app/api/recommendations/draft", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      setDraftRecs(data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const fetchLeagues = async (accessToken) => {
    try {
      const response = await fetch(`https://fantasy-coach-backend-production.up.railway.app/api/yahoo/leagues?accessToken=${accessToken}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      
      console.log('🚨 LEAGUES RESPONSE:', JSON.stringify(data, null, 2));
      
      if (data.fantasy_content) {
        const yahooLeagues = [];
        const users = data.fantasy_content.users;
        if (users && users['0']) {
          const user = users['0'].user;
          if (user && user[1] && user[1].games) {
            const games = user[1].games;
            if (games && games['0'] && games['0'].game) {
              const game = games['0'].game;
              if (game[1] && game[1].leagues) {
                const leaguesObj = game[1].leagues;
                // Iterar sobre las propiedades del objeto (0, 1, 2, 3, count)
                for (const key in leaguesObj) {
                  if (key !== 'count' && leaguesObj[key].league) {
                    const league = leaguesObj[key].league[0];
                    const leagueData = {
                      id: league.league_key,
                      name: league.name,
                      teams: parseInt(league.num_teams),
                      platform: 'yahoo',
                      draft_status: league.draft_status,
                      user_team_key: league.user_team_key, // ✅ Add user's team key
                      user_team_name: league.user_team_name // ✅ Add user's team name
                    };
                    
                    console.log(`🚨 Liga procesada: ${league.name} - User team: ${league.user_team_name} (${league.user_team_key})`);
                    yahooLeagues.push(leagueData);
                  }
                }
              }
            }
          }
        }
        console.log('Parsed leagues:', yahooLeagues);
        setLeagues(yahooLeagues);
      }
    } catch (err) {
      console.error('Error fetching leagues:', err);
    }
  };

  useEffect(() => {
    if (!showLogin && activeTab === 'draft') {
      loadDraftRecommendations();
    }
  }, [showLogin, activeTab]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        localStorage.setItem("yahoo_accessToken", accessToken);
        setShowLogin(false);
        fetchLeagues(accessToken);
        window.location.hash = "";
      }
    }
    
    // Check if there's a stored accessToken on component mount
    const storedAccessToken = localStorage.getItem('yahoo_accessToken');
    if (storedAccessToken) {
      fetchLeagues(storedAccessToken);
    }
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      background: showLogin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: showLogin ? 'flex' : 'flex',
      flexDirection: 'column',
      overflow: showLogin ? 'auto' : 'hidden'
    },
    loginBox: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      maxWidth: '400px',
      width: '100%',
      margin: '0 20px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      marginBottom: '15px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    header: {
      background: 'white',
      padding: window.innerWidth < 640 ? '10px 15px' : '15px 30px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0
    },
    nav: {
      background: 'white',
      padding: window.innerWidth < 640 ? '0 15px' : '0 30px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      gap: window.innerWidth < 640 ? '10px' : '30px',
      transition: 'all 0.3s ease',
      flexShrink: 0,
      overflowX: 'auto'
    },
    navTab: {
      padding: window.innerWidth < 640 ? '10px 8px' : '15px 5px',
      background: 'none',
      border: 'none',
      borderBottom: '3px solid transparent',
      cursor: 'pointer',
      fontSize: window.innerWidth < 640 ? '13px' : '15px',
      color: '#666',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      minWidth: 'fit-content'
    },
    navTabActive: {
      borderBottom: '3px solid #667eea',
      color: '#667eea',
      fontWeight: 'bold',
      transform: 'translateY(-1px)'
    },
    content: {
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '0 20px',
      '@media (min-width: 640px)': {
        margin: '30px auto',
        padding: '0 30px'
      }
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }
  };

  if (showLogin) {
    return (
      <div style={{...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={styles.loginBox}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>
              🏈 Fantasy Coach NFL
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Your AI-powered fantasy assistant
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                Email
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                style={styles.input}
                placeholder="demo@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                style={styles.input}
                placeholder="demo123"
                required
              />
            </div>

            {error && (
              <div style={{ 
                background: '#fee', 
                color: '#c00', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                fontSize: '14px' 
              }}>
                {error}
              </div>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666'
          }}>
            Demo credentials:<br/>
            <strong>demo@example.com / demo123</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
          🏈 Fantasy Coach NFL
        </h1>
        <button 
          onClick={() => {
            setShowLogin(true);
            setUser(null);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
        >
          🚪 Logout
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-7 sm:flex sm:space-x-8 max-w-7xl mx-auto">
        {['dashboard', 'draft', 'lineup', 'waivers', 'coach', 'experts', 'rules'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
            className={`px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === tab 
                ? 'border-indigo-500 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab === 'dashboard' ? 'Dashboard' : 
             tab === 'experts' ? 'Experts' :
             tab === 'rules' ? 'Rules' :
             tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600">3rd</div>
                <div className="text-gray-600 text-sm sm:text-base mt-1">Current Standing</div>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">71%</div>
                <div className="text-gray-600 text-sm sm:text-base mt-1">Win Rate</div>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">1,247</div>
                <div className="text-gray-600 text-sm sm:text-base mt-1">Points For</div>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">$67</div>
                <div className="text-gray-600 text-sm sm:text-base mt-1">FAAB Left</div>
              </div>
            </div>

            {/* Yahoo Leagues Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">My Leagues</h3>
              {leagues.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leagues.map((league) => (
                    <div key={league.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="mb-3">
                        <h4 className="font-semibold text-gray-900 mb-1">{league.name}</h4>
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span>Teams:</span>
                            <span className="font-medium">{league.teams}</span>
                          </div>
                          <div className="flex justify-between items-center mb-1">
                            <span>Platform:</span>
                            <span className="font-medium capitalize">{league.platform}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Draft:</span>
                            <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                              league.draft_status === 'postdraft' 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {league.draft_status === 'postdraft' ? 'Complete' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center">
                  <div className="text-gray-500 mb-2">No leagues connected yet</div>
                  <p className="text-sm text-gray-400">Connect your Yahoo account to import your leagues</p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Action Required</h3>
              <ul className="list-disc list-inside text-yellow-800 space-y-1">
                <li>Davante Adams is Questionable - Check lineup</li>
                <li>Waivers process tonight at 3 AM</li>
                <li>Trade deadline in 2 weeks</li>
              </ul>
            </div>

            <div className="bg-purple-600 text-white p-4 sm:p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">Connect Yahoo Fantasy</h3>
              <p className="opacity-90 mb-4">
                Import your real leagues from Yahoo
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("https://fantasy-coach-backend-production.up.railway.app/api/auth/yahoo", {
                      method: "GET",
                      credentials: 'include',
                      headers: {
                        "Content-Type": "application/json"
                      }
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      console.error('No URL received from backend');
                      alert('Error: No URL received from backend');
                    }
                  } catch (err) {
                    console.error('Error connecting to Yahoo:', err);
                    alert('Error connecting to Yahoo. Check console for details.');
                  }
                }}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Connect Yahoo Account
              </button>
            </div>
          </>
        )}

        {activeTab === 'draft' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Draft Recommendations</h2>
            {draftRecs.length > 0 ? (
              draftRecs.map((rec, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 mb-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>
                        {idx + 1}. {rec.player.name} - {rec.player.position} ({rec.player.team})
                      </h3>
                      <p style={{ color: '#666', margin: '10px 0' }}>{rec.explanation}</p>
                      <div style={{ color: '#667eea', fontWeight: 'bold' }}>
                        Score: {rec.score} | Confidence: {rec.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                <p>Loading recommendations...</p>
              </div>
            )}
          </>
        )}

{activeTab === 'lineup' && <LineupOptimizer leagues={leagues} />}

        {activeTab === 'waivers' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Waiver Wire</h2>
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
              <p className="text-center text-gray-600 py-10">
                💎 Connect your league to see waiver recommendations!
              </p>
            </div>
          </>
        )}

        {activeTab === 'coach' && <AskCoach />}

        {activeTab === 'experts' && <ExpertConsensus />}

        {activeTab === 'rules' && <RulesExplainer />}
        </div>
      </div>
    </div>
  );
}

export default App;