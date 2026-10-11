import { hueOf } from '../../domain/avatar';
import { useStore } from '../../store';

const sizes = {
  sm: 'size-8 text-lg',
  md: 'size-11 text-2xl',
  lg: 'size-14 text-3xl',
  xl: 'size-24 text-6xl',
};

export type AvatarSize = keyof typeof sizes;

/** Round emoji badge with a tint derived from the emoji, so each player is recognisable at a glance. */
export function Avatar({ emoji, size = 'md', className = '' }: { emoji: string; size?: AvatarSize; className?: string }) {
  const hue = hueOf(emoji);
  return (
    <span
      aria-hidden
      style={{
        background: `hsl(${hue} 80% 55% / 0.22)`,
        boxShadow: `inset 0 0 0 2px hsl(${hue} 70% 50% / 0.45)`,
      }}
      className={`grid shrink-0 place-items-center rounded-full leading-none select-none ${sizes[size]} ${className}`}
    >
      {emoji}
    </span>
  );
}

/** Avatar looked up by player id. */
export function PlayerAvatar({ id, size, className }: { id: string; size?: AvatarSize; className?: string }) {
  const { playerEmoji } = useStore();
  return <Avatar emoji={playerEmoji(id)} size={size} className={className} />;
}
