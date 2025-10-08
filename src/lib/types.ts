// src/lib/types.ts
import type { Timestamp } from "firebase/firestore";

export type MapDoc = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  mapImage: string;
  order?: number;
  createdAt?: number;
  logoImage: string;
};

export type Pos = { x: number; y: number };

export type Technique = 'left_click'|'right_click'|'left_right_click'|'jump_left'|'jump_right'|'jump_left_right'|'';
export type Movement = 'stationary'|'running'|'walking'|'crouched'|'crouched_walking'|'';
export type Precision = 'precise'|'loose'|'very_precise'|'';

export type NadeDoc = {
  id: string;
  mapSlug: string;                
  title?: string;
  type?: string;
  side?: string;
  position?: string;
  target?: string;
  toPos?: Pos | null;
  fromPos?: Pos | null;
  videoUrl?: string | null;
  tickrate?: string | null;
  jumpThrow?: boolean;
  runSteps?: number | null;
  lineupNotes?: string | null;
  description?: string | null;
  technique?: Technique | null;
  movement?: Movement | null;
  precision?: Precision | null;
  createdByUid?: string;
  createdByName?: string;
  createdAt?: Timestamp | null;
};