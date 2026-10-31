/**
 * Lead module public API. `buildSpecPdf` lives in ./pdf.ts and loads jsPDF lazily; import it
 * directly (or via dynamic import) where the "Download PDF" button lives.
 */
export { submitLead, mailtoFallback, type SubmitResult, type SubmitOptions } from './submit.ts';
export { captureSource, initSource, setSourceValue } from './source.ts';
export { initEmbedBridge, isEmbedded, postToParent } from './embed.ts';
export { formatInches, money, moneyRange, specRows, designTitle } from './format.ts';
