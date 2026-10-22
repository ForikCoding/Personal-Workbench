/** Request fencing, method handling, and payload validation of the skill card route. */

import { describe, expect, it, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  createWorkbenchSkillCardCatalogHandler,
  createWorkbenchSkillCardDirectoryHandler,
  createWorkbenchSkillCardHandler,
  createWorkbenchSkillCardRunHandler,
} from '../src/skill-card-route.ts'
import type { SkillCardRouteFence } from '../src/skill-card-route.ts'
import { WorkbenchSkillCardRunner } from '../src/skill-card-runner.ts'
import type { WorkbenchCardSelection } from '../src/skill-card-runner.ts'
import type { WorkbenchDirectoryProbe } from '../src/skill-card-directory.ts'
import {
  WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH,
  WORKBENCH_REFINE_PREVIOUS_MAX_BYTES,
} from '../src/skill-card-contract.ts'
import type { WorkbenchRunCapabilities } from '../src/skill-card-contract.ts'
import { WorkbenchSkillCardStore } from '../src/skill-card-store.ts'
import { FakeRequest, run } from './support/fake-http.ts'
import { fakeSkillCardTables } from './support/fake-skill-card-tables.ts'
import type { FakeSkillCardSeed, FakeSkillCardTables } from './support/fake-skill-card-tables.ts'
import { WORKSPACE_PATH, fakeHost } from './support/fake-skill-card-host.ts'
import type { FakeHostOptions } from './support/fake-skill-card-host.ts'

/** Fence double with a configurable rejection. */
function fence(rejection: 401 | 403 | undefined): SkillCardRouteFence {
  return { requestRejection: () => rejection }
}

/** Tables that fail the spec if the route reaches storage at all. */
function forbiddenTables(): FakeSkillCardTables {
  const tables = fakeSkillCardTables()
  const boom = (): never => { throw new Error('storage was reached') }
  tables.card.entries = boom
  tables.card.get = boom
  tables.template.entries = boom
  tables.result.entries = boom
  return tables
}

/** Everything a spec needs to drive one handler. */
interface Setup {
  readonly handle: (request: IncomingMessage, response: ServerResponse) => void
  readonly tables: FakeSkillCardTables
  readonly warn: ReturnType<typeof vi.fn>
  readonly store: WorkbenchSkillCardStore
}

/**
 * Build a handler plus its tables.
 * @param options - fence rejection, seed records, table override, and template budget.
 * @returns the handler, tables, logger spy, and store.
 */
function setup(options: {
  rejection?: 401 | 403
  seed?: FakeSkillCardSeed
  tables?: FakeSkillCardTables
  maxTemplateBytes?: number
  capabilities?: WorkbenchRunCapabilities
} = {}): Setup {
  const tables = options.tables ?? fakeSkillCardTables(options.seed)
  const store = new WorkbenchSkillCardStore({
    domainName: 'workbench_skill_card',
    card: tables.card,
    template: tables.template,
    result: tables.result,
    events: { on: () => () => {} },
    maxTemplateBytes: options.maxTemplateBytes ?? 1024,
    maxTemplatesPerCard: 4,
    maxResultBytes: 512,
    bootStamp: 7,
  })
  const warn = vi.fn()
  const handle = createWorkbenchSkillCardHandler({
    store,
    fence: fence(options.rejection),
    maxTemplateBytes: options.maxTemplateBytes ?? 1024,
    capabilities: options.capabilities ?? { startActivation: true, start: false },
    warn,
  })
  return { handle, tables, warn, store }
}

/** A patch body that would be accepted. */
function patch(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { baseRevision: '7:0', cardId: 'skill-card', skill: 'git-repo', ...overrides }
}

describe('workbench skill card route', () => {
  it('answers a fenced request without touching storage', async () => {
    const { handle, tables } = setup({ rejection: 401, tables: forbiddenTables() })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(401)
    expect(JSON.parse(response.body)).toEqual({ error: { code: 'unauthorized', message: 'request rejected' } })
    expect(tables.operations).toEqual([])
  })

  it('reports a forbidden request as such', async () => {
    const { handle } = setup({ rejection: 403 })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(403)
    expect(JSON.parse(response.body).error.code).toBe('forbidden')
  })

  it('reads configuration and results', async () => {
    const { handle } = setup({
      seed: {
        card: { 'skill-card': { skill: 'git-repo' } },
        template: { 'skill-card_git-repo': { html: '<b>{{branch}}</b>' } },
        result: { 'skill-card': { skill: 'git-repo', executedAt: 12, stopReason: 'completed' } },
      },
    })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      revision: '7:0',
      cards: [{ cardId: 'skill-card', skill: 'git-repo', templateSkills: ['git-repo'], template: '<b>{{branch}}</b>' }],
      results: [{ cardId: 'skill-card', skill: 'git-repo', executedAt: 12, stopReason: 'completed' }],
      capabilities: { startActivation: true, start: false },
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('reports a harness without either run seam on the same read', async () => {
    // The card cannot run there, but it can still be read and edited: the verdict travels
    // with the state so the surface disables one control instead of failing a click.
    const { handle } = setup({ capabilities: { startActivation: false, start: false } })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).capabilities).toEqual({ startActivation: false, start: false })
  })

  it('reports the older channel one-shot seam as runnable', async () => {
    // 0.2.0-rc.2 has start and no startActivation: runs are available there through the
    // one-shot seam, so the verdict must not disable the control.
    const { handle } = setup({ capabilities: { startActivation: false, start: true } })
    const response = await run(handle, new FakeRequest('GET'))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).capabilities).toEqual({ startActivation: false, start: true })
  })

  it('writes a configuration patch and echoes the new state', async () => {
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PATCH', patch({ template: { skill: 'git-repo', html: '<i>x</i>' } })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([{
      cardId: 'skill-card',
      skill: 'git-repo',
      templateSkills: ['git-repo'],
      template: '<i>x</i>',
    }])
    expect(tables.operations.map(operation => `${operation.table}:${operation.kind}`)).toEqual(['template:put', 'card:put'])
  })

  it('answers a stale revision with the current state and writes nothing', async () => {
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PATCH', patch({ baseRevision: '0:9' })))
    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body)).toMatchObject({ revision: '7:0', cards: [] })
    expect(tables.operations).toEqual([])
  })

  it('rejects a patch the store cannot accept', async () => {
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PATCH', patch({ skill: 'Git-Repo' })))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body)).toEqual({
      error: { code: 'invalid-request', message: 'skill must be null or a kebab-case skill name' },
    })
    expect(tables.operations).toEqual([])
  })

  it('carries a model pair through the wire and stores it whole', async () => {
    // The provider id contains a slash on purpose: a `"provider/model"` string would have
    // to be split on a character the id may itself contain.
    const { handle, tables } = setup()
    const model = { provider: 'vendor/gateway', model: 'large' }
    const response = await run(handle, new FakeRequest('PATCH', patch({ model })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([
      { cardId: 'skill-card', skill: 'git-repo', model, templateSkills: [] },
    ])
    expect(tables.operations).toEqual([{ table: 'card', kind: 'put', key: 'skill-card', value: { skill: 'git-repo', model } }])
  })

  it('refuses a model that is not two non-empty ids', async () => {
    const { handle, tables } = setup()
    for (const model of [{ provider: 'deepseek' }, 'deepseek/chat', { provider: '', model: 'chat' }]) {
      const response = await run(handle, new FakeRequest('PATCH', patch({ model })))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error.message)
        .toBe('model must be null or an object naming a provider and a model')
    }
    expect(tables.operations).toEqual([])
  })

  it('carries the workspace path through the wire and stores it whole', async () => {
    // The full absolute path, not a workspace id: the card runs in whatever directory the
    // user picked, whether or not it is a registered workspace.
    const { handle, tables } = setup()
    const workspace = { path: 'D:\\Git\\Personal-Workbench' }
    const response = await run(handle, new FakeRequest('PATCH', patch({ workspace })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([
      { cardId: 'skill-card', skill: 'git-repo', workspace, templateSkills: [] },
    ])
    expect(tables.operations).toEqual([
      { table: 'card', kind: 'put', key: 'skill-card', value: { skill: 'git-repo', workspace } },
    ])
  })

  it('refuses a workspace that is not one absolute path', async () => {
    // A relative path would name a different directory to whoever resolved it, so it is
    // refused at the boundary rather than resolved against something nobody named.
    const { handle, tables } = setup()
    for (const workspace of [{ path: '' }, { path: 'relative/dir' }, { path: 7 }, 'D:\\Git', [], { id: 'ws-1' }]) {
      const response = await run(handle, new FakeRequest('PATCH', patch({ workspace })))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error.message)
        .toBe('workspace must be null or an object naming one absolute directory path')
    }
    expect(tables.operations).toEqual([])
  })

  it('carries the permission mode through the wire and stores it', async () => {
    // One of the three modes, written as an absolute value: the picker is the whole choice,
    // so a write states the mode rather than a diff against the stored one.
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PATCH', patch({ permission: 'read-only' })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([
      { cardId: 'skill-card', skill: 'git-repo', permission: 'read-only', templateSkills: [] },
    ])
    expect(tables.operations).toEqual([
      { table: 'card', kind: 'put', key: 'skill-card', value: { skill: 'git-repo', permission: 'read-only' } },
    ])
  })

  it('refuses a permission mode this build does not know', async () => {
    // A mode the sandbox vocabulary does not contain would reach the session as an event no
    // tool enforces, so it is refused at the boundary rather than stored.
    const { handle, tables } = setup()
    for (const permission of ['full-control', '', 7, true]) {
      const response = await run(handle, new FakeRequest('PATCH', patch({ permission })))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error.message)
        .toBe('permission must be null or one of read-only, workspace-write, danger-full-access')
    }
    expect(tables.operations).toEqual([])
  })

  it('clears the permission mode when the patch says null, leaving the rest of the record', async () => {
    const { handle, tables } = setup({
      seed: { card: { 'skill-card': { skill: 'git-repo', name: '任务', permission: 'danger-full-access' } } },
    })
    const response = await run(handle, new FakeRequest('PATCH', patch({ permission: null })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([{
      cardId: 'skill-card',
      name: '任务',
      skill: 'git-repo',
      templateSkills: [],
    }])
    expect(tables.operations.at(-1)).toEqual({
      table: 'card',
      kind: 'put',
      key: 'skill-card',
      value: { name: '任务', skill: 'git-repo' },
    })
  })

  it('clears the workspace when the patch says null, leaving the rest of the record', async () => {
    // Clearing is offered because a card may move onto another directory. It has to leave
    // the name, the skill, and the model exactly as they were.
    const { handle, tables } = setup({
      seed: {
        card: {
          'skill-card': {
            skill: 'git-repo',
            name: '任务',
            model: { provider: 'deepseek', model: 'chat' },
            workspace: { path: '/old' },
          },
        },
      },
    })
    const response = await run(handle, new FakeRequest('PATCH', patch({ workspace: null })))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).cards).toEqual([{
      cardId: 'skill-card',
      name: '任务',
      skill: 'git-repo',
      model: { provider: 'deepseek', model: 'chat' },
      templateSkills: [],
    }])
    expect(tables.operations.at(-1)).toEqual({
      table: 'card',
      kind: 'put',
      key: 'skill-card',
      value: {
        name: '任务',
        skill: 'git-repo',
        model: { provider: 'deepseek', model: 'chat' },
      },
    })
  })

  it('refuses a removal that also carries a workspace', async () => {
    const { handle, tables } = setup()
    const response = await run(handle, new FakeRequest('PATCH', patch({ remove: true, workspace: { path: '/repo' } })))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message)
      .toBe('a removal cannot carry a name, a skill, a model, a workspace, a permission, or a template')
    expect(tables.operations).toEqual([])
  })

  it('refuses a template above the wire limit with the size code', async () => {
    const { handle, tables } = setup()
    const oversized = 'x'.repeat(1025)
    const response = await run(handle, new FakeRequest('PATCH', patch({ template: { skill: 'git-repo', html: oversized } })))
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body).error.code).toBe('too-large')
    expect(tables.operations).toEqual([])
  })

  it('refuses a body above the request cap', async () => {
    const { handle } = setup()
    const huge = patch({ template: { skill: 'git-repo', html: 'x'.repeat(200_000) } })
    const response = await run(handle, new FakeRequest('PATCH', huge))
    expect(response.statusCode).toBe(413)
    expect(JSON.parse(response.body).error.code).toBe('too-large')
  })

  it('refuses an unreadable body', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', undefined))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message).toBe('request body is empty')

    const malformed = await run(handle, FakeRequest.raw('PATCH', '{'))
    expect(malformed.statusCode).toBe(400)
    expect(JSON.parse(malformed.body).error.message).toBe('request body is not JSON')
  })

  it('rejects a body that is not an object', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('PATCH', []))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.message).toBe('body must be an object')
  })

  it('rejects a non-string base revision and an unknown card id', async () => {
    const { handle } = setup()
    const noRevision = await run(handle, new FakeRequest('PATCH', { baseRevision: 1, cardId: 'skill-card' }))
    expect(JSON.parse(noRevision.body).error.message).toBe('baseRevision must be a string')

    const badCard = await run(handle, new FakeRequest('PATCH', patch({ cardId: 'Skill-Card' })))
    expect(JSON.parse(badCard.body).error.message).toBe('cardId must be a namespaced card id')
  })

  it('rejects a malformed template field', async () => {
    const { handle } = setup()
    const notObject = await run(handle, new FakeRequest('PATCH', patch({ template: 'x' })))
    expect(JSON.parse(notObject.body).error.message).toBe('template must be an object')

    const badSkill = await run(handle, new FakeRequest('PATCH', patch({ template: { skill: 'Git-Repo', html: 'x' } })))
    expect(JSON.parse(badSkill.body).error.message).toBe('template.skill must be a kebab-case skill name')

    const badHtml = await run(handle, new FakeRequest('PATCH', patch({ template: { skill: 'git-repo', html: 1 } })))
    expect(JSON.parse(badHtml.body).error.message).toBe('template.html must be a string')
  })

  it('names the allowed methods on anything else', async () => {
    const { handle } = setup()
    const response = await run(handle, new FakeRequest('DELETE'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET, PATCH')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('reports a storage failure without echoing the request', async () => {
    const tables = fakeSkillCardTables()
    tables.card.failPuts(new Error('disk on fire'))
    const { handle, warn } = setup({ tables })
    const response = await run(handle, new FakeRequest('PATCH', patch()))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body)).toEqual({
      error: { code: 'storage-failure', message: 'skill card storage failed' },
    })
    expect(response.body).not.toContain('disk on fire')
    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0]?.[0])).toContain('disk on fire')
  })
})

/** Options the catalog and run route specs vary on. */
interface RuntimeOptions extends FakeHostOptions {
  readonly rejection?: 401 | 403
  readonly selection?: WorkbenchCardSelection
}

/**
 * Build the catalog and run handlers over one fake host.
 * @param options - fence rejection, host behaviour, and card selection.
 * @returns both handlers plus what the spec asserts about.
 */
function runtime(options: RuntimeOptions = {}): {
  catalog: (request: IncomingMessage, response: ServerResponse) => void
  run: (request: IncomingMessage, response: ServerResponse) => void
  runner: WorkbenchSkillCardRunner
  fake: ReturnType<typeof fakeHost>
  warn: ReturnType<typeof vi.fn>
} {
  const fake = fakeHost(options)
  const warn = vi.fn()
  const runner = new WorkbenchSkillCardRunner({
    host: fake.host,
    workingDirectory: fake.workingDirectory,
    statDirectory: fake.statDirectory,
    subagentProvider: 'spawn',
    runTimeoutMs: 5_000,
    maxConcurrentRuns: 1,
    // A card that is ready to run: the workspace is part of "configured" now, and the
    // refusals below say what they want instead.
    selection: () => options.selection
      ?? { skill: 'git-repo', template: '<b>{{branch}}</b>', workspace: { path: WORKSPACE_PATH } },
    saveResult: async () => undefined,
    warn,
    now: () => 42,
  })
  return {
    catalog: createWorkbenchSkillCardCatalogHandler({ runner, fence: fence(options.rejection), warn }),
    run: createWorkbenchSkillCardRunHandler({ runner, fence: fence(options.rejection), warn }),
    runner,
    fake,
    warn,
  }
}

/**
 * Build a request carrying a URL, for routes that read query parameters.
 * @param path - request path with its query string.
 * @param method - HTTP method.
 * @param body - JSON body to stream.
 * @returns the request double.
 */
function at(path: string, method = 'GET', body?: unknown): FakeRequest {
  const request = new FakeRequest(method, body)
  request.url = path
  return request
}

/** A run body that passes every precondition. */
function runBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    cardId: 'skill-card',
    sessionId: 'session-1',
    mode: { kind: 'card' },
    outputSchema: { type: 'object', properties: {} },
    ...overrides,
  }
}

const CATALOG_PATH = '/api/workbench/skill-card/catalog?sessionId=session-1'
const RUN_PATH = '/api/workbench/skill-card/run'

describe('workbench skill card catalog route', () => {
  it('answers a fenced request before reaching the runner', async () => {
    const { catalog, fake } = runtime({ rejection: 401 })
    const response = await run(catalog, at(CATALOG_PATH))
    expect(response.statusCode).toBe(401)
    expect(fake.lookups).toEqual([])
  })

  it('names the method it serves', async () => {
    const { catalog } = runtime()
    const response = await run(catalog, at('/api/workbench/skill-card/catalog', 'POST'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })

  it('lists the installed skills with no session to run in yet', async () => {
    // A card is configured before it is ever run, so the catalog must not wait for
    // the session the run will use.
    const { catalog } = runtime()
    const response = await run(catalog, at('/api/workbench/skill-card/catalog'))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).skills.map((skill: { name: string }) => skill.name))
      .toEqual(['git-repo', 'hidden'])
  })

  it('lists the installed skills when no session is live at all', async () => {
    // A booted profile has no live agent, so there is no scope to read through.
    // The Desktop layer mounts a host-plane skill provider for exactly this case;
    // the route has to read the global layer rather than refuse.
    const { catalog } = runtime({ live: false })
    const response = await run(catalog, at('/api/workbench/skill-card/catalog'))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body).skills.map((skill: { name: string }) => skill.name))
      .toEqual(['git-repo', 'hidden'])
  })

  it('returns the catalog', async () => {
    const { catalog } = runtime()
    const response = await run(catalog, at(CATALOG_PATH))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      skills: [
        { name: 'git-repo', description: 'git-repo description', userInvocable: true },
        { name: 'hidden', description: 'hidden description', userInvocable: false },
      ],
    })
  })

  it('reports an upstream failure as such', async () => {
    const { catalog } = runtime({ throwsOn: 'list' })
    const response = await run(catalog, at(CATALOG_PATH))
    expect(response.statusCode).toBe(500)
    expect(JSON.parse(response.body).error.code).toBe('catalog-failed')
  })
})

describe('workbench skill card run route', () => {
  it('answers a fenced request before reaching the runner', async () => {
    const { run: handle, fake } = runtime({ rejection: 403 })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody()))
    expect(response.statusCode).toBe(403)
    expect(fake.activations).toEqual([])
  })

  it('names the methods it serves', async () => {
    const { run: handle } = runtime()
    const response = await run(handle, at(RUN_PATH, 'PATCH'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('POST, GET, DELETE')
  })

  it('accepts a run and reports it as running', async () => {
    const { run: handle, runner } = runtime({ outcomes: ['hang'] })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody()))
    // Accepted rather than OK: the run continues past this response.
    expect(response.statusCode).toBe(202)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      state: { cardId: 'skill-card', phase: 'running', startedAt: 42, retried: false },
    })
    runner.cancel('skill-card')
  })

  it('maps each refusal onto its status without starting a child', async () => {
    const cases: readonly {
      readonly options: RuntimeOptions
      readonly body?: Record<string, unknown>
      readonly status: number
      readonly code: string
    }[] = [
      { options: {}, body: runBody({ outputSchema: undefined }), status: 400, code: 'schema-rejected' },
      { options: { selection: {} }, status: 400, code: 'not-configured' },
      {
        options: { selection: { skill: 'git-repo', workspace: { path: WORKSPACE_PATH } } },
        status: 400,
        code: 'template-missing',
      },
      { options: { live: false }, status: 409, code: 'session-not-live' },
      { options: { providers: {} }, status: 500, code: 'provider-unavailable' },
      // A card pinned to a route the deployment no longer offers. It conflicts with the
      // state the card was configured against, so the client can say which model is gone
      // instead of reading it as a malformed request.
      {
        options: {
          selection: {
            skill: 'git-repo',
            template: '<b>{{a}}</b>',
            workspace: { path: WORKSPACE_PATH },
            model: { provider: 'deepseek', model: 'retired' },
          },
        },
        status: 409,
        code: 'model-unavailable',
      },
      // A card with nothing chosen for "where": the request is fine and one fact is missing,
      // exactly like `not-configured`.
      {
        options: { selection: { skill: 'git-repo', template: '<b>{{a}}</b>' } },
        status: 400,
        code: 'workspace-missing',
      },
      // A stored directory that no longer holds one. It conflicts with the state the card was
      // configured against, so the client can say which path went missing.
      {
        options: {
          selection: { skill: 'git-repo', template: '<b>{{a}}</b>', workspace: { path: '/gone/project' } },
          directory: { exists: false, isDirectory: false, writable: false },
        },
        status: 409,
        code: 'workspace-invalid',
      },
    ]
    for (const item of cases) {
      const { run: handle, fake } = runtime(item.options)
      const response = await run(handle, at(RUN_PATH, 'POST', item.body ?? runBody()))
      expect(response.statusCode, item.code).toBe(item.status)
      expect(JSON.parse(response.body).error.code).toBe(item.code)
      expect(fake.activations).toEqual([])
    }
  })

  it('refuses a run on a harness without either run seam, naming the remedy', async () => {
    // A stale click, a direct route call, or a button inside a result reaches the route
    // after the client already knows. The answer is a stated problem, not a thrown stack.
    const { run: handle, fake } = runtime({ startActivation: false })
    const card = await run(handle, at(RUN_PATH, 'POST', runBody()))
    expect(card.statusCode).toBe(501)
    expect(JSON.parse(card.body).error.code).toBe('run-unavailable')
    expect(JSON.parse(card.body).error.message).toContain('startActivation')

    // The bare mode is what a template button triggers, and it must land on the same
    // refusal rather than a different one.
    const bare = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'bare', skill: 'git-repo' },
      outputSchema: undefined,
    })))
    expect(JSON.parse(bare.body).error.code).toBe('run-unavailable')
    expect(fake.activations).toEqual([])
  })

  it('refuses a second run while one is in flight', async () => {
    const { run: handle, runner } = runtime({ outcomes: ['hang'] })
    await run(handle, at(RUN_PATH, 'POST', runBody()))
    const response = await run(handle, at(RUN_PATH, 'POST', runBody()))
    expect(response.statusCode).toBe(409)
    expect(JSON.parse(response.body).error.code).toBe('run-in-progress')
    runner.cancel('skill-card')
  })

  it('rejects a run body outside the contract', async () => {
    const { run: handle } = runtime()
    const notObject = await run(handle, at(RUN_PATH, 'POST', []))
    expect(notObject.statusCode).toBe(400)
    expect(JSON.parse(notObject.body).error.message).toBe('body must be an object')

    const badCard = await run(handle, at(RUN_PATH, 'POST', runBody({ cardId: 'Skill-Card' })))
    expect(JSON.parse(badCard.body).error.message).toBe('cardId must be a namespaced card id')

    const noSession = await run(handle, at(RUN_PATH, 'POST', runBody({ sessionId: '' })))
    expect(JSON.parse(noSession.body).error.message).toBe('sessionId must be a non-empty string')

    const empty = await run(handle, at(RUN_PATH, 'POST'))
    expect(empty.statusCode).toBe(400)
    expect(JSON.parse(empty.body).error.message).toBe('request body is empty')
  })

  it('requires the run to say what it is asked to do', async () => {
    // The mode is explicit rather than inferred from the presence of a contract: a card
    // run that lost its contract has to fail as a card run, not quietly become a bare
    // one.
    const { run: handle } = runtime()
    const none = await run(handle, at(RUN_PATH, 'POST', runBody({ mode: undefined })))
    expect(none.statusCode).toBe(400)
    expect(JSON.parse(none.body).error.message).toBe('mode must be an object')

    const unknown = await run(handle, at(RUN_PATH, 'POST', runBody({ mode: { kind: 'other' } })))
    expect(JSON.parse(unknown.body).error.message).toBe('mode.kind must be card, bare or refine')

    const nameless = await run(handle, at(RUN_PATH, 'POST', runBody({ mode: { kind: 'bare' } })))
    expect(JSON.parse(nameless.body).error.message).toBe('mode.skill must be a kebab-case skill name')

    const invalid = await run(handle, at(RUN_PATH, 'POST', runBody({ mode: { kind: 'bare', skill: 'Git-Repo' } })))
    expect(JSON.parse(invalid.body).error.message).toBe('mode.skill must be a kebab-case skill name')
  })

  it('accepts a bare run for a card with no template at all', async () => {
    // The skill target names the skill itself, so neither a configured skill nor a
    // template is a precondition. A directory still is: the run has to happen somewhere,
    // and that somewhere is the card's own answer.
    const { run: handle, fake, runner } = runtime({ selection: { workspace: { path: WORKSPACE_PATH } }, outcomes: ['hang'] })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'bare', skill: 'git-repo' },
      outputSchema: undefined,
    })))
    expect(response.statusCode).toBe(202)
    expect(fake.activations[0]?.request).not.toHaveProperty('outputSchema')
    expect(fake.activations[0]?.request.prompt[0]?.text).not.toContain('<output_document>')
    runner.cancel('skill-card')
  })

  it('carries the row it was given into the prompt', async () => {
    // The route is a process boundary, so what it forwards has to be what it received:
    // the confirmation panel's guarantee ends in the child's prompt, not at the wire.
    const row = { task_number: 'CP-2025-001', task_status: 1 }
    const { run: handle, fake, runner } = runtime({ outcomes: ['hang'] })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'bare', skill: 'git-repo' },
      payload: row,
    })))
    expect(response.statusCode).toBe(202)
    const prompt = fake.activations[0]?.request.prompt[0]?.text ?? ''
    expect(prompt).toContain(`<row_data>\n${JSON.stringify(row, null, 2)}\n</row_data>`)
    runner.cancel('skill-card')
  })

  it('refuses a row that is not an object', async () => {
    const { run: handle, fake } = runtime()
    for (const payload of [[], 'text', 7, null, true]) {
      const response = await run(handle, at(RUN_PATH, 'POST', runBody({ payload })))
      expect(response.statusCode).toBe(400)
      expect(JSON.parse(response.body).error.message).toBe('payload must be an object')
    }
    expect(fake.activations).toEqual([])
  })

  it('reports the run state once the child settles', async () => {
    const { run: handle, runner } = runtime({
      outcomes: [{ output: [{ type: 'text', text: 'ok' }], stopReason: 'completed', structured: { branch: 'main' } }],
    })
    await run(handle, at(RUN_PATH, 'POST', runBody()))
    await vi.waitFor(() => { expect(runner.state('skill-card')?.phase).toBe('settled') })

    const response = await run(handle, at(`${RUN_PATH}?cardId=skill-card`))
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.apiVersion).toBe(1)
    expect(body.state.phase).toBe('settled')
    expect(body.state.result.structured).toEqual({ branch: 'main' })
  })

  it('accepts a refine run and tells the child what to revise', async () => {
    // The template is the card's stored one, so the request only names the change and the
    // HTML it starts from.
    const { run: handle, fake, runner } = runtime({ outcomes: ['hang'] })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'refine', instruction: '按时间倒序', previous: '<b>旧</b>' },
    })))
    expect(response.statusCode).toBe(202)
    const prompt = fake.activations[0]?.request.prompt[0]?.text ?? ''
    expect(prompt).toContain('<previous_result>\n<b>旧</b>\n</previous_result>')
    expect(prompt).toContain('<revision_request>\n按时间倒序\n</revision_request>')
    expect(fake.activations[0]?.request.outputSchema).toEqual({ type: 'object', properties: {} })
    runner.cancel('skill-card')
  })

  it('rejects a refine mode outside the contract', async () => {
    const { run: handle, fake } = runtime()
    const cases: readonly { readonly mode: Record<string, unknown>; readonly message: string }[] = [
      {
        mode: { kind: 'refine', previous: 'x' },
        message: 'mode.instruction must be a non-empty string',
      },
      {
        mode: { kind: 'refine', instruction: '   ', previous: 'x' },
        message: 'mode.instruction must be a non-empty string',
      },
      {
        mode: { kind: 'refine', instruction: 'x'.repeat(WORKBENCH_REFINE_INSTRUCTION_MAX_LENGTH + 1), previous: 'x' },
        message: 'mode.instruction is longer than the limit',
      },
      {
        mode: { kind: 'refine', instruction: 'x' },
        message: 'mode.previous must be a string',
      },
      {
        mode: { kind: 'refine', instruction: 'x', previous: 7 },
        message: 'mode.previous must be a string',
      },
    ]
    for (const item of cases) {
      const response = await run(handle, at(RUN_PATH, 'POST', runBody({ mode: item.mode })))
      expect(response.statusCode, item.message).toBe(400)
      expect(JSON.parse(response.body).error.message).toBe(item.message)
    }
    // A previous result above the byte budget is a size problem, not a malformed request.
    const oversized = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'refine', instruction: 'x', previous: 'x'.repeat(WORKBENCH_REFINE_PREVIOUS_MAX_BYTES + 1) },
    })))
    expect(oversized.statusCode).toBe(413)
    expect(JSON.parse(oversized.body).error.code).toBe('too-large')
    expect(fake.activations).toEqual([])
  })

  it('refuses a refine run for a card with no template', async () => {
    const { run: handle, fake } = runtime({ selection: { skill: 'git-repo', workspace: { path: WORKSPACE_PATH } } })
    const response = await run(handle, at(RUN_PATH, 'POST', runBody({
      mode: { kind: 'refine', instruction: '按时间倒序', previous: '<b>旧</b>' },
    })))
    expect(response.statusCode).toBe(400)
    expect(JSON.parse(response.body).error.code).toBe('template-missing')
    expect(fake.activations).toEqual([])
  })

  it('rejects an unknown card id and reports an unstarted run', async () => {
    const { run: handle } = runtime()
    const badCard = await run(handle, at(`${RUN_PATH}?cardId=Bad`))
    expect(badCard.statusCode).toBe(400)

    const none = await run(handle, at(`${RUN_PATH}?cardId=skill-card`))
    expect(none.statusCode).toBe(404)
    expect(JSON.parse(none.body).error.code).toBe('not-found')
  })

  it('cancels an in-flight run', async () => {
    const { run: handle, runner } = runtime({ outcomes: ['hang'] })
    await run(handle, at(RUN_PATH, 'POST', runBody()))
    const response = await run(handle, at(`${RUN_PATH}?cardId=skill-card`, 'DELETE'))
    expect(response.statusCode).toBe(200)
    await vi.waitFor(() => { expect(runner.state('skill-card')?.phase).toBe('cancelled') })
  })

  it('reports a cancel with nothing in flight', async () => {
    const { run: handle } = runtime()
    const response = await run(handle, at(`${RUN_PATH}?cardId=skill-card`, 'DELETE'))
    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body).error.message).toBe('no run is in flight for this card')
  })
})

describe('workbench skill card directory route', () => {
  /** The path a case asks about; absolute, because the route refuses anything else. */
  const DIRECTORY_PATH = '/repo/project'

  /**
   * Build the directory handler over one probe.
   * @param probe - the answer the Host's filesystem read gives.
   * @param rejection - a fence rejection, when the case is about the fence.
   * @returns the handler and the paths it was asked about.
   */
  function directory(
    probe: WorkbenchDirectoryProbe,
    rejection?: 401 | 403,
  ): { handle: (request: IncomingMessage, response: ServerResponse) => void; asked: string[] } {
    const asked: string[] = []
    const handle = createWorkbenchSkillCardDirectoryHandler({
      statDirectory: async (path) => {
        asked.push(path)
        return await probe(path)
      },
      fence: fence(rejection),
      warn: () => {},
    })
    return { handle, asked }
  }

  it('answers a fenced request without touching the filesystem', async () => {
    const { handle, asked } = directory(async () => ({ exists: true, isDirectory: true, writable: true }), 403)
    const response = await run(handle, at('/api/workbench/skill-card/directory?path=%2Frepo', 'GET'))
    expect(response.statusCode).toBe(403)
    expect(asked).toEqual([])
  })

  it('names the method it serves', async () => {
    const { handle } = directory(async () => ({ exists: true, isDirectory: true, writable: true }))
    const response = await run(handle, at('/api/workbench/skill-card/directory?path=%2Frepo', 'POST'))
    expect(response.statusCode).toBe(405)
    expect(response.headers.get('allow')).toBe('GET')
  })

  it('reports a directory that is there', async () => {
    const { handle, asked } = directory(async () => ({ exists: true, isDirectory: true, writable: true }))
    const response = await run(handle, at(`/api/workbench/skill-card/directory?path=${encodeURIComponent(DIRECTORY_PATH)}`))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      apiVersion: 1,
      path: DIRECTORY_PATH,
      exists: true,
      isDirectory: true,
      writable: true,
    })
    expect(asked).toEqual([DIRECTORY_PATH])
  })

  it('answers a missing path as a state rather than an error', async () => {
    // The client renders "this directory is gone" from the same body it renders "this is
    // fine" from: a missing folder must not arrive as a failed request.
    const { handle } = directory(async () => ({ exists: false, isDirectory: false, writable: false }))
    const response = await run(handle, at(`/api/workbench/skill-card/directory?path=${encodeURIComponent('/gone')}`))
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toMatchObject({ exists: false, isDirectory: false })
  })

  it('refuses a path that is not one absolute path, before reading anything', async () => {
    const { handle, asked } = directory(async () => ({ exists: true, isDirectory: true, writable: true }))
    for (const path of ['relative/dir', '', '.']) {
      const response = await run(handle, at(`/api/workbench/skill-card/directory?path=${encodeURIComponent(path)}`))
      expect(response.statusCode, path).toBe(400)
      expect(JSON.parse(response.body).error.message).toBe('path must be one absolute directory path')
    }
    // A request with no path at all is the same refusal.
    const missing = await run(handle, at('/api/workbench/skill-card/directory'))
    expect(missing.statusCode).toBe(400)
    expect(asked).toEqual([])
  })
})
