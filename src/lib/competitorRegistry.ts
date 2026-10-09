import type { Channel, Competitor, Owner } from './types';

/** Keep already-linked channels separate from addable (unlinked) saved channels. */
export function competitorRegistry(
  owners: Owner[],
  competitors: Competitor[],
  channels: Channel[],
  preferredOwnerId = '',
) {
  const primary = owners.find(o => o.isPrimary) ?? owners[0];
  const owner = owners.find(o => o.channelId === preferredOwnerId) ?? primary;
  const linked = competitors.filter(c => c.ownerId === owner?.channelId);
  const linkedIds = new Set(linked.map(c => c.channelId));
  const available = channels.filter(c => c.id !== owner?.channelId && !linkedIds.has(c.id));
  return { owner, linked, linkedIds, available };
}
