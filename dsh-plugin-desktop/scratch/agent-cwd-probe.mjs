/**
 * SCRATCH VERIFICATION PROBE - not shipping code, not a test. Delete after use.
 *
 * Boots a real shipped DSH host composition (the `dsh-base` bundle plus the
 * workspace registry) through `@deepseek-ai/dsh-app-boot`'s `boot()` - the same
 * entry point `scripts/verify-profile-boot.mjs` uses - and measures:
 *
 *   [1] `ctx.agents.create({ meta: { cwd } })` -> `agent.session.header.cwd`
 *  [1b] `ctx.subagents.startActivation({ request: { cwd } })` (0.2.1 only)
 *   [2] the sandbox policy that derivation yields, plus writes inside and outside it
 *   [3] where the new session is listed (sessions store, sessionQuery, workspaces)
 *   [4] whether an `agents.create`-based path can capture structured output
 *   [6] the live activity bus: which event types describe a child using a tool, and
 *       how a host plugin addresses just that child
 *
 * The model is mocked (MockAdapter, the contract upstream's own test helper
 * uses); everything else - loader, session store, projections, agent loop,
 * subagent seam, sandbox policy, filesystem - is a real shipped package.
 *
 * Run:
 *   node dsh-plugin-desktop/scratch/agent-cwd-probe.mjs --harness rc2|next --mode <mode>
 * `--harness` selects the installed package set: `rc2` = dsh-plugin-desktop's
 * node_modules (0.2.0-rc.2), `next` = dsh-desktop-next's (0.2.1-alpha.2).
 */

process.env.DSH_TELEMETRY_DISABLED = '1'

import { readFile } from 'node:fs/promises'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const repoRoot = resolve(import.meta.dirname, '..', '..')

const argv = process.argv.slice(2)
const argOf = (name, fallback) => {
  const index = argv.indexOf(name)
  return index === -1 ? fallback : argv[index + 1]
}
const harness = argOf('--harness', 'rc2')
const sandboxMode = argOf('--mode', 'workspace-write')

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

const home = mkdtempSync(join(tmpdir(), 'dsh-probe-home-'))
process.env.DSH_HOME = home
process.env.DSH_PERMISSION_MODE = sandboxMode

// The card's own chosen directory: a fresh temp directory outside the project.
const cardDir = mkdtempSync(join(tmpdir(), 'dsh-probe-card-dir-'))
// A second fresh temp directory, used as the activation's own `cwd`.
const activationCwd = mkdtempSync(join(tmpdir(), 'dsh-probe-activation-dir-'))
// Neither temp nor the parent's project directory: only a workspace root admits it.
const foreignDir = mkdtempSync(join(tmpdir(), 'dsh-probe-foreign-'))
const projectWritePath = join(projectDir, '.dsh-probe-outside.txt')

const { boot, loadOverlayPatches } = await import('@deepseek-ai/dsh-app-boot')
const { LlmAdapter, ToolCallId, createUserMessage } = await import('@deepseek-ai/dsh-llm')

/** Mock model adapter: the upstream test helper's contract, model only. */
class MockAdapter extends LlmAdapter {
  requests = []
  /** Tool names every request offered, first request first. */
  toolNames = []
  /**
   * Tool this adapter calls once per agent, when the agent offers it.
   *
   * Set by case [6] to measure what a real tool call looks like on the bus. `null`
   * keeps the earlier prose/capture behaviour. The call is issued on the first request
   * that offers the tool and no tool result yet, so the child performs exactly one call.
   */
  tool = null

  resolveModel(provider, model) {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream(options) {
    const toolNames = (options.tools ?? []).map(tool => tool.name)
    if (this.toolNames.length === 0) this.toolNames = toolNames
    // The child that was handed an output contract answers through the capture
    // tool once; afterwards (and for every agent without that tool) it answers
    // in prose.
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
        ? toolCallResponse(`capture-${this.requests.length}`, 'structured_output', { html: '<b>hi</b>' })
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
const basePatches = loadOverlayPatches('agent-cwd-probe', join(installed, 'dsh-base', 'cordis.patch.yml'))
const patches = [
  ...basePatches,
  { id: 'sandbox-policy', config: { mode: sandboxMode, workspaceRoot: projectDir } },
  { id: 'approval', config: { policy: sandboxMode === 'danger-full-access' ? 'never' : 'ask' } },
  // `dsh-workspace` belongs to the Web layer of the shipped product; mount it here
  // because `workspaces.list()` is one of the three places the sidebar reads.
  { insert: [{ id: 'workspace', name: '@deepseek-ai/dsh-workspace' }] },
]

const summary = { harness, mode: sandboxMode, cardDir, projectDir, activationCwd, foreignDir, checks: {} }
const check = (key, value) => {
  summary.checks[key] = value
  return value
}
const schema = {
  type: 'object',
  properties: { html: { type: 'string' } },
  required: ['html'],
  additionalProperties: false,
}

let ctx
try {
  ctx = await boot('agent-cwd-probe', rootConfigPath, patches, undefined, bareModuleBaseUrl)
  const versions = {}
  for (const name of ['dsh-subagent', 'dsh-sandbox-policy', 'dsh-agent-loop', 'dsh-app-boot']) {
    versions[name] = JSON.parse(await readFile(join(installed, name, 'package.json'), 'utf8')).version
  }
  log(`booted: harness=${harness} versions=${JSON.stringify(versions)} mode=${sandboxMode}`)
  log(`services: agents=${typeof ctx.get('agents')} sessions=${typeof ctx.get('sessions')} `
    + `sandboxPolicy=${typeof ctx.get('sandboxPolicy')} fs=${typeof ctx.get('fs')} `
    + `subagents=${typeof ctx.get('subagents')} sessionQuery=${typeof ctx.get('sessionQuery')} `
    + `workspaceRegistry=${typeof ctx.get('workspaceRegistry')} workingDirectory=${typeof ctx.get('workingDirectory')} `
    + `tools=${typeof ctx.get('tools')} llm=${typeof ctx.get('llm')}`)
  const provider = ctx.subagents?.getProvider?.('spawn')
  log(`spawn provider capabilities=${JSON.stringify(provider?.capabilities ?? null)}`)
  log(`subagent seam: startActivation=${typeof ctx.subagents?.startActivation} `
    + `start=${typeof ctx.subagents?.start} startContinuable=${typeof ctx.subagents?.startContinuable}`)
  const workingDirectory = ctx.get('workingDirectory')
  if (workingDirectory !== undefined) {
    report('workingDirectory methods', Object.getOwnPropertyNames(Object.getPrototypeOf(workingDirectory)))
  }

  const adapter = new MockAdapter()
  ctx.llm.registerAdapter(['mock'], adapter)

  // ---- [1] root -------------------------------------------------------------
  log('')
  log('[1] ROOT: does agents.create({ meta: { cwd } }) move the session header cwd?')
  const parent = await ctx.agents.create({
    sessionId: 'probe-parent',
    meta: { cwd: projectDir },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  report('parent meta.cwd passed in', projectDir)
  report('parent session.header.cwd', parent.agent.session.header.cwd)

  const created = await ctx.agents.create({
    sessionId: 'probe-agents-create',
    meta: { cwd: cardDir },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  const createdCwd = created.agent.session.header.cwd
  report('agents.create meta.cwd passed in', cardDir)
  report('created agent.session.header.cwd', createdCwd)
  report('equals the temp directory', check('rootEqualsTemp', createdCwd === cardDir))
  report('equals the parent project directory', check('rootEqualsProject', createdCwd === projectDir))
  report('created session.header', created.agent.session.header)

  // The same create, but parented by the "current session", which is what a card
  // agent would be. `parentAgent` is runtime ownership; `meta.cwd` is durable.
  const parented = await ctx.agents.create({
    sessionId: 'probe-parented-create',
    parentAgent: parent.agent,
    meta: { cwd: foreignDir },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  report('parented create meta.cwd passed in', foreignDir)
  report('parented create session.header.cwd', parented.agent.session.header.cwd)
  report('parented create header.cwd === parent header.cwd',
    check('parentedEqualsParent', parented.agent.session.header.cwd === parent.agent.session.header.cwd))
  report('parented create header.cwd === its own meta.cwd',
    check('parentedEqualsOwn', parented.agent.session.header.cwd === foreignDir))
  report('parented create sandboxPolicy.resolve().workspaceRoot',
    ctx.sandboxPolicy.resolve({ session: parented.agent.session }).workspaceRoot)
  await parented.dispose()

  // ---- [1b] the subagent seam (0.2.1 only) ---------------------------------
  log('')
  log('[1b] SUBAGENT SEAM: does startActivation({ request: { cwd } }) move it?')
  const structuredViaSeam = async (label, prompt, outputSchema) => {
    if (typeof ctx.subagents.startActivation === 'function') {
      const activation = await ctx.subagents.startActivation({
        provider: 'spawn',
        label,
        delivery: 'caller',
        signal: new AbortController().signal,
        request: { parent: created.agent, prompt, outputSchema, cwd: activationCwd },
      })
      // The child is only resident while the activation runs; capture its live
      // scope facts here, before the result settles and teardown releases it.
      const childAgent = ctx.agents.get(activation.childId)
      const facts = childAgent === undefined
        ? { resident: false }
        : {
            resident: true,
            headerCwd: childAgent.session.header.cwd,
            policyRoot: (() => {
              try {
                return ctx.sandboxPolicy.resolve({ session: childAgent.session }).workspaceRoot
              } catch (error) {
                return `resolve failed: ${error?.message ?? String(error)}`
              }
            })(),
            workingDirectory: (() => {
              try {
                return workingDirectory?.get?.(childAgent.session) ?? null
              } catch (error) {
                return `workingDirectory.get failed: ${error?.message ?? String(error)}`
              }
            })(),
          }
      const result = await activation.result
      return { result, childId: activation.childId, facts, dispose: () => activation.dispose() }
    }
    const run = await ctx.subagents.start('spawn', {
      parent: created.agent,
      prompt,
      outputSchema,
      label,
      signal: new AbortController().signal,
    })
    const result = await run.result
    return { result, childId: run.id, facts: { resident: run.localAgent !== undefined, headerCwd: run.localAgent?.session.header.cwd }, dispose: () => run.dispose() }
  }
  if (typeof ctx.subagents.startActivation === 'function') {
    const seam = await structuredViaSeam('probe-cwd', [{ type: 'text', text: 'probe cwd' }], schema)
    report('request.cwd passed to startActivation', activationCwd)
    report('activation childId', seam.childId)
    report('child resident at start', seam.facts.resident)
    report('child session.header.cwd (live)', seam.facts.headerCwd)
    report('child header.cwd === parent (created) header.cwd',
      check('seamChildInheritsParentCwd', seam.facts.headerCwd === created.agent.session.header.cwd))
    report('child header.cwd === request.cwd', check('seamChildTookRequestCwd', seam.facts.headerCwd === activationCwd))
    report('child sandboxPolicy.resolve().workspaceRoot', seam.facts.policyRoot)
    report('workingDirectory.get(child)', seam.facts.workingDirectory)
    const observedChild = await ctx.sessionQuery.observeSession(seam.childId)
    report('observeSession(child).header.cwd', observedChild.header.cwd)
    const changes = observedChild.events.filter(event => event.type === 'working-directory/change')
    report('working-directory/change events', changes.map(event => event.data))
    await seam.dispose()
  } else {
    report('startActivation', 'not present in this harness version')
  }

  // ---- [2] sandbox consequence ---------------------------------------------
  log('')
  log('[2] SANDBOX: what does that root do to a write?')
  const policy = ctx.sandboxPolicy.resolve({ session: created.agent.session })
  report('ctx.sandboxPolicy.defaultMode', ctx.sandboxPolicy.defaultMode)
  report('resolve({ session }).mode', policy.mode)
  report('resolve({ session }).workspaceRoot', policy.workspaceRoot)
  report('workspaceRoot === cardDir(temp)', check('policyRootIsTemp', policy.workspaceRoot === cardDir))
  report('workspaceRoot === projectDir', check('policyRootIsProject', policy.workspaceRoot === projectDir))
  report('fs backend class', ctx.fs?.constructor?.name)
  report('fs backend sandboxMode', ctx.fs?.sandboxMode)

  const writeProbe = async (label, targetPath, contents) => {
    const signal = new AbortController().signal
    try {
      const target = await ctx.fs.resolve(targetPath, { cwd: policy.workspaceRoot, signal })
      await ctx.fs.writeText(target, contents, undefined, signal, policy)
      report(label, 'ok')
      return 'ok'
    } catch (error) {
      report(label, `denied: ${error?.code ?? '?'} | ${error?.message ?? String(error)}`)
      return error?.code ?? 'error'
    }
  }

  check('writeInsideCardDir', await writeProbe('write INSIDE cardDir (temp)', join(cardDir, 'inside.txt'), 'inside\n'))
  check('writeIntoForeignTemp',
    await writeProbe('write INTO unrelated temp dir', join(foreignDir, 'outside.txt'), 'outside\n'))
  check('writeIntoProjectDir',
    await writeProbe('write INTO parent project dir', projectWritePath, 'outside\n'))

  // ---- [3] visibility ------------------------------------------------------
  log('')
  log('[3] VISIBILITY: where does the new session appear?')
  const sessionIds = ctx.sessions.list().map(session => session.id)
  report('ctx.sessions.list()', sessionIds)
  report('created session listed', check('listedInSessions', sessionIds.includes('probe-agents-create')))
  report('ctx.agents.list()', ctx.agents.list().map(agent => agent.id))
  report('ctx.agents.roots()', ctx.agents.roots().map(agent => agent.id))
  const observed = await ctx.sessionQuery.observeSession('probe-agents-create')
  report('sessionQuery.observeSession.header.cwd', observed.header.cwd)
  const queryList = ctx.sessionQuery.listSessions === undefined
    ? 'no listSessions'
    : await ctx.sessionQuery.listSessions()
  report('sessionQuery.listSessions',
    Array.isArray(queryList)
      ? queryList.map(row => ({
        id: row.header?.id ?? row.id, live: row.live, persisted: row.persisted, cwd: row.header?.cwd,
      }))
      : queryList)

  const workspaces = ctx.get('workspaceRegistry')
  if (workspaces !== undefined) {
    report('workspaces.list() before any workspace exists',
      workspaces.list().map(workspace => ({ path: workspace.path, sessionIds: workspace.sessionIds })))
    report('workspace registry methods', Object.getOwnPropertyNames(Object.getPrototypeOf(workspaces)))
    await workspaces.create(projectDir)
    await workspaces.create(cardDir).catch(error => report('create(cardDir) failed', String(error?.message ?? error)))
    report('workspaces.list() after create(projectDir) + create(cardDir)',
      workspaces.list().map(workspace => ({ path: workspace.path, sessionIds: workspace.sessionIds })))
    report('archivedSessionIds (before)', workspaces.archivedSessionIds)
    try {
      await workspaces.archiveSession('probe-agents-create')
      report('after archiveSession: archivedSessionIds', workspaces.archivedSessionIds)
      report('after archiveSession: workspaces.list()',
        workspaces.list().map(workspace => ({ path: workspace.path, sessionIds: workspace.sessionIds })))
      report('after archiveSession: sessions.list()', ctx.sessions.list().map(session => session.id))
      check('archiveAccepted', workspaces.archivedSessionIds.includes('probe-agents-create'))
      await workspaces.unarchiveSession('probe-agents-create')
      report('after unarchiveSession: archivedSessionIds', workspaces.archivedSessionIds)
    } catch (error) {
      report('archiveSession failed', `${error?.code ?? '?'} | ${error?.message ?? String(error)}`)
    }
  }
  report('CreateAgentOptions.meta fields this probe can pass',
    ['cwd', 'parentSession', 'isSeeded', 'origin', 'delegationDepth', 'agentPreset'])

  // ---- [4] structured output ----------------------------------------------
  log('')
  log('[4] STRUCTURED OUTPUT')
  const seam = await structuredViaSeam(
    'probe-structured', [{ type: 'text', text: 'Report {"html":"<b>hi</b>"}.' }], schema)
  report('seam run.result.stopReason', check('seamStopReason', seam.result.stopReason))
  report('seam run.result.structured', check('seamStructured', seam.result.structured ?? null))
  report('seam run.result.output', seam.result.output)
  const seamRequests = adapter.requests.splice(0)
  report('requests the child made', seamRequests)
  check('childSeesStructuredTool', seamRequests.some(request => request.structuredTool))
  const seamEvents = (await ctx.sessionQuery.observeSession(seam.childId)).events
  report('child event types', seamEvents.map(event => event.type))
  report('child capture tool call/result logged', seamEvents
    .filter(event => event.type === 'tool/call' || event.type === 'tool/result')
    .map(event => event.type === 'tool/call'
      ? { type: event.type, name: event.data?.name }
      : { type: event.type, isError: event.data?.isError }))
  await seam.dispose()

  // The same ask driven on an `agents.create` agent, with no seam. The prompt is
  // deliberately prose-only: this agent has no `structured_output` tool, so a
  // capture request there has nowhere to go.
  adapter.requests.splice(0)
  created.agent.followup(createUserMessage({
    content: [{ type: 'text', text: 'Answer in prose: hello.' }],
    source: { kind: 'user' },
  }))
  await created.agent.whenIdle()
  const plainRequests = adapter.requests.splice(0)
  report('requests the created agent made', plainRequests)
  check('createdAgentSeesStructuredTool', plainRequests.some(request => request.structuredTool))
  report('agents.create handle members', Object.keys(created))
  report('created agent own result accessors',
    Object.getOwnPropertyNames(Object.getPrototypeOf(created.agent)).filter(key => /result|structur|capture/i.test(key)))

  // [5] The question that decides how the card fence is built: a seam child whose
  // PARENT is an agents.create agent rooted at the card directory — does it inherit that
  // directory as its own sandbox root? childSessionMeta copies the parent's header cwd,
  // so it should; this is the measurement, not the inference.
  log('[5] CARD AGENT AS PARENT: does a seam child inherit the card agent\'s cwd?')
  if (typeof ctx.subagents.startActivation === 'function') {
    const cardAgent = await ctx.agents.create({ sessionId: 'probe-card-parent', meta: { cwd: foreignDir } })
    report('card agent header.cwd', cardAgent.agent.session.header.cwd)
    const carded = await ctx.subagents.startActivation({
      provider: 'spawn',
      label: 'probe-card-parent',
      delivery: 'caller',
      signal: new AbortController().signal,
      request: {
        parent: cardAgent.agent,
        prompt: [{ type: 'text', text: 'probe: say done' }],
        outputSchema: { type: 'object', properties: { html: { type: 'string' } }, required: ['html'], additionalProperties: true },
      },
    })
    const cardChild = ctx.agents.get(carded.childId)
    const cardChildRoot = cardChild === undefined
      ? 'no resident child'
      : (() => {
          try {
            return ctx.sandboxPolicy.resolve({ session: cardChild.session }).workspaceRoot
          } catch (error) {
            return `resolve failed: ${error?.message ?? String(error)}`
          }
        })()
    report('card seam child header.cwd', cardChild?.session?.header?.cwd ?? 'n/a')
    report('card seam child sandbox root', cardChildRoot)
    report('expected card directory', foreignDir)
    check('cardSeamChildRootIsCardDir', String(cardChildRoot) === String(foreignDir))
    check('cardSeamChildHeaderIsCardDir', String(cardChild?.session?.header?.cwd) === String(foreignDir))
    await carded.dispose().catch(() => {})
    await cardAgent.dispose()
  } else {
    report('card parent case', 'skipped: startActivation missing')
  }

  // [6] THE LIVE ACTIVITY BUS. The question this answers: what does a host plugin
  // actually receive while a seam child is using a tool, and how does it address just
  // that child? Everything below is measured from real bus traffic, not from a type.
  log('')
  log('[6] LIVE ACTIVITY: what arrives on the bus while a child uses a tool?')
  if (typeof ctx.subagents.startActivation === 'function') {
    /** Everything the root bus delivered, in arrival order. */
    const busLog = []
    const keysOf = value => (value === null || typeof value !== 'object' ? null : Object.keys(value))
    const runtimeOf = (name, payload, extra) => {
      const agentId = payload?.agent?.id
      const sessionId = payload?.session?.id
      busLog.push({
        bus: name,
        agentId,
        sessionId,
        ...extra,
      })
    }
    // The same `ctx.on(...)` route the product's own `agent/error` attribution uses:
    // one root subscription, narrowed by identity in the listener.
    const offSession = ctx.on('session/event', (session, event) => {
      runtimeOf('session/event', { session }, {
        type: event?.type,
        dataKeys: keysOf(event?.data),
        // The two fields a "tool name + first argument" entry needs, named as measured.
        name: event?.data?.name,
        arguments: typeof event?.data?.arguments === 'string'
          ? event.data.arguments.slice(0, 160)
          : undefined,
        argKeys: (() => {
          const raw = event?.data?.arguments
          if (typeof raw !== 'string') return undefined
          try {
            const parsed = JSON.parse(raw)
            return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
              ? Object.keys(parsed)
              : [typeof parsed]
          } catch {
            return ['<unparseable>']
          }
        })(),
        callId: event?.data?.callId,
        isError: event?.data?.message?.isError,
      })
    })
    const offStream = ctx.on('agent/assistant-stream', ({ agent, frame }) => {
      runtimeOf('agent/assistant-stream', { agent }, { type: frame?.type, frameKeys: keysOf(frame) })
    })
    const offStatus = ctx.on('agent/status', ({ agent, status }) => {
      runtimeOf('agent/status', { agent }, { status })
    })
    // NOT `agent/request`: it is declared `@mode waterfall`, so a passive listener that
    // returns nothing replaces the frozen call configuration with `undefined`, and the step
    // then fails as `Cannot read properties of undefined (reading 'provider')`. Measured
    // here, the hard way.
    const offError = ctx.on('agent/error', ({ agent, error }) => {
      runtimeOf('agent/error', { agent }, {
        error: String(error?.message ?? error),
        stack: String(error?.stack ?? '').split('\n').slice(0, 6).join(' | '),
      })
    })

    // The mock calls the real shell tool once: the prompt asks for it, and the mock
    // picks the tool the composition actually offers. The parent carries the route, because
    // a child inherits its parent's call configuration and an unconfigured parent leaves the
    // child's request with no provider at all (measured: it fails as
    // `Cannot read properties of undefined (reading 'provider')`).
    adapter.tool = { name: 'pwsh', args: { description: 'Probe one shell call', command: 'echo dsh-probe-tool-activity' } }
    const activityParent = await ctx.agents.create({
      sessionId: 'probe-activity-parent',
      meta: { cwd: projectDir },
      agentOptions: { provider: 'mock', model: 'mock' },
    })
    const activity = await ctx.subagents.startActivation({
      provider: 'spawn',
      label: 'probe-activity',
      delivery: 'caller',
      signal: new AbortController().signal,
      request: {
        parent: activityParent.agent,
        prompt: [{ type: 'text', text: 'Write the file probe-note.txt in the working directory, then say done.' }],
        cwd: projectDir,
      },
    })
    const activityChildId = activity.childId
    const activityResult = await activity.result
    await activity.dispose().catch(() => {})
    await activityParent.dispose().catch(() => {})
    adapter.tool = null
    offSession()
    offStream()
    offStatus()
    offError()

    report('tools the child was offered', adapter.toolNames)
    report('activity parent agent.options', activityParent.agent.options)
    report('activity parent requestHeader config', activityParent.agent.session.requestHeader?.()?.config ?? null)
    report('child answered with', activityResult.stopReason)
    report('child id', activityChildId)
    const childOnly = busLog.filter(entry => entry.agentId === activityChildId || entry.sessionId === activityChildId)
    report('bus entries total / addressed to this child', `${String(busLog.length)} / ${String(childOnly.length)}`)
    report('child bus entries rounded to 24 characters',
      childOnly.reduce((counts, entry) => {
        const key = `${entry.bus}:${String(entry.type ?? entry.status)}`
        counts[key] = (counts[key] ?? 0) + 1
        return counts
      }, {}))
    log('  --- every child bus entry, verbatim ---')
    for (const entry of childOnly) log(`  ${JSON.stringify(entry)}`)
    const toolCalls = childOnly.filter(entry => entry.type === 'tool/call')
    report('tool/call entries addressed to the child', toolCalls)
    const toolResults = childOnly.filter(entry => entry.type === 'tool/result')
    report('tool/result entries addressed to the child', toolResults)
    report('command/run entries (slash commands) seen', busLog.filter(entry => entry.type === 'command/run'))
    report('distinct session/event types from this child',
      [...new Set(childOnly.filter(entry => entry.bus === 'session/event').map(entry => entry.type))])
    report('agent/status values for this child',
      childOnly.filter(entry => entry.bus === 'agent/status').map(entry => entry.status))
    report('agent/assistant-stream frame types for this child',
      [...new Set(childOnly.filter(entry => entry.bus === 'agent/assistant-stream').map(entry => entry.type))])
    report('agent/assistant-stream frame for this child (first three)',
      childOnly.filter(entry => entry.bus === 'agent/assistant-stream').slice(0, 3))
    // Whether the same events are also readable from the log afterwards, which is the
    // fallback if a bus subscription turns out to be unavailable to a plugin.
    const childLog = (await ctx.sessionQuery.observeSession(activityChildId)).events
    report('child session log types after settlement', childLog.map(event => event.type))
    check('activityToolCallOnBus', toolCalls.length > 0)
    check('activityToolCallInLog',
      childLog.filter(event => event.type === 'tool/call').map(event => ({ name: event.data?.name })))
  } else {
    report('activity case', 'skipped: startActivation missing')
  }

  await created.dispose()
  await parent.dispose()
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
  rmSync(activationCwd, { recursive: true, force: true })
  rmSync(foreignDir, { recursive: true, force: true })
  if (existsSync(projectWritePath)) rmSync(projectWritePath)
  log('')
  log(`SUMMARY ${JSON.stringify(summary)}`)
  log(`cleaned: home=${home} cardDir=${cardDir} activationCwd=${activationCwd} foreignDir=${foreignDir}`)
}
