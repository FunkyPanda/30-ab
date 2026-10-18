import { useHashRoute } from './router';
import GameScreen from './ui/screens/GameScreen';
import HomeScreen from './ui/screens/HomeScreen';
import NewGameScreen from './ui/screens/NewGameScreen';
import PlayersScreen from './ui/screens/PlayersScreen';
import RoundWizard from './ui/screens/RoundWizard';
import SettingsScreen from './ui/screens/SettingsScreen';
import StatsScreen from './ui/screens/StatsScreen';

/**
 * Routes:
 *   #/                         home
 *   #/players                  manage players
 *   #/new                      new game
 *   #/game/:id                 scoreboard
 *   #/game/:id/round           new round
 *   #/game/:id/round/:index    edit round
 *   #/stats                    statistics
 *   #/settings                 settings
 */
export default function App() {
  const [page, id, sub, index] = useHashRoute();
  switch (page) {
    case 'players':
      return <PlayersScreen />;
    case 'new':
      return <NewGameScreen />;
    case 'stats':
      return <StatsScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'game':
      if (id && sub === 'round') {
        return <RoundWizard key={`${id}-${index ?? 'new'}`} gameId={id} editIndex={index !== undefined ? Number(index) : undefined} />;
      }
      if (id) return <GameScreen gameId={id} />;
      return <HomeScreen />;
    default:
      return <HomeScreen />;
  }
}
