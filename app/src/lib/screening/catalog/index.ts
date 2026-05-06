/**
 * Catalog of screening instruments available in the pre-session invite flow.
 *
 * Order roughly matches frequency of clinical use (PHQ-9 first, ORS/SRS at
 * the end since those are session-by-session not pre-intake). The picker
 * UI groups by `category`.
 */

import { PHQ9 }    from './phq9';
import { GAD7 }    from './gad7';
import { PCL5 }    from './pcl5';
import { CSSRS }   from './cssrs';
import { ACE }     from './ace';
import { AUDITC }  from './auditc';
import { DUDIT }   from './dudit';
import { ISI }     from './isi';
import { SCOFF }   from './scoff';
import { DASS21 }  from './dass21';
import { CORE10 }  from './core10';
import { ORS }     from './ors';
import { SRS }     from './srs';

import type { ScreeningInstrument, ScreeningCategory } from '../types';

export const ALL_INSTRUMENTS: ScreeningInstrument[] = [
  PHQ9,
  GAD7,
  PCL5,
  CSSRS,
  ACE,
  AUDITC,
  DUDIT,
  ISI,
  SCOFF,
  DASS21,
  CORE10,
  ORS,
  SRS,
];

const INSTRUMENT_INDEX = new Map<string, ScreeningInstrument>(
  ALL_INSTRUMENTS.map((i) => [i.id, i]),
);

export function getInstrument(id: string): ScreeningInstrument | undefined {
  return INSTRUMENT_INDEX.get(id);
}

export function getInstrumentOrThrow(id: string): ScreeningInstrument {
  const i = INSTRUMENT_INDEX.get(id);
  if (!i) throw new Error(`Unknown screening instrument: ${id}`);
  return i;
}

export function instrumentsByCategory(): Record<ScreeningCategory, ScreeningInstrument[]> {
  const out = {} as Record<ScreeningCategory, ScreeningInstrument[]>;
  for (const inst of ALL_INSTRUMENTS) {
    if (!out[inst.category]) out[inst.category] = [];
    out[inst.category].push(inst);
  }
  return out;
}

export {
  PHQ9, GAD7, PCL5, CSSRS, ACE, AUDITC, DUDIT, ISI, SCOFF, DASS21, CORE10, ORS, SRS,
};
