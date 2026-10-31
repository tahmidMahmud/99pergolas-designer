import type { PergolaDesign } from '../../types';
import { CONFIG_DEFAULT_PERGOLA, cloneDefault } from '../defaults';

export function pergola(p: Partial<PergolaDesign> = {}): PergolaDesign {
  return { ...cloneDefault(CONFIG_DEFAULT_PERGOLA), ...p };
}
