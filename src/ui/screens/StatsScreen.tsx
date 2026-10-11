import { computeStats, type PlayerStats } from '../../domain/stats';
import { de, formatScore } from '../../i18n/de';
import { useStore } from '../../store';
import { Card, Screen } from '../components/ui';

const percent = (v: number) => `${Math.round(v * 100)} %`;

export default function StatsScreen() {
  const { data } = useStore();

  // Include archived players too, as long as they have finished games.
  const stats = data.players
    .map((p) => ({ player: p, stats: computeStats(p.id, data.games) }))
    .filter(({ player, stats }) => stats.gamesPlayed > 0 || !player.archived)
    .sort((a, b) => b.stats.gamesWon - a.stats.gamesWon || b.stats.winRate - a.stats.winRate);

  const anyFinished = data.games.some((g) => g.status === 'finished');

  return (
    <Screen title={de.stats.title} back="/">
      {!anyFinished ? (
        <p className="py-8 text-center text-muted">{de.stats.empty}</p>
      ) : (
        <div className="grid gap-3">
          {stats.map(({ player, stats }, i) => (
            <Card key={player.id}>
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-lg font-semibold">
                  {i === 0 && stats.gamesWon > 0 && '🏆 '}
                  {player.name}
                </p>
                <p className="text-sm text-muted">
                  {stats.gamesWon} / {stats.gamesPlayed} {de.stats.wins}
                </p>
              </div>
              <StatGrid stats={stats} />
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}

function StatGrid({ stats }: { stats: PlayerStats }) {
  const items: [string, string][] = [
    [de.stats.winRate, stats.gamesPlayed ? percent(stats.winRate) : '–'],
    [de.stats.avgScore, stats.avgFinalScore !== null ? formatScore(Math.round(stats.avgFinalScore * 10) / 10) : '–'],
    [de.stats.declarer, stats.declarerRounds ? `${stats.declarerSuccess} / ${stats.declarerRounds}` : '–'],
    [de.stats.tricks, String(stats.totalTricks)],
    [de.stats.zeroTricks, String(stats.zeroTrickRounds)],
    [de.stats.satOut, String(stats.roundsSatOut)],
  ];
  return (
    <dl className="grid grid-cols-3 gap-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-surface-2 p-2.5">
          <dt className="text-[11px] leading-tight text-muted">{label}</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
