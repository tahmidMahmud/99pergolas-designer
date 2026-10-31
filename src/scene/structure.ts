/** Single entry point for structural facts, so the scene always matches pricing/validation. */
import type { PergolaDesign, Structure } from '../types';
import { computeStructure } from '../config';

export function getStructure(d: PergolaDesign): Structure {
  return computeStructure(d);
}
