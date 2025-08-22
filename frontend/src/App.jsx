import { useState, useEffect } from 'react';
import RulesExplainer from './components/RulesExplainer';
import ExpertConsensus from './components/ExpertConsensus';
import AskCoach from './components/AskCoach';
import { API_URL } from './config';

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

    const sessionId = localStorage.getItem('yahoo_sessionId');
    const availableLeagues = leagues.filter(league => league.draft_status === 'postdraft');

    const fetchRoster = async (leagueKey) => {
      if (!sessionId || !leagueKey) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/yahoo/roster?sessionId=${sessionId}&leagueKey=${leagueKey}`);
        const data = await response.json();
        
        if (data.fantasy_content && data.fantasy_content.team) {
          const teamData = data.fantasy_content.team[1];
          if (teamData && teamData.roster && teamData.roster[0] && teamData.roster[0].players) {
            const playersObj = teamData.roster[0].players;
            const playersList = [];
            
            // Parse players from the API response
            for (const key in playersObj) {
              if (key !== 'count' && playersObj[key].player) {
                const player = playersObj[key].player[0];
                const playerInfo = playersObj[key].player[1];
                
                playersList.push({
                  player_id: player.player_id,
                  name: playerInfo.name.full,
                  team: playerInfo.editorial_team_abbr,
                  position: playerInfo.display_position,
                  selected_position: playerInfo.selected_position ? playerInfo.selected_position[1].position : 'BN',
                  status: playerInfo.status || null
                });
              }
            }
            
            setRoster(playersList);
          }
        }
      } catch (err) {
        console.error('Error fetching roster:', err);
        alert('Error fetching roster. Please try again.');
      }
      setLoading(false);
    };

    const handleLeagueSelect = (e) => {
      const leagueKey = e.target.value;
      setSelectedLeague(leagueKey);
      if (leagueKey) {
        fetchRoster(leagueKey);
      } else {
        setRoster([]);
      }
    };

    const handleGetRecommendations = () => {
      alert('Start/Sit recommendations feature coming soon!');
    };

    const startingLineup = roster.filter(player => player.selected_position !== 'BN');
    const bench = roster.filter(player => player.selected_position === 'BN');

    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start/Sit Analyzer</h2>
        
        {!sessionId ? (
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
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a league...</option>
                {availableLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name} ({league.teams} teams)
                  </option>
                ))}
              </select>
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
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Get Start/Sit Recommendations
                  </button>
                </div>

                {/* Roster Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Starting Lineup */}
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Starting Lineup ({startingLineup.length})
                    </h3>
                    <div className="space-y-3">
                      {startingLineup.map((player) => (
                        <div key={player.player_id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{player.name}</h4>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">{player.position}</span> - {player.team}
                                {player.selected_position !== player.position && (
                                  <span className="ml-2 text-indigo-600">({player.selected_position})</span>
                                )}
                              </div>
                              {player.status && (
                                <div className="mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    player.status === 'Q' ? 'bg-yellow-100 text-yellow-800' :
                                    player.status === 'O' ? 'bg-red-100 text-red-800' :
                                    player.status === 'IR' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {player.status === 'Q' ? 'Questionable' :
                                     player.status === 'O' ? 'Out' :
                                     player.status === 'IR' ? 'IR' :
                                     player.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {startingLineup.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No players in starting lineup</p>
                      )}
                    </div>
                  </div>

                  {/* Bench */}
                  <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                      Bench ({bench.length})
                    </h3>
                    <div className="space-y-3">
                      {bench.map((player) => (
                        <div key={player.player_id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{player.name}</h4>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">{player.position}</span> - {player.team}
                              </div>
                              {player.status && (
                                <div className="mt-1">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    player.status === 'Q' ? 'bg-yellow-100 text-yellow-800' :
                                    player.status === 'O' ? 'bg-red-100 text-red-800' :
                                    player.status === 'IR' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {player.status === 'Q' ? 'Questionable' :
                                     player.status === 'O' ? 'Out' :
                                     player.status === 'IR' ? 'IR' :
                                     player.status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {bench.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No players on bench</p>
                      )}
                    </div>
                  </div>
                </div>
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
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
      setError(`Cannot connect to backend. Make sure it's running on ${API_URL}`);
    }
    
    setLoading(false);
  };

  const loadDraftRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/recommendations/draft`);
      const data = await response.json();
      setDraftRecs(data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  const fetchLeagues = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/api/yahoo/leagues?sessionId=${sessionId}`);
      const data = await response.json();
      
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
                    yahooLeagues.push({
                      id: league.league_key,
                      name: league.name,
                      teams: parseInt(league.num_teams),
                      platform: 'yahoo',
                      draft_status: league.draft_status
                    });
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
    // Verificar si viene de Yahoo OAuth
    const hash = window.location.hash;
    
    // Check for sessionId in hash
    const sessionMatch = hash.match(/[?&]sessionId=([^&#]*)/i) || hash.match(/#sessionId=([^&#]*)/i);
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      // Store in localStorage
      localStorage.setItem('yahoo_sessionId', sessionId);
      // Fetch leagues
      fetchLeagues(sessionId);
      // Clean the hash
      window.location.hash = '';
      setShowLogin(false);
      return;
    }
    
    if (hash.includes('yahoo-success')) {
      const urlParams = new URLSearchParams(hash.split('?')[1]);
      const sessionId = urlParams.get('sessionId');
      if (sessionId) {
        console.log('Yahoo session detected:', sessionId);
        localStorage.setItem('yahoo_sessionId', sessionId);
        setShowLogin(false);
        fetchLeagues(sessionId);
      }
      window.location.hash = '';
    } else if (hash === '#yahoo-error') {
      alert('Yahoo connection failed. Please try again.');
      window.location.hash = '';
    }
    
    // Check if there's a stored sessionId on component mount
    const storedSession = localStorage.getItem('yahoo_sessionId');
    if (storedSession) {
      fetchLeagues(storedSession);
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
                                ? 'bg-green-100 text-green-800' 
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
                    const response = await fetch(`${API_URL}/api/auth/yahoo`, {
                      credentials: 'include'
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