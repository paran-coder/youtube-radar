import { describe, it, expect } from 'vitest';
import { competitorRegistry } from '../src/lib/competitorRegistry';
import type { Channel, Competitor, Owner } from '../src/lib/types';
const channel = (id:string)=>({id,title:id} as Channel);
const owners: Owner[]=[
  {channelId:'mine-a',addedAt:'2026-01-01',isPrimary:true},
  {channelId:'mine-b',addedAt:'2026-01-02',isPrimary:false},
];
const competitors: Competitor[]=[
  {id:'mine-a:linked',ownerId:'mine-a',channelId:'linked',addedAt:'2026-01-03',role:'direct'},
  {id:'mine-b:elsewhere',ownerId:'mine-b',channelId:'elsewhere',addedAt:'2026-01-04',role:'benchmark'},
  {id:'mine-a:expired',ownerId:'mine-a',channelId:'expired',addedAt:'2026-01-05',role:'inspiration'},
];
const channels=[channel('mine-a'),channel('mine-b'),channel('linked'),channel('elsewhere')];
describe('competition discovery registry',()=>{
  it('shows existing competitors even when not addable',()=>{
    const r=competitorRegistry(owners,competitors,channels);
    expect(r.linked.map(c=>c.channelId)).toEqual(['linked','expired']);
    expect(r.available.map(c=>c.id)).toEqual(['mine-b','elsewhere']);
  });
  it('does not silently hide an expired linked channel',()=>{
    const r=competitorRegistry(owners,competitors,channels);
    expect(r.linkedIds.has('expired')).toBe(true);
  });
  it('switches competitor groups with owner selection',()=>{
    const r=competitorRegistry(owners,competitors,channels,'mine-b');
    expect(r.owner?.channelId).toBe('mine-b');
    expect(r.linked.map(c=>c.channelId)).toEqual(['elsewhere']);
    expect(r.available.map(c=>c.id)).toContain('linked');
  });
  it('shows no owner and leaves all saved channels addable when no owner is configured',()=>{
    const r=competitorRegistry([],competitors,channels);
    expect(r.owner).toBeUndefined();
    expect(r.linked).toHaveLength(0);
  });
});
