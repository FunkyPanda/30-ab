import { DEFAULT_SIT_OUT_MIN_SCORE } from '../../domain/rules';
import { de } from '../../i18n/de';
import { useStore } from '../../store';
import { Button, Screen, SectionTitle, Stepper } from '../components/ui';

export default function SettingsScreen() {
  const { data, update } = useStore();
  const minScore = data.settings.sitOutMinScore;
  const setMinScore = (sitOutMinScore: number) => update((d) => ({ ...d, settings: { ...d.settings, sitOutMinScore } }));

  return (
    <Screen title={de.settings.title} back="/">
      <SectionTitle>{de.settings.sitOutMinScore}</SectionTitle>
      <div className="rounded-2xl border border-line bg-surface p-4">
        <Stepper value={minScore} onChange={setMinScore} min={0} max={99} size="md" />
        <p className="mt-3 text-center text-sm text-muted">{de.settings.sitOutMinScoreHint(minScore)}</p>
        {minScore !== DEFAULT_SIT_OUT_MIN_SCORE && (
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setMinScore(DEFAULT_SIT_OUT_MIN_SCORE)}>
            {de.settings.reset(DEFAULT_SIT_OUT_MIN_SCORE)}
          </Button>
        )}
      </div>
    </Screen>
  );
}
