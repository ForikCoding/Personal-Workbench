/**
 * SCRATCH VERIFICATION PROBE - not shipping code, not a test. Delete after use.
 *
 * Measures the seams a card run needs when the harness has NO
 * `subagents.startActivation` (0.2.0-rc.2, the stable channel), through the
 * fallback `subagents.start('spawn', spec)` the first probe already exercised:
 *
 *   [A] seam surface: startActivation / start / startContinuable
 *   [B] card parent: agents.create({ meta: { cwd } }) rooted at the card dir
 *   [C] run child: caller-awaitable structured result via the fallback, and the
 *       child's own sandbox root + mode (inheritance from the card parent)
 *   [D] live bus: tool/call entries addressed to that child while it runs
 *   [E] per-session sandbox mode: does the policy expose setMode, and does a
 *       mode set on the card parent reach the child?
 *
 * Run:
 *   node dsh-plugin-desktop/scratch/rc2-card-run-probe.mjs --harness rc2|next --mode workspace-write
 */

process.env.DSH_TELEMETRY_DISABLED = '1'

import { readFile } from 'node:fs/promises'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const argv = process.argv.slice(2)
const argOf = (name, fallback) => {
  const index = argv.indexOf(name)
  return index === -1 ? fallback : argv[index + 1]
}
const harness = argOf('--harness', 'rc2')
const sandboxMode = argOf('--mode', 'workspace-write')

const repoRoot = resolve(import.meta.dirname, '..', '..')
const HARNESS_DIRS = {
  rc2: join(repoRoot, 'dsh-plugin-desktop'),
  next: join(repoRoot, 'dsh-desktop-next'),
}
const hostDir = HARNESS_DIRS[harness]
if (hostDir === undefined) throw new Error(`unknown --harness ${harness}`)
const installed = join(hostDir, 'node_modules', '@deepseek-ai')
const projectDir = resolve(hostDir, '..')

const log = (...parts) => process.stdout.write(`${parts.join(' ')}\n`)
const report = (label, value) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  log(`  ${label}: ${text}`)
}

const home = mkdtempSync(join(tmpdir(), 'dsh-run-probe-home-'))
process.env.DSH_HOME = home
process.env.DSH_PERMISSION_MODE = sandboxMode

// The card's own chosen directory: a fresh temp directory outside the project.
const cardDir = mkdtempSync(join(tmpdir(), 'dsh-run-probe-card-'))

const { boot, loadOverlayPatches } = await import('@deepseek-ai/dsh-app-boot')
const { LlmAdapter, ToolCallId, createUserMessage } = await import('@deepseek-ai/dsh-llm')

/** Mock model adapter: the upstream test helper's contract, model only. */
class MockAdapter extends LlmAdapter {
  requests = []
  /** Tool names every request offered, first request first. */
  toolNames = []
  /**
   * Tool this adapter calls once per agent, when the agent offers it.
   * `null` keeps the prose/capture behaviour.
   */
  tool = null

  resolveModel(provider, model) {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options) {
    const toolNames = (options.tools ?? []).map(tool => tool.name)
    if (this.toolNames.length === 0) this.toolNames = toolNames
    const alreadyCaptured = (options.messages ?? []).some(message => message.role === 'tool')
    const wantsCapture = toolNames.includes('structured_output') && !alreadyCaptured
    const wantsTool = this.tool !== null && toolNames.includes(this.tool.name) && !alreadyCaptured
    this.requests.push({
      wantsCapture,
      wantsTool,
      structuredTool: toolNames.includes('structured_output'),
      toolCount: toolNames.length,
      messages: (options.messages ?? []).length,
    })
    const chunks = wantsTool
      ? toolCallResponse(`tool-${this.requests.length}`, this.tool.name, this.tool.args)
      : wantsCapture
        ? toolCallResponse(`capture-${this.requests.length}`, 'structured_output', { html: '<b>from-card</b>' })
        : textResponse('plain prose answer, no capture')
    for (const chunk of chunks) {
      if (options.signal?.aborted) throw new Error('aborted')
      yield chunk
    }
  }
}

const textResponse = text => [
  { type: 'block-start', index: 0, blockType: 'text' },
  { type: 'text-delta', index: 0, text },
  { type: 'block-end', index: 0, block: { type: 'text', text } },
  { type: 'usage', usage: { inputTokens: 10, outputTokens: text.length } },
  { type: 'finish', reason: { kind: 'stop' } },
]

const toolCallResponse = (rawCallId, name, args) => {
  const callId = ToolCallId(rawCallId)
  const argumentsJson = JSON.stringify(args)
  return [
    { type: 'block-start', index: 0, blockType: 'tool-call' },
    { type: 'tool-call-delta', index: 0, id: callId, name, argumentsDelta: argumentsJson.slice(0, 6) },
    { type: 'tool-call-delta', index: 0, id: callId, argumentsDelta: argumentsJson.slice(6) },
    { type: 'block-end', index: 0, block: { type: 'tool-call', id: callId, name, arguments: argumentsJson } },
    { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ]
}

const rootConfigPath = join(home, 'cordis.yml')
writeFileSync(rootConfigPath, '[]\n')
const bareModuleBaseUrl = pathToFileURL(join(hostDir, 'package.json')).href
const basePatches = loadOverlayPatches('rc2-card-run-probe', join(installed, 'dsh-base', 'cordis.patch.yml'))
const patches = [
  ...basePatches,
  { id: 'sandbox-policy', config: { mode: sandboxMode, workspaceRoot: projectDir } },
  { id: 'approval', config: { policy: sandboxMode === 'danger-full-access' ? 'never' : 'ask' } },
  // `dsh-workspace` belongs to the Web layer of the shipped product; mount it here
  // because `workspaceRegistry.archiveSession` is part of the card-run settle path.
  { insert: [{ id: 'workspace', name: '@deepseek-ai/dsh-workspace' }] },
]

const schema = {
  type: 'object',
  properties: { html: { type: 'string' } },
  required: ['html'],
  additionalProperties: false,
}

const summary = { harness, mode: sandboxMode, cardDir, checks: {} }
const check = (key, value) => {
  summary.checks[key] = value
  return value
}

let ctx
try {
  ctx = await boot('rc2-card-run-probe', rootConfigPath, patches, undefined, bareModuleBaseUrl)
  const versions = {}
  for (const name of ['dsh-subagent', 'dsh-sandbox-policy', 'dsh-agent-loop', 'dsh-app-boot']) {
    versions[name] = JSON.parse(await readFile(join(installed, name, 'package.json'), 'utf8')).version
  }
  log(`booted: harness=${harness} versions=${JSON.stringify(versions)} mode=${sandboxMode}`)

  // ---- [A] seam surface ------------------------------------------------------
  log('')
  log('[A] SEAM SURFACE')
  const seam = {
    startActivation: typeof ctx.subagents?.startActivation,
    start: typeof ctx.subagents?.start,
    startContinuable: typeof ctx.subagents?.startContinuable,
  }
  report('seam', seam)
  check('seam', seam)
  report('subagents methods', Object.getOwnPropertyNames(Object.getPrototypeOf(ctx.subagents)))
  report('sandboxPolicy methods', Object.getOwnPropertyNames(Object.getPrototypeOf(ctx.sandboxPolicy)))

  const adapter = new MockAdapter()
  ctx.llm.registerAdapter(['mock'], adapter)

  // ---- [B] card parent -------------------------------------------------------
  log('')
  log('[B] CARD PARENT')
  const card = await ctx.agents.create({
    sessionId: 'run-probe-card-parent',
    meta: { cwd: cardDir },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  report('card parent header.cwd', card.agent.session.header.cwd)
  check('cardParentRootIsCardDir', String(card.agent.session.header.cwd) === String(cardDir))

  const rootOf = session => {
    try {
      return ctx.sandboxPolicy.resolve({ session }).workspaceRoot
    } catch (error) {
      return `resolve failed: ${error?.message ?? String(error)}`
    }
  }
  const modeOf = session => {
    try {
      return ctx.sandboxPolicy.resolve({ session }).mode
    } catch (error) {
      return `resolve failed: ${error?.message ?? String(error)}`
    }
  }

  /** One card run through the seam this harness offers, with no request.cwd. */
  const activationOf = (label, parent, promptText) => {
    if (typeof ctx.subagents.startActivation === 'function') {
      return ctx.subagents.startActivation({
        provider: 'spawn',
        label,
        delivery: 'caller',
        signal: new AbortController().signal,
        request: { parent: parent.agent, prompt: [{ type: 'text', text: promptText }], outputSchema: schema },
      })
    }
    return ctx.subagents.start('spawn', {
      parent: parent.agent,
      prompt: [{ type: 'text', text: promptText }],
      outputSchema: schema,
      label,
      signal: new AbortController().signal,
    })
  }

  // ---- [C] run child ---------------------------------------------------------
  log('')
  log('[C] RUN CHILD (caller-awaitable structured result)')
  const run = await activationOf('run-probe-capture', card, 'Report {"html":"<b>from-card</b>"}.')
  const childId = run.childId ?? run.id
  const childAgent = ctx.agents.get(childId)
  report('child id', childId)
  report('child resident at start', childAgent !== undefined)
  const childSession = childAgent?.session ?? run.localAgent?.session
  if (childSession !== undefined) {
    report('child header.cwd', childSession.header?.cwd ?? childSession.header.cwd)
    report('child sandbox root', rootOf(childSession))
    report('child mode (default)', modeOf(childSession))
    check('childRootIsCardDir', String(rootOf(childSession)) === String(cardDir))
  } else {
    report('child session', 'not resident and no localAgent')
  }
  const result = await run.result
  report('result.stopReason', check('captureStopReason', result?.stopReason))
  report('result.structured', result?.structured ?? null)
  check('structuredCaptured', result?.structured !== null && result?.structured !== undefined)
  if (typeof run.dispose === 'function') await run.dispose().catch(() => {})

  // ---- [D] live bus ----------------------------------------------------------
  log('')
  log('[D] LIVE BUS while the child uses a tool')
  const busLog = []
  const offSession = ctx.on('session/event', (session, event) => {
    busLog.push({
      bus: 'session/event',
      sessionId: session?.id,
      type: event?.type,
      name: event?.data?.name,
      callId: event?.data?.callId,
    })
  })
  const offStatus = ctx.on('agent/status', ({ agent, status }) => {
    busLog.push({ bus: 'agent/status', agentId: agent?.id, status })
  })
  const offError = ctx.on('agent/error', ({ agent, error }) => {
    busLog.push({ bus: 'agent/error', agentId: agent?.id, error: String(error?.message ?? error) })
  })
  adapter.requests.splice(0)
  adapter.tool = { name: 'pwsh', args: { description: 'Probe one shell call', command: 'echo run-probe-activity' } }
  const activity = await activationOf('run-probe-activity', card, 'Write the file run-probe-note.txt in the working directory, then say done.')
  const activityChildId = activity.childId ?? activity.id
  const activityResult = await activity.result
  adapter.tool = null
  offSession()
  offStatus()
  offError()
  if (typeof activity.dispose === 'function') await activity.dispose().catch(() => {})
  const childOnly = busLog.filter(entry => entry.agentId === activityChildId || entry.sessionId === activityChildId)
  report('tools offered', adapter.toolNames)
  report('activity result.stopReason', activityResult?.stopReason)
  report('bus entries total / for activity child', `${String(busLog.length)} / ${String(childOnly.length)}`)
  report('activity child bus keys', childOnly.reduce((counts, entry) => {
    const key = `${entry.bus}:${String(entry.type ?? entry.status)}`
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {}))
  report('activity child tool/call entries', childOnly.filter(entry => entry.type === 'tool/call'))
  check('activityToolCallOnBus', childOnly.some(entry => entry.type === 'tool/call'))
  report('agent/error entries anywhere', busLog.filter(entry => entry.bus === 'agent/error'))

  // ---- [E] mode propagation --------------------------------------------------
  log('')
  log('[E] MODE PROPAGATION parent -> child')
  if (typeof ctx.sandboxPolicy.setMode === 'function') {
    try {
      await ctx.sandboxPolicy.setMode('run-probe-card-parent', 'read-only')
      report('card parent mode after setMode(read-only)', modeOf(card.agent.session))
      const fenced = await activationOf('run-probe-fenced', card, 'Report {"html":"<b>fenced</b>"}.')
      const fencedChildId = fenced.childId ?? fenced.id
      const fencedChild = ctx.agents.get(fencedChildId)
      const fencedSession = fencedChild?.session ?? fenced.localAgent?.session
      if (fencedSession !== undefined) {
        report('fenced child mode', check('fencedChildMode', modeOf(fencedSession)))
        report('fenced child root', rootOf(fencedSession))
        check('childModeFollowsParent', modeOf(fencedSession) === 'read-only')
      } else {
        report('fenced child session', 'not resident')
      }
      const fencedResult = await fenced.result
      report('fenced result.structured', fencedResult?.structured ?? null)
      if (typeof fenced.dispose === 'function') await fenced.dispose().catch(() => {})
      await ctx.sandboxPolicy.setMode('run-probe-card-parent', sandboxMode).catch(() => {})
    } catch (error) {
      report('mode propagation failed', `${error?.code ?? '?'} | ${error?.message ?? String(error)}`)
    }
  } else {
    report('mode propagation', 'setMode absent: per-card permission must refuse non-default modes on this harness')
    check('setModePresent', false)
  }

  await card.dispose()
} catch (error) {
  log(`PROBE FAILED: ${error?.stack ?? String(error)}`)
  summary.failed = String(error?.message ?? error)
  process.exitCode = 1
} finally {
  try {
    await ctx?.fiber?.dispose?.()
  } catch (error) {
    log(`dispose warning: ${String(error)}`)
  }
  rmSync(home, { recursive: true, force: true })
  rmSync(cardDir, { recursive: true, force: true })
  log('')
  log(`SUMMARY ${JSON.stringify(summary)}`)
}
