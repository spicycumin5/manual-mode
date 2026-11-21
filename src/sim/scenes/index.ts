import type { Scene } from '../types';
import { parkRunner } from './parkRunner';
import { nightStreet } from './nightStreet';
import { portrait } from './portrait';
import { waterfall } from './waterfall';
import { nightSky } from './nightSky';
import { gym } from './gym';
import { snow } from './snow';

export const SCENE_LIST: Scene[] = [parkRunner, portrait, nightStreet, waterfall, nightSky, gym, snow];

export const SCENES: Record<string, Scene> = Object.fromEntries(SCENE_LIST.map((s) => [s.id, s]));

export function getScene(id: string): Scene {
  return SCENES[id] ?? SCENE_LIST[0];
}
