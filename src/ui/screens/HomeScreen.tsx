import { useRef } from 'react';
import { currentScores, ranking } from '../../domain/scoring';
import { de, formatScore } from '../../i18n/de';
import { navigate } from '../../router';
import { exportData, mergeData, parseData } from '../../storage/repository';
import { useStore } from '../../store';
import { Button, Card, Screen, SectionTitle, useToast } from '../components/ui';

export default function HomeScreen() {
  const { data, update, playerLabel } = useStore();
  const [toast, showToast] = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const games = [...data.games].sort((a, b) => b.createdAt - a.createdAt);
  const running = games.find((g) => g.status === 'running');

  async function onImport(file: File) {
    try {
      const imported = parseData(await file.text());
      update((d) => mergeData(d, imported));
      showToast(de.home.importOk);
    } catch {
      showToast(de.home.importFail);
    }
  }

  return (
    <Screen
      title={
        <span className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt=""
            className="size-12 rounded-xl shadow-sm"
            width={48}
            height={48}
          />
          30-Ab
        </span>
      }
    >
      <p className="mb-6 px-0.5 text-muted">{de.home.subtitle}</p>

      <div className="grid gap-3">
        {running && (
          <Button variant="primary" className="h-14 text-lg" onClick={() => navigate(`/game/${running.id}`)}>
            {de.home.continueGame}
          </Button>
        )}
        <Button variant={running ? 'secondary' : 'primary'} className="h-14 text-lg" onClick={() => navigate('/new')}>
          {de.home.newGame}
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => navigate('/players')}>👥 {de.home.players}</Button>
          <Button onClick={() => navigate('/stats')}>📊 {de.home.stats}</Button>
        </div>
      </div>

      <SectionTitle>{de.home.savedGames}</SectionTitle>
      {games.length === 0 ? (
        <p className="py-6 text-center text-muted">{de.home.noGames}</p>
      ) : (
        <div className="grid gap-2">
          {games.map((g) => {
            const scores = currentScores(g);
            return (
              <Card key={g.id} onClick={() => navigate(`/game/${g.id}`)}>
                <div className="mb-1 flex items-center justify-between text-sm text-muted">
                  <span>
                    {new Date(g.createdAt).toLocaleDateString('de-DE')} · {de.home.rounds(g.rounds.length)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      g.status === 'running' ? 'bg-good/15 text-good' : 'bg-surface-2'
                    }`}
                  >
                    {g.status === 'running' ? de.home.running : de.home.finished}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {ranking(scores).map((id, i) => (
                    <span key={id} className={i === 0 && g.status === 'finished' ? 'font-semibold' : ''}>
                      {i === 0 && g.status === 'finished' && '🏆 '}
                      {playerLabel(id)} <span className="text-muted tabular-nums">{formatScore(scores[id])}</span>
                    </span>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle>{de.home.backup}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={() => exportData(data)}>
          ⬇ {de.home.export}
        </Button>
        <Button variant="ghost" onClick={() => fileInput.current?.click()}>
          ⬆ {de.home.import}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = '';
          }}
        />
      </div>
      {toast}
    </Screen>
  );
}
