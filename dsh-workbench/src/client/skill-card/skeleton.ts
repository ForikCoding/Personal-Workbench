/**
 * The starter document the editor writes into an empty template.
 *
 * An empty box teaches nothing: the product depends on two comments — the region a
 * child fills, and the block that declares what a button may address — and neither can
 * be guessed from a blank textarea. The skeleton is therefore a small but complete
 * document that demonstrates both, and it must pass the analyser with no violations:
 * a starter that opens on a validation error is worse than an empty box.
 * @module dsh-workbench/client/skill-card/skeleton
 */

import {
  WORKBENCH_ACTIONS_MARKER,
  WORKBENCH_REGION_BEGIN,
  WORKBENCH_REGION_END,
} from '../../skill-card-contract.ts'
import type { WorkbenchLocaleKey } from '../locales.ts'

/** The declaration block, empty until the user adds the first target. */
const ACTIONS_BLOCK = `<!-- ${WORKBENCH_ACTIONS_MARKER} -->`

/** The region a child fills, each marker on a line of its own. */
const REGION_BEGIN = `<!-- ${WORKBENCH_REGION_BEGIN} -->`
const REGION_END = `<!-- ${WORKBENCH_REGION_END} -->`

/**
 * Build the skeleton.
 *
 * The prose is translated because it is an instruction the user reads and a child
 * agent follows; the markup around it is not, because it is the example.
 * @param t - translator.
 * @returns the document, ready to be stored and analysed.
 */
export function templateSkeleton(t: (key: WorkbenchLocaleKey) => string): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <style>',
    '      body { margin: 0; font-family: system-ui, sans-serif; font-size: 13px; }',
    '      h1 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }',
    '      ul { margin: 0; padding-left: 18px; }',
    '      li { padding: 4px 0; }',
    '      button { padding: 2px 8px; border: 1px solid #c8c8c8; border-radius: 6px; background: transparent; cursor: pointer; }',
    '    </style>',
    '  </head>',
    '  <body>',
    `    ${ACTIONS_BLOCK}`,
    `    <h1>${t('skillCardSkeletonHeading')}</h1>`,
    '    <ul>',
    `      ${REGION_BEGIN}`,
    '      <!--',
    `        ${t('skillCardSkeletonWhat')}`,
    `        ${t('skillCardSkeletonExample')}`,
    `        ${t('skillCardSkeletonQuote')}`,
    '      -->',
    `      ${REGION_END}`,
    '    </ul>',
    '  </body>',
    '</html>',
  ].join('\n')
}
