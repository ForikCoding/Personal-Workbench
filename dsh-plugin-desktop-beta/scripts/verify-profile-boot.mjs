/** Headless smoke for the complete published DSH Web profile and renderer manifest. */

import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir, userInfo } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { boot } from '@deepseek-ai/dsh-app-boot'
import { provideCmdline } from '@deepseek-ai/dsh-cmdline'
import {
  createLaunchEnvironmentSnapshot,
  DSH_LAUNCH_ENVIRONMENT_KEY,
} from '@deepseek-ai/dsh-launch-environment'
import { installDesktopPnpmRuntime } from '../lib/desktop-runtime-environment.js'
import { installProfilePackageResolver } from '../lib/module-resolution.js'
import { DesktopPluginPackages } from '../lib/plugin-packages.js'
import { prepareDesktopProfile } from '../lib/profile.js'
import { DesktopProfileService } from '../lib/profile-service.js'
import { createDesktopProfileBoot } from '../lib/profile-context.js'

/** Loader entry id of the Desktop shell row, which 0.1.7 uses as its settings namespace. */
const DESKTOP_SETTINGS_ENTRY_ID = 'desktop-shell'
/**
 * The Desktop row as the profile's own patch layer carries it.
 *
 * 0.1.7 keeps persisted settings in that layer, so every write to the document
 * has to restate this entry: a real settings edit rewrites the document around
 * the rows it does not touch, it does not replace them.
 */
const DESKTOP_SHELL_PATCH_ENTRY = Object.freeze({
  id: DESKTOP_SETTINGS_ENTRY_ID,
  name: 'dsh-plugin-desktop-beta',
  config: Object.freeze({ mode: 'advanced' }),
})

const BIN_NAME = 'dsh-plugin-desktop-profile-smoke'
const HOST_SERVICE_PLUGIN_NAME = 'dsh-desktop-host-services-smoke-plugin'
const HOST_SERVICE_PROBE_KEY = 'desktopHostServiceProbe'
let ordinaryBrowserEnabled = false
const BROWSER_ACCESS = Object.freeze({
  get ordinaryBrowserEnabled() { return ordinaryBrowserEnabled },
  rendererHeader: Object.freeze({
    name: 'x-dsh-desktop-renderer',
    value: Buffer.alloc(32, 2).toString('base64url'),
  }),
  setOrdinaryBrowserEnabled(enabled) { ordinaryBrowserEnabled = enabled },
})
const LAN_HTTPS_SNAPSHOT = Object.freeze({
  state: 'inactive',
  actualPort: null,
  addresses: Object.freeze([]),
  caFingerprint: null,
  errorCode: null,
})
const LAN_HTTPS = Object.freeze({
  caCertificate: null,
  attach() {},
  snapshot() { return LAN_HTTPS_SNAPSHOT },
  async setEnabled() { return LAN_HTTPS_SNAPSHOT },
  async stop() { return LAN_HTTPS_SNAPSHOT },
})
const home = mkdtempSync(join(tmpdir(), 'dsh-desktop-profile-'))
let ctx
let releasePackageResolver
let pnpmRuntime
let mountedSpec
let nativeThemeSource = 'system'
const trayItems = []

try {
  // A 0.1.6 harness home: sections keyed by the old settings namespaces, preset
  // choice under the old field name. `prepareDesktopProfile` migrates it in place
  // before the Loader starts; the settings plugin imports it once the Loader has
  // settled, which is strictly after every plugin has mounted.
  writeFileSync(join(home, 'settings.yaml'), [
    'dsh-desktop:',
    '  mode: advanced',
    'agent-presets:',
    '  default: minimal',
    '',
  ].join('\n'))
  // 0.1.7 resolves Desktop's startup mode from the composed `desktop-shell` row --
  // the bundle default under the profile's own patch layer -- not from the harness
  // home document, which by then may already be `settings.yaml.imported`. Seed the
  // patch layer the way that one-shot import leaves it, which is what every boot
  // after the upgrade reads. Without it this smoke would assert the single
  // pre-import boot, where the window necessarily still opens in compatibility.
  writeFileSync(
    prepareDesktopProfile('1', home, 'win32').profile.patchPath,
    JSON.stringify([DESKTOP_SHELL_PATCH_ENTRY]),
  )
  const aaRequested = process.env.DSH_VERIFY_AA === '1'
  const brokenAa = process.env.DSH_VERIFY_AA_BROKEN === '1'
  // A shared AA directory may already contain settings written by a newer channel.
  const aaSettings = {
    uvPath: '', uvPypiIndexUrl: '', uvPythonInstallMirror: '', syncIntervalSeconds: 37,
  }
  if (aaRequested && !brokenAa) {
    // Older releases left an installation projection above the active Profile.
    // Its lexically larger build hash must not override the current AA artifact,
    // including during rc.2's compatibility preflight before Loader starts.
    const aaPackage = '@agents-anywhere/dsh-bridge-next'
    const installedManifest = createRequire(import.meta.url).resolve(`${aaPackage}/package.json`)
    const stalePackage = join(home, 'profiles', 'node_modules', aaPackage)
    mkdirSync(stalePackage, { recursive: true })
    const staleManifest = JSON.parse(readFileSync(installedManifest, 'utf8'))
    staleManifest.version = '0.1.0-dev.0.desktop.ca022d9286dd0.rc4b2a1d2'
    staleManifest.peerDependencies['@deepseek-ai/dsh-session'] = '0.1.5-rc.2'
    writeFileSync(join(stalePackage, 'package.json'), JSON.stringify(staleManifest))
    cpSync(new URL('./cordis.patch.yml', pathToFileURL(installedManifest)), join(stalePackage, 'cordis.patch.yml'))
    mkdirSync(join(stalePackage, 'lib', 'bundled-connector'), { recursive: true })
    writeFileSync(join(stalePackage, 'lib', 'bundled-connector', 'pyproject.toml'), '')
    mkdirSync(join(home, 'aa-smoke-state'))
    writeFileSync(join(home, 'aa-smoke-state', 'connector-settings.json'), JSON.stringify(aaSettings))
  }
  if (brokenAa) {
    const initial = prepareDesktopProfile('1', home, 'win32')
    const brokenPackage = join(initial.profile.dir, 'node_modules', '@agents-anywhere', 'dsh-bridge-next')
    mkdirSync(brokenPackage, { recursive: true })
    writeFileSync(join(brokenPackage, 'package.json'), JSON.stringify({
      name: '@agents-anywhere/dsh-bridge-next', version: '99.0.0',
      dsh: { bundle: { patch: './missing.patch.yml' } },
    }))
  }
  const prepared = prepareDesktopProfile('1', home, 'win32', undefined, undefined, undefined, { aaEnabled: aaRequested })
  if (brokenAa && (!prepared.aaFailure || prepared.aaEnabled)) throw new Error('Broken AA bundle did not fail closed')
  const hostServicePluginDir = join(
    prepared.profile.dir,
    'node_modules',
    HOST_SERVICE_PLUGIN_NAME,
  )
  mkdirSync(join(prepared.profile.dir, 'node_modules'), { recursive: true })
  cpSync(
    fileURLToPath(new URL('../tests/fixtures/desktop-host-services-smoke-plugin/', import.meta.url)),
    hostServicePluginDir,
    { recursive: true, force: false, errorOnExist: true },
  )
  prepared.overlays = [
    { insert: [{ id: 'desktop-host-services-smoke-plugin', name: HOST_SERVICE_PLUGIN_NAME }] },
    // The smoke's explicit Profile home must also own account credentials.
    { id: 'credentials', config: { dshHome: home } },
    // Isolate the bridge from the operator's real AA account on every reload.
    ...(prepared.aaEnabled ? [{ id: 'agents-anywhere-bridge-next', config: {
      dshHome: home, stateRoot: join(home, 'aa-smoke-state'), uvPath: 'uv',
    } }] : []),
  ]
  const patches = [...prepared.patches, ...prepared.overlays]
  const packageRoot = new URL('../', import.meta.url)
  const pnpmBinPath = fileURLToPath(new URL('node_modules/pnpm/bin/pnpm.mjs', packageRoot))
  const electronVersion = JSON.parse(
    readFileSync(new URL('node_modules/electron/package.json', packageRoot), 'utf8'),
  ).version
  pnpmRuntime = installDesktopPnpmRuntime({
    platform: process.platform,
    appExecutable: process.execPath,
    pnpmBinPath,
    electronVersion,
    stateDir: join(home, 'runtime-commands'),
    environment: process.env,
  })
  releasePackageResolver = installProfilePackageResolver(prepared.bareModuleBaseUrl)
  const runtime = {
    platform: 'win32',
    locale: 'en',
    updates: {
      isPackaged: false,
      canDownload: true,
      currentVersion: '2.0.0',
      statePath: join(home, 'update-state.json'),
      request: async () => { throw new Error('profile smoke must not perform update requests') },
      confirmDownload: async () => false,
      showManualCheckResult: async () => {},
      downloadAndOpen: async () => {},
      notify: () => {},
    },
    schedule(spec) {
      mountedSpec = spec
      return async () => {}
    },
    async mountScheduled() {
      if (mountedSpec === undefined) throw new Error('desktop shell was not registered')
      runtime.setLocalePreference(mountedSpec.readLocalePreference())
      nativeThemeSource = mountedSpec.readThemeSource()
    },
    show() {},
    registerTrayItem(item) {
      trayItems.push(item)
      return {
        refresh() {},
        dispose() {
          const index = trayItems.indexOf(item)
          if (index >= 0) trayItems.splice(index, 1)
        },
      }
    },
    openTerminal() {},
    setLocalePreference(preference) { runtime.locale = preference ?? 'en' },
    setThemeSource(source) { nativeThemeSource = source },
    async requestRestart() {},
    prepareToQuit() {},
  }
  const pnpmBootstrap = {
    activeProfileName: 'desktop',
    activeProfileDir: prepared.profile.dir,
    homeDir: prepared.homeDir,
    appExecutable: process.execPath,
    pnpmBinPath,
    electronVersion,
    nodeBinDir: pnpmRuntime.nodeBinDir,
    nodeShimPath: pnpmRuntime.nodeShimPath,
    clearEnvironmentPath: pnpmRuntime.clearEnvironmentPath,
    dshBootstrapPath: fileURLToPath(new URL('../lib/desktop-cli.js', import.meta.url)),
  }
  const profileBoot = createDesktopProfileBoot(prepared, pnpmBootstrap)
  ctx = await boot(
    BIN_NAME,
    prepared.rootConfig,
    patches,
    async (host) => {
      profileBoot.prepare(host)
      // Match the public resolver path used by packaged Electron.
      host.loader.internal = undefined
      await host.plugin(DesktopPluginPackages)
      host.provide(DSH_LAUNCH_ENVIRONMENT_KEY, createLaunchEnvironmentSnapshot([]))
      host.provide('desktopBrowserAccess', BROWSER_ACCESS)
      host.provide('desktopLanHttps', LAN_HTTPS)
      host.provide('desktopRuntime', runtime)
      host.provide('desktopPnpmBootstrap', pnpmBootstrap)
      await host.plugin(DesktopProfileService, {
        current: {
          name: 'desktop',
          dir: prepared.profile.dir,
        },
        list: () => [{
          name: 'desktop',
          dir: prepared.profile.dir,
          exists: true,
          bundles: prepared.profile.layers.map(layer => layer.packageName),
          webCapable: true,
        }],
        persistSelection: () => {},
        requestRestart: () => {},
      })
      provideCmdline(host, {
        args: ['--host', '127.0.0.1', '--port', '0'],
        exit: () => {},
      })
    },
    prepared.bareModuleBaseUrl,
  )
  profileBoot.markReady()
  await runtime.mountScheduled()

  if (ctx.get('desktopPnpm') === undefined) {
    throw new Error('assembled desktop profile is missing the desktop pnpm Host capability')
  }
  if (ctx.desktopProfiles.current.name !== 'desktop'
    || ctx.desktopProfiles.current.dir !== prepared.profile.dir) {
    throw new Error('assembled desktop profile service has the wrong active identity')
  }
  const agentPresets = ctx.get('agentPresets')
  if (agentPresets === undefined) {
    throw new Error('assembled Windows profile is missing the agent preset roster')
  }
  const presetIds = (await agentPresets.list()).map(preset => preset.id)
  if (!presetIds.includes('minimal') || !presetIds.includes('standard')) {
    throw new Error(`assembled Windows profile exposes unexpected presets: ${presetIds.join(', ')}`)
  }
  // The legacy import runs off `loader.await()`, so the preset choice lands after
  // this profile has finished mounting. Waiting for it here is what proves the
  // section and field renames reached a namespace the settings service accepts.
  const importDeadline = Date.now() + 15_000
  while (agentPresets.defaultId !== 'minimal' && Date.now() < importDeadline) await delay(50)
  if (agentPresets.defaultId !== 'minimal') {
    throw new Error(`assembled Windows profile selected unexpected default ${agentPresets.defaultId}`)
  }
  const minimalPreset = await agentPresets.resolve('minimal')
  if (minimalPreset.id !== 'minimal') {
    throw new Error(`assembled Windows profile remapped minimal preset to ${minimalPreset.id}`)
  }
  if (ctx.get('pluginManager') === undefined) {
    throw new Error('Desktop Profile did not activate the official plugin manager')
  }
  // Resolve AND mount Creator: discovery alone cannot catch missing Host services.
  // 0.1.7 replaced `standingKeyFor` with `acquireScope`, a disposable revision
  // lease: the composition is mounted at registration and the lease still throws
  // `agent-preset/invalid` when that mount is unusable, which is what we assert.
  await (await agentPresets.acquireScope('cordis'))[Symbol.asyncDispose]()
  if ((await ctx.get('pluginManager').listPlugins()).length === 0) {
    throw new Error('Official plugin manager cannot inspect the Desktop composition')
  }
  // The official metadata reader must reach installation packages through the Desktop resolver.
  const inspectorMeta = ctx.get('pluginPackages')?.metaOf('@deepseek-ai/dsh-experimental-inspector', ctx.baseUrl)
  if (typeof inspectorMeta?.title !== 'object' || inspectorMeta.error !== undefined) {
    throw new Error(`Official plugin metadata is unavailable to the Desktop Host: ${JSON.stringify(inspectorMeta)}`)
  }
  // Exercise the actual Profile watcher twice, rather than invoking our reader
  // directly. Both generations must preserve the Desktop layers and fixture.
  const reloadProbePath = join(home, 'reload-probe.mjs')
  writeFileSync(reloadProbePath, "export function apply(ctx, config) { ctx.provide('desktopReloadProbe', config.value) }\n")
  for (const value of [1, 2]) {
    writeFileSync(prepared.profile.patchPath, JSON.stringify([DESKTOP_SHELL_PATCH_ENTRY, { insert: [{
      id: 'desktop-reload-probe', name: pathToFileURL(reloadProbePath).href, config: { value },
    }] }]))
    const deadline = Date.now() + 15_000
    while (ctx.get('desktopReloadProbe') !== value && Date.now() < deadline) await delay(50)
    if (ctx.get('desktopReloadProbe') !== value) {
      throw new Error(`Profile HMR failed to activate generation ${value}`)
    }
  }
  if (ctx.get('desktopRuntime') !== runtime || ctx.get('pluginManager') === undefined) {
    throw new Error('Profile reload lost Desktop or plugin-manager services')
  }
  await (await ctx.agentPresets.acquireScope('cordis'))[Symbol.asyncDispose]()
  const hostServiceProbe = ctx.get(HOST_SERVICE_PROBE_KEY)
  if (hostServiceProbe?.current?.name !== 'desktop'
    || hostServiceProbe.current.dir !== prepared.profile.dir
    || hostServiceProbe.pnpm?.serviceName !== 'desktopPnpm'
    || hostServiceProbe.pnpm.lookupRun !== 'function'
    || hostServiceProbe.pnpm.run !== 'function') {
    throw new Error(
      `profile-local Host service plugin produced an unexpected probe: ${JSON.stringify(hostServiceProbe)}`,
    )
  }

  const picker = ctx.directoryPicker.capability()
  if (picker.kind !== 'browse') {
    throw new Error(`assembled Windows profile selected ${picker.kind} directory picker`)
  }
  const listing = await picker.list(home)
  if (listing.path !== home) {
    throw new Error(`assembled Windows browse picker listed ${listing.path} instead of ${home}`)
  }

  const expectedUrl = `http://127.0.0.1:${String(ctx.webServer.port)}/?dsh-desktop-mode=advanced&dsh-desktop-platform=win32&dsh-desktop-version=2.0.0&dsh-desktop-material=off`
  if (mountedSpec?.url !== expectedUrl) {
    throw new Error(`desktop plugin produced an unexpected renderer URL: ${String(mountedSpec?.url)}`)
  }
  if (mountedSpec?.mode !== 'advanced') {
    throw new Error(`desktop plugin produced an unexpected shell mode: ${String(mountedSpec?.mode)}`)
  }
  if (mountedSpec?.rendererAccessHeader !== BROWSER_ACCESS.rendererHeader) {
    throw new Error('assembled profile did not preserve the launcher browser capability')
  }
  if (nativeThemeSource !== 'system') {
    throw new Error(`desktop plugin produced an unexpected native theme source: ${nativeThemeSource}`)
  }
  // 0.1.7 keys live configuration by Loader entry id and serves it from the
  // describe face; `settings.get(namespace)` was the 0.1.5 surface.
  const desktopSettings = ctx.settings.describe()
    .find(entry => String(entry.ns) === DESKTOP_SETTINGS_ENTRY_ID)?.value
  if (desktopSettings?.mode !== 'advanced') {
    throw new Error('assembled Host settings are missing the advanced desktop-shell mode')
  }
  if (!trayItems.some(item => item.label() === 'Check for Updates…')) {
    throw new Error('assembled desktop profile is missing the update tray command')
  }
  if (process.platform !== 'linux'
    && !trayItems.some(item => item.label() === 'Open DSH Terminal')) {
    throw new Error('assembled desktop profile is missing the terminal tray command')
  }
  const profileMenu = trayItems.find(item => item.label() === 'Profile: desktop')
  if (profileMenu?.submenu?.()[0]?.label() !== 'desktop') {
    throw new Error('assembled desktop profile is missing the active profile tray submenu')
  }
  const unauthenticated = await fetch(expectedUrl, {
    headers: {
      [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value,
    },
  })
  await unauthenticated.body?.cancel()
  if (unauthenticated.status !== 401) {
    throw new Error(
      `assembled Web root accepted a renderer without browser authentication: HTTP ${String(unauthenticated.status)}`,
    )
  }
  if (typeof mountedSpec?.authenticationUrl !== 'string') {
    throw new Error('desktop plugin did not provide an authentication URL')
  }
  const authenticationUrl = new URL(mountedSpec.authenticationUrl)
  const rendererUrl = new URL(expectedUrl)
  const authenticationTokens = authenticationUrl.searchParams.getAll('token')
  if (authenticationUrl.origin !== rendererUrl.origin
    || authenticationUrl.pathname !== '/'
    || authenticationUrl.hash !== ''
    || [...authenticationUrl.searchParams.keys()].some(key => key !== 'token')
    || authenticationTokens.length !== 1
    || !/^[A-Za-z0-9_-]{43}$/u.test(authenticationTokens[0])) {
    throw new Error(`desktop plugin produced an invalid authentication URL: ${authenticationUrl.href}`)
  }
  const exchange = await fetch(authenticationUrl, {
    headers: {
      [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value,
    },
    redirect: 'manual',
  })
  await exchange.body?.cancel()
  // 0.1.7 redirects document-relative (`./`, `dsh-client-connection/lib/index.js:405`)
  // rather than to the site root, so the exchange survives a mounted base path.
  if (exchange.status !== 303 || exchange.headers.get('location') !== './') {
    throw new Error(
      `browser authentication exchange returned HTTP ${String(exchange.status)} instead of a document-relative redirect`,
    )
  }
  const setCookie = exchange.headers.get('set-cookie')
  const cookie = setCookie?.split(';', 1)[0]
  if (cookie === undefined || cookie.length === 0) {
    throw new Error('browser authentication exchange did not mint a cookie')
  }
  const response = await fetch(expectedUrl, {
    headers: {
      [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value,
      Cookie: cookie,
    },
  })
  const html = await response.text()
  if (process.argv.includes('--onboarding')) {
    const { verifyDesktopOnboardingBrowser } = await import('../../scripts/verify-desktop-onboarding-browser.mjs')
    await verifyDesktopOnboardingBrowser({
      url: expectedUrl, cookie,
      headers: { [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value },
    })
  }
  if (response.status !== 200) {
    throw new Error(`assembled Web root returned HTTP ${String(response.status)}`)
  }
  const bootMatch = html.match(/(?:window\.__DSH_BOOT__|globalThis\["__DSH_BOOT__"\]) = (\{.*?\})<\/script>/u)
  if (bootMatch?.[1] === undefined) {
    throw new Error('assembled Web root is missing window.__DSH_BOOT__')
  }
  const graph = JSON.parse(bootMatch[1])
  const ids = new Set(graph.entries.map(entry => entry.id))
  const aaEnabled = aaRequested && !brokenAa
  if (ids.has('@agents-anywhere/dsh-bridge-next') !== aaEnabled) throw new Error('AA client graph does not match explicit selection')
  if (aaEnabled && (!ctx.get('agentsAnywhereRuntime') || !ctx.get('agentsAnywhereOnboarding'))) {
    throw new Error('AA Host services did not activate in the actual Desktop profile')
  }
  if (aaEnabled) {
    // AA 2.0.3 publishes one fixed per-user rendezvous that DSH_HOME does not
    // move, so the isolated Profile home is not where the Connector looks.
    const endpoint = join(userInfo().homedir, '.agents-anywhere', 'dsh-bridge', 'endpoint.json')
    const runtimeStatus = ctx.get('agentsAnywhereRuntime').status()
    if (runtimeStatus.state !== 'ready') {
      throw new Error(`AA local runtime is ${String(runtimeStatus.state)}: ${String(runtimeStatus.message)}`)
    }
    if (!existsSync(endpoint)) throw new Error('AA did not publish its per-user bridge endpoint')
    if (JSON.parse(readFileSync(endpoint, 'utf8')).pid !== process.pid) {
      throw new Error('AA bridge endpoint belongs to another process; quit any running Desktop with AA enabled')
    }
    const snapshot = await ctx.get('agentsAnywhereOnboarding').inspect()
    if (snapshot.account) throw new Error('A fresh Profile inherited an AA account')
    for (const [key, value] of Object.entries(aaSettings)) {
      if (snapshot.connector.settings[key] !== value) {
        throw new Error(`AA did not preserve the shared connector setting ${key}`)
      }
    }
    const uvSuffix = join('node_modules', '@dataiku', `uv-${process.platform}-${process.arch}`, 'bin', process.platform === 'win32' ? 'uv.exe' : 'uv')
    if (!snapshot.connector.resolvedUvPath?.endsWith(uvSuffix)) {
      throw new Error('AA must resolve bundled uv instead of falling back to the operator PATH')
    }
    const uvVersion = execFileSync(snapshot.connector.resolvedUvPath, ['--version'], { encoding: 'utf8', timeout: 10_000 })
    if (!/^uv \d+\./u.test(uvVersion)) throw new Error('Bundled AA uv did not return a version')
  }
  for (const id of [
    'dsh-plugin-desktop-beta',
    '@deepseek-ai/dsh-client-file-upload',
    '@deepseek-ai/dsh-client-shortcuts',
    '@deepseek-ai/dsh-client-ui-shortcuts',
    '@deepseek-ai/dsh-client-ui-conversation',
    '@deepseek-ai/dsh-client-ui-sidebar',
    '@deepseek-ai/dsh-client-ui-directory-picker-browse',
    // The workbench is part of the shipped composition on both editions.
    'dsh-workbench',
  ]) {
    if (!ids.has(id)) {
      throw new Error(
        `assembled advanced Web graph is missing ${id}; received ${[...ids].sort().join(', ')}`,
      )
    }
  }
  for (const id of [
    '@deepseek-ai/dsh-client-ui-layout',
    '@deepseek-ai/dsh-client-ui-directory-picker-native',
  ]) {
    if (ids.has(id)) throw new Error(`assembled advanced Web graph unexpectedly includes ${id}`)
  }
  // The workbench Host half has to register the private layout route behind
  // browser authentication, and a patch through it has to reach the layout
  // storage domain on this edition's runtime line.
  const workbenchEntry = graph.entries.find(entry => entry.id === 'dsh-workbench')
  if (workbenchEntry === undefined) {
    throw new Error('assembled advanced Web graph is missing the workbench client row')
  }
  const workbenchOrigin = `http://127.0.0.1:${String(ctx.webServer.port)}`
  const rendererHeaders = {
    [BROWSER_ACCESS.rendererHeader.name]: BROWSER_ACCESS.rendererHeader.value,
    Cookie: cookie,
  }
  const workbenchRoute = await fetch(`${workbenchOrigin}/api/workbench/layout`, { headers: rendererHeaders })
  if (workbenchRoute.status !== 200) {
    throw new Error(`workbench layout route answered HTTP ${String(workbenchRoute.status)}`)
  }
  const workbenchSnapshot = await workbenchRoute.json()
  if (workbenchSnapshot.apiVersion !== 1 || !Array.isArray(workbenchSnapshot.entries)) {
    throw new Error(`workbench layout route returned an unexpected body: ${JSON.stringify(workbenchSnapshot)}`)
  }
  const workbenchProbeId = 'probe-card'
  const workbenchPatch = await fetch(`${workbenchOrigin}/api/workbench/layout`, {
    method: 'PATCH',
    headers: { ...rendererHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      baseRevision: workbenchSnapshot.revision,
      entries: [{ id: workbenchProbeId, position: 1024 }],
    }),
  })
  if (workbenchPatch.status !== 200) {
    throw new Error(`workbench layout write answered HTTP ${String(workbenchPatch.status)}`)
  }
  const workbenchWritten = await workbenchPatch.json()
  if (workbenchWritten.revision === workbenchSnapshot.revision
    || !workbenchWritten.entries.some(entry => entry.id === workbenchProbeId)) {
    throw new Error(`workbench layout write did not commit: ${JSON.stringify(workbenchWritten)}`)
  }
  const workbenchReadBack = await fetch(`${workbenchOrigin}/api/workbench/layout`, { headers: rendererHeaders })
  const workbenchState = await workbenchReadBack.json()
  if (!workbenchState.entries.some(entry => entry.id === workbenchProbeId && entry.position === 1024)) {
    throw new Error(`workbench layout did not survive the round trip: ${JSON.stringify(workbenchState)}`)
  }
  const workbenchClient = await fetch(`${workbenchOrigin}/${workbenchEntry.url}`, { headers: rendererHeaders })
  const workbenchClientBody = await workbenchClient.text()
  if (workbenchClient.status !== 200
    || !workbenchClientBody.includes('window.__ModuleLoader__.load({')
    || !workbenchClientBody.includes('"dsh-workbench"')) {
    throw new Error(`served workbench client bundle is not a Loader factory: HTTP ${String(workbenchClient.status)}`)
  }
  // The skill card half registers its own private route: a read has to answer the
  // contract, and a template write has to survive a round trip through the domain.
  const skillCardRoute = await fetch(`${workbenchOrigin}/api/workbench/skill-card`, { headers: rendererHeaders })
  if (skillCardRoute.status !== 200) {
    throw new Error(`workbench skill card route answered HTTP ${String(skillCardRoute.status)}`)
  }
  const skillCardSnapshot = await skillCardRoute.json()
  if (skillCardSnapshot.apiVersion !== 1
    || !Array.isArray(skillCardSnapshot.cards)
    || !Array.isArray(skillCardSnapshot.results)) {
    throw new Error(`workbench skill card route returned an unexpected body: ${JSON.stringify(skillCardSnapshot)}`)
  }
  const skillCardWrite = await fetch(`${workbenchOrigin}/api/workbench/skill-card`, {
    method: 'PATCH',
    headers: { ...rendererHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      baseRevision: skillCardSnapshot.revision,
      cardId: workbenchProbeId,
      skill: 'probe-skill',
      template: { skill: 'probe-skill', html: '<b>{{probe}}</b>' },
    }),
  })
  if (skillCardWrite.status !== 200) {
    throw new Error(`workbench skill card write answered HTTP ${String(skillCardWrite.status)}`)
  }
  const skillCardReadBack = await fetch(`${workbenchOrigin}/api/workbench/skill-card`, { headers: rendererHeaders })
  const skillCardState = await skillCardReadBack.json()
  const probedCard = skillCardState.cards?.find(card => card.cardId === workbenchProbeId)
  if (probedCard?.skill !== 'probe-skill' || probedCard.template !== '<b>{{probe}}</b>') {
    throw new Error(`workbench skill card did not survive the round trip: ${JSON.stringify(skillCardState)}`)
  }
  // A fenced request must not reach the route at all.
  const skillCardAnonymous = await fetch(`${workbenchOrigin}/api/workbench/skill-card`)
  if (skillCardAnonymous.status !== 403) {
    throw new Error(`unauthenticated workbench skill card read answered HTTP ${String(skillCardAnonymous.status)}`)
  }
  // A booted profile has no session, so it has no live agent. The Desktop layer
  // mounts its own host-plane skill provider precisely so the card's picker has an
  // installed catalog to offer before any session exists; without it the global
  // skill layer is empty and there is no scope to read through.
  const catalogRoute = await fetch(
    `${workbenchOrigin}/api/workbench/skill-card/catalog`,
    { headers: rendererHeaders },
  )
  const catalogBody = await catalogRoute.json().catch(() => ({}))
  if (catalogRoute.status !== 200) {
    throw new Error(
      `workbench skill card catalog answered HTTP ${String(catalogRoute.status)} with no session:`
      + ` ${JSON.stringify(catalogBody)}`,
    )
  }
  if (!Array.isArray(catalogBody.skills) || catalogBody.skills.length === 0) {
    throw new Error(`the skill picker would have offered nothing: ${JSON.stringify(catalogBody)}`)
  }
  // A run still needs the session it will actually execute in, which is what the
  // run route proves when that session was never opened. It runs before the
  // cleanup below, because that cleanup deletes the configured probe card.
  const runRoute = await fetch(`${workbenchOrigin}/api/workbench/skill-card/run`, {
    method: 'POST',
    headers: { ...rendererHeaders, 'content-type': 'application/json' },
    body: JSON.stringify({
      cardId: workbenchProbeId,
      sessionId: 'probe-session',
      outputSchema: { type: 'object', properties: {} },
    }),
  })
  const runState = await runRoute.json()
  if (runRoute.status !== 409 || runState.error?.code !== 'session-not-live') {
    throw new Error(`workbench skill card run answered HTTP ${String(runRoute.status)}: ${JSON.stringify(runState)}`)
  }
  const cancelRoute = await fetch(
    `${workbenchOrigin}/api/workbench/skill-card/run?cardId=${workbenchProbeId}`,
    { method: 'DELETE', headers: rendererHeaders },
  )
  if (cancelRoute.status !== 404) {
    throw new Error(`workbench skill card cancel answered HTTP ${String(cancelRoute.status)} with nothing in flight`)
  }
  // A card is stored data, not a registration, so a profile that earlier runs
  // wrote to carries those cards into this one. Remove them before the browser
  // check: "a fresh install holds only the creation tile" is a precondition the
  // check can only assert on a store it emptied itself.
  const cardSnapshot = await fetch(`${workbenchOrigin}/api/workbench/skill-card`, { headers: rendererHeaders })
  const cardState = await cardSnapshot.json().catch(() => ({}))
  const storedCards = Array.isArray(cardState.cards) ? [...cardState.cards] : []
  for (const card of storedCards) {
    const removal = await fetch(`${workbenchOrigin}/api/workbench/skill-card`, {
      method: 'PATCH',
      headers: { ...rendererHeaders, 'content-type': 'application/json' },
      body: JSON.stringify({ baseRevision: cardState.revision, cardId: card.cardId, remove: true }),
    })
    if (removal.status !== 200) {
      throw new Error(`clearing ${String(card.cardId)} answered HTTP ${String(removal.status)}`)
    }
    // A removal answers with the state it committed, so the next one quotes it.
    cardState.revision = (await removal.json()).revision
  }
  process.stdout.write(
    `verify-profile-boot: workbench row, layout and skill card routes and client bundle passed`
    + ` (${String(catalogBody.skills.length)} installed skills listed with no session,`
    + ` client ${String(workbenchClientBody.length)} chars, revision ${String(workbenchState.revision)})`
    + `; cleared ${String(storedCards.length)} stored workbench cards before the rendered-DOM check\n`,
  )
  if (process.argv.includes('--workbench-browser')) {
    await verifyWorkbenchBrowser(expectedUrl, rendererHeaders, { name: 'desktop-beta' })
  }
  process.stdout.write('verify-profile-boot: Creator, plugin manager and two Profile HMR generations passed\n')
} finally {
  await ctx?.fiber.dispose()
  releasePackageResolver?.()
  pnpmRuntime?.dispose()
  rmSync(home, { recursive: true, force: true })
}

/**
 * Drive a real browser against the booted profile and assert the workbench as
 * the user sees it: the sidebar row between Plugins and the workspace region,
 * the panel it opens, and the card model inside it — a fresh grid holding only
 * the creation tile, the card face, the result page, the configuration page,
 * and physical deletion.
 *
 * A first-launch mask covers the page in a freshly created profile, so every
 * interaction below is dispatched from inside the page rather than through
 * pointer hit testing; that still exercises the product's own event path.
 *
 * This is the only check that observes rendered DOM. It needs the Playwright
 * browser revision pinned by `dsh-desktop-next`; without it the caller must not
 * pass `--workbench-browser`.
 * @param url - renderer URL with the active shell mode query.
 * @param headers - renderer capability header plus the authenticated cookie.
 * @param profile - active profile identity, recorded in the output.
 */
async function verifyWorkbenchBrowser(url, headers, profile) {
  const { chromium } = createRequire(new URL('../../dsh-desktop-next/package.json', import.meta.url))('playwright')
  const browserCache = process.env.PLAYWRIGHT_BROWSERS_PATH
    ?? join(process.env.LOCALAPPDATA ?? join(userInfo().homedir, '.cache'), 'ms-playwright')
  const browserInstalled = existsSync(browserCache)
    && readdirSync(browserCache).some(name => name.startsWith('chromium'))
  if (!browserInstalled) {
    // The rendered-DOM check is opt-in: a machine without the pinned Playwright
    // revision still runs every other assertion in this smoke.
    const message = 'verify-profile-boot: workbench browser check skipped: no Playwright Chromium revision installed'
    if (process.argv.includes('--require-workbench-browser')) throw new Error(message)
    process.stdout.write(`${message}\n`)
    return
  }
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: headers,
    })
    const page = await context.newPage()
    const consoleErrors = []
    const pageErrors = []
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
    page.on('pageerror', error => { pageErrors.push(String(error)) })
    await page.goto(url, { waitUntil: 'load' })
    // The active locale decides the product name of the row and of the page.
    const english = await page.evaluate(() => document.documentElement.lang.startsWith('en'))
    const names = english
      ? {
        plugins: 'Plugins', workbench: 'Workbench',
        createCard: 'Create card', cardTypeSkill: 'Skill card',
        configure: 'Configure', removeCard: 'Delete card', back: 'Back',
        run: 'Run', cardName: 'Card name', preview: 'Preview', deleteCard: 'Delete card',
      }
      : {
        plugins: '插件', workbench: '工作台',
        createCard: '创建卡片', cardTypeSkill: '技能卡片',
        configure: '配置', removeCard: '删除卡片', back: '返回',
        run: '运行', cardName: '卡片名称', preview: '预览', deleteCard: '删除卡片',
      }
    // The two editor fields are located by placeholder, which is their own copy
    // and therefore not part of the label set above.
    const namesText = english
      ? { cardNamePlaceholder: 'Name this card', templatePlaceholder: 'Write this card’s HTML' }
      : { cardNamePlaceholder: '给这张卡起个名字', templatePlaceholder: '用 HTML 写这张卡的样子' }
    // The workspace browser renders its own <nav> after the panel list, so the
    // panel rows are the ones in the sidebar's first navigation element.
    const sidebar = page.locator('nav').first()
    try {
      await sidebar.getByRole('button', { name: names.workbench, exact: true }).waitFor({ timeout: 30_000 })
    } catch (error) {
      const buttons = await page.locator('button').evaluateAll(nodes => nodes.map(node => ({
        label: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? '',
        cls: node.className,
      })))
      const debugShot = join(tmpdir(), `dsh-workbench-${profile.name}-failure.png`)
      await page.screenshot({ path: debugShot })
      process.stdout.write(
        `verify-profile-boot: workbench row missing. buttons=${JSON.stringify(buttons)}\n`
        + `verify-profile-boot: console errors=${JSON.stringify(consoleErrors)}\n`
        + `verify-profile-boot: page errors=${JSON.stringify(pageErrors)}\n`
        + `verify-profile-boot: screenshot ${debugShot}\n`,
      )
      throw error
    }
    const rows = await sidebar.locator('button').evaluateAll(buttons => buttons.map((button) => {
      const title = button.querySelector('span:last-child')
      return (title?.textContent ?? button.getAttribute('aria-label') ?? '').trim()
    }))
    const workbenchIndex = rows.indexOf(names.workbench)
    const pluginsIndex = rows.indexOf(names.plugins)
    if (pluginsIndex === -1 || workbenchIndex === -1 || workbenchIndex < pluginsIndex) {
      throw new Error(`workbench sidebar row is not below Plugins: ${JSON.stringify(rows)}`)
    }
    // A first-launch overlay can cover the sidebar, so the row activation is
    // dispatched directly rather than through pointer hit testing.
    await sidebar.getByRole('button', { name: names.workbench, exact: true })
      .evaluate(node => { node.click() })
    await page.getByRole('heading', { name: names.workbench, exact: true }).waitFor({ timeout: 15_000 })
    // A first-launch notice covers the page with a mask, so a real pointer never
    // reaches the card in a freshly created profile. The clicks below are
    // dispatched from the page instead: that still exercises the card's own event
    // path, including the head action area stopping its click from activating the
    // card, and it is the hit testing — not the wiring — that the overlay blocks.
    const clickButton = async (label) => {
      const clicked = await page.evaluate((wanted) => {
        const node = [...document.querySelectorAll('button')]
          .find(button => (button.textContent ?? '').trim() === wanted)
        if (node === undefined) return false
        node.click()
        return true
      }, label)
      if (!clicked) throw new Error(`no button labelled ${JSON.stringify(label)}`)
    }
    // Clicking a card's body opens what the card presents in full. The heading is
    // the shallowest node that still bubbles into the shell's own click handler,
    // so this observes the product's activation path rather than faking it.
    const clickCardBody = async (cellId = null) => {
      const clicked = await page.evaluate((cell) => {
        const card = cell === null
          ? document.querySelector('[data-card-id]')
          : document.querySelector(`[data-workbench-cell="${cell}"] [data-card-id]`)
        const heading = card?.querySelector('h3')
        if (heading === undefined || heading === null) return false
        heading.click()
        return true
      }, cellId)
      if (!clicked) throw new Error(`no card body was found in ${JSON.stringify(cellId ?? 'the grid')}`)
    }

    /** Click the shell's removal X, which only exists while the card supplies `onRemove`. */
    const clickRemoveX = async () => {
      const clicked = await page.evaluate(() => {
        const node = document.querySelector('[data-workbench-remove]')
        if (node === null) return false
        node.click()
        return true
      })
      if (!clicked) throw new Error('the card shell drew no removal X')
    }

    /** Click one row of an open menu, which is a `role="menuitem"` button. */
    const clickMenuItem = async (label) => {
      const clicked = await page.evaluate((wanted) => {
        const node = document.querySelector('[role="menuitem"]')
        if (node === null) return false
        if ((node.textContent ?? '').trim() !== wanted) return false
        node.click()
        return true
      }, label)
      if (!clicked) {
        const open = await page.evaluate(() =>
          [...document.querySelectorAll('[role="menuitem"]')].map(node => (node.textContent ?? '').trim()))
        throw new Error(`menu item ${JSON.stringify(label)} was not offered; open items ${JSON.stringify(open)}`)
      }
    }

    /**
     * Report a failed step with the page state that explains it.
     *
     * These assertions are load-bearing, so a failure has to name the step and
     * show what the DOM actually held rather than just the selector.
     * @param step - one-based step number.
     * @param description - what the step asserts.
     * @param run - the step body.
     */
    const runStep = async (step, description, run) => {
      try {
        await run()
      } catch (error) {
        const shot = join(tmpdir(), `dsh-workbench-${profile.name}-step-${String(step)}.png`)
        await page.screenshot({ path: shot }).catch(() => {})
        const state = await page.evaluate(() => ({
          cells: [...document.querySelectorAll('[data-workbench-cell]')].map(node => node.getAttribute('data-workbench-cell')),
          buttons: [...document.querySelectorAll('button')].map(node => (node.textContent ?? '').trim() || (node.getAttribute('aria-label') ?? '')),
          menuitems: [...document.querySelectorAll('[role="menuitem"]')].map(node => (node.textContent ?? '').trim()),
          inputs: [...document.querySelectorAll('input, textarea')].map(node => node.getAttribute('placeholder') ?? ''),
          styles: [...document.querySelectorAll('style[data-plugin-css]')].map(tag => tag.dataset.pluginCss ?? ''),
          headings: [...document.querySelectorAll('h1, h2, h3')].map(node => (node.textContent ?? '').trim()),
        }))
        throw new Error(
          `verify-profile-boot: browser step ${String(step)} (${description}) failed: ${String(error?.message ?? error)}\n`
          + `verify-profile-boot: page state=${JSON.stringify(state)}\n`
          + `verify-profile-boot: console errors=${JSON.stringify(consoleErrors)}\n`
          + `verify-profile-boot: page errors=${JSON.stringify(pageErrors)}\n`
          + `verify-profile-boot: screenshot ${shot}\n`,
        )
      }
    }

    /** Skill picker state the configuration step records for the summary line. */
    let picker = null
    // A fresh install stores no card at all: the registered skill card entry is a
    // renderer for a type, not a card, so the grid holds exactly one cell — the
    // creation tile — and nothing has been created yet.
    await runStep(1, 'a fresh grid holds only the creation tile', async () => {
      await page.getByRole('button', { name: names.createCard, exact: true }).waitFor({ timeout: 15_000 })
      const cells = () => page.evaluate(() =>
        [...document.querySelectorAll('[data-workbench-cell]')].map(node => node.getAttribute('data-workbench-cell')))
      if (JSON.stringify(await cells()) !== JSON.stringify(['create'])) {
        throw new Error(`the fresh grid was not creation-tile-only: ${JSON.stringify(await cells())}`)
      }
      if (await page.locator('[data-card-id]').count() !== 0) {
        throw new Error('a card existed before anything was created')
      }
    })
    // Choosing a type is the whole interaction: there is no name field and no
    // confirm button in the tile, so the card has to appear on the click alone.
    await runStep(2, 'choosing a type creates the card immediately', async () => {
      await clickButton(names.createCard)
      await clickMenuItem(names.cardTypeSkill)
      await page.locator('[data-workbench-cell="skill-card-1"]').waitFor({ timeout: 15_000 })
      if (await page.evaluate(() =>
        [...document.querySelectorAll('[data-workbench-cell="create"] input, [data-workbench-cell="create"] textarea')]
          .length !== 0)) {
        throw new Error('the creation tile asked for input; creation is type-only')
      }
    })
    // The face is an index entry: the card name, the skill it runs, and the way
    // into configuration. A run control and a rendered result belong to the
    // full-panel views, so neither may appear here.
    await runStep(3, 'the card face shows name, skill and Configure only', async () => {
      const face = page.locator('[data-workbench-cell="skill-card-1"]')
      if (await page.getByRole('button', { name: names.run, exact: true }).count() !== 0) {
        throw new Error('the card face offered Run; the run control belongs to the result page')
      }
      const faceText = ((await face.textContent()) ?? '').trim()
      const title = ((await face.locator('h3').first().textContent()) ?? '').trim()
      if (title.length === 0) throw new Error(`the card face had no name: ${JSON.stringify(faceText)}`)
      if ((await face.getByRole('button', { name: names.configure, exact: true }).count()) !== 1) {
        throw new Error(`the card face did not offer exactly one Configure control: ${JSON.stringify(faceText)}`)
      }
      if ((await face.getByRole('button', { name: names.removeCard, exact: true }).count()) !== 1) {
        throw new Error(`the card face did not offer the removal X: ${JSON.stringify(faceText)}`)
      }
    })
    // Present is not the same as styled. A client bundle that never installs its
    // stylesheet still renders every element, so only a computed style proves the
    // CSS arrived: the shell's own border is the cheapest such proof.
    const presentation = await page.evaluate(() => {
      const card = document.querySelector('[data-card-id]')
      return {
        styles: [...document.querySelectorAll('style[data-plugin-css]')]
          .map(tag => tag.dataset.pluginCss ?? ''),
        border: card === null ? '0px' : getComputedStyle(card).borderTopWidth,
      }
    })
    if (!presentation.styles.includes('dsh-workbench')) {
      throw new Error(`the workbench client bundle installed no stylesheet: ${JSON.stringify(presentation.styles)}`)
    }
    if (presentation.border === '0px') {
      throw new Error('the skill card rendered unstyled: the workbench stylesheet did not apply')
    }
    // The title, the status, and the card's own controls share one line. Only a real
    // layout engine can see this, and the card once shipped with the three sitting
    // on three different baselines because their boxes have different heights.
    const headerCentres = await page.evaluate(() => {
      const row = document.querySelector('[data-card-id] header > div')
      if (row === null) return null
      return [...row.children].map((node) => {
        const box = node.getBoundingClientRect()
        return Math.round(box.top + box.height / 2)
      })
    })
    if (headerCentres === null || headerCentres.length < 2) {
      throw new Error('the card header row was not found')
    }
    if (Math.max(...headerCentres) - Math.min(...headerCentres) > 1) {
      throw new Error(`the card header items are not on one line: ${JSON.stringify(headerCentres)}`)
    }
    // The creation entry is a grid tile like the cards, so it has to be their height.
    // It does not fill its cell on its own: the menu primitive wraps its anchor.
    const cellHeights = await page.evaluate(() =>
      [...document.querySelectorAll('[data-workbench-cell]')]
        .map(cell => Math.round(cell.getBoundingClientRect().height)))
    if (cellHeights.length < 2) {
      throw new Error(`the grid did not hold a card and the creation entry: ${JSON.stringify(cellHeights)}`)
    }
    if (Math.max(...cellHeights) - Math.min(...cellHeights) > 1) {
      throw new Error(`the grid cells are not the same height: ${JSON.stringify(cellHeights)}`)
    }
    await runStep(4, 'the card body opens the result page where Run lives', async () => {
      await clickCardBody()
      await page.locator('[data-run-status]').waitFor({ timeout: 15_000 })
      const runButton = page.getByRole('button', { name: names.run, exact: true }).first()
      await runButton.waitFor({ timeout: 15_000 })
      if (!await runButton.isDisabled()) {
        throw new Error('the result page offered Run without a template')
      }
      await clickButton(names.back)
    })
    // Configuration is the other full-panel view, and the card's own control must
    // open only it: a button nested in an activatable card would otherwise trigger
    // both views.
    await runStep(5, 'Configure opens the config page with name, skill and template', async () => {
      await page.getByRole('button', { name: names.configure, exact: true }).first().waitFor({ timeout: 15_000 })
      await clickButton(names.configure)
      await page.getByLabel(names.cardName).waitFor({ timeout: 15_000 })
      if (await page.evaluate((wanted) =>
        [...document.querySelectorAll('input')].some(node => node.placeholder === wanted),
      namesText.cardNamePlaceholder) === false) {
        throw new Error('the configuration page had no card-name input')
      }
      // The picker must be usable, not merely present. The catalog belongs to this
      // view, and a view that never asks for it leaves the control disabled with
      // nothing on screen to explain it.
      for (let attempt = 0; attempt < 40; attempt += 1) {
        picker = await page.evaluate(() => {
          const select = document.querySelector('select')
          return select === null ? null : { disabled: select.disabled, options: select.options.length }
        })
        if (picker !== null && !picker.disabled && picker.options >= 2) break
        await page.waitForTimeout(250)
      }
      if (picker === null || picker.disabled || picker.options < 2) {
        throw new Error(`the configuration page offered no usable skill picker: ${JSON.stringify(picker)}`)
      }
      // The template field is identified by the two region markers its own copy
      // names, which is locale-independent, plus a count that keeps the check
      // discriminating: a page with no editor cannot satisfy either.
      const editor = await page.evaluate(() => {
        const areas = [...document.querySelectorAll('textarea')]
        return {
          count: areas.length,
          marked: areas.filter(area => (area.placeholder ?? '').includes('template-begin')
            && (area.placeholder ?? '').includes('template-end')).length,
        }
      })
      if (editor.count !== 1 || editor.marked !== 1) {
        throw new Error(`the configuration page had no template editor: ${JSON.stringify(editor)}`)
      }
      if (await page.getByText(names.preview, { exact: true }).count() === 0) {
        throw new Error('the configuration page had no preview')
      }
      if (await page.getByRole('button', { name: names.deleteCard, exact: true }).count() === 0) {
        throw new Error('the configuration page offered no delete control')
      }
      if (await page.getByRole('button', { name: names.run, exact: true }).count() !== 0) {
        throw new Error('the configuration button opened the result page as well')
      }
      await clickButton(names.back)
    })
    // Removing a card is a physical delete: it takes the card's templates and its
    // result with it, so the grid has to return to the state it started in.
    await runStep(6, 'the X deletes the card and the grid returns to the tile alone', async () => {
      await page.locator('[data-workbench-cell="skill-card-1"]').waitFor({ timeout: 15_000 })
      await clickRemoveX()
      await page.locator('[data-workbench-cell="skill-card-1"]').waitFor({ state: 'detached', timeout: 15_000 })
      const cells = await page.evaluate(() =>
        [...document.querySelectorAll('[data-workbench-cell]')].map(node => node.getAttribute('data-workbench-cell')))
      if (JSON.stringify(cells) !== JSON.stringify(['create'])) {
        throw new Error(`the grid did not return to the creation tile alone: ${JSON.stringify(cells)}`)
      }
    })
    const screenshot = join(tmpdir(), `dsh-workbench-${profile.name}.png`)
    await page.screenshot({ path: screenshot })
    process.stdout.write(
      `verify-profile-boot: workbench rendered in a real browser (${profile.name}, ${english ? 'en' : 'zh'}):`
      + ` panel rows ${JSON.stringify(rows)}, workbench row after plugins,`
      + ` fresh grid creation-tile-only, a chosen type created skill-card-1 with no input,`
      + ` the face offered name + Configure + X and no Run,`
      + ` the body opened the result page with Run disabled for a missing template,`
      + ` Configure opened the config page (name input, picker with`
      + ` ${String((picker?.options ?? 1) - 1)} skills, template editor, preview, delete),`
      + ` styled (border ${presentation.border}, workbench stylesheet installed among`
      + ` ${String(presentation.styles.length)} plugin sheets,`
      + ` header on one line ${JSON.stringify(headerCentres)}, cells ${JSON.stringify(cellHeights)}),`
      + ` the X deleted the card and left the grid creation-tile-only,`
      + ` screenshot ${screenshot}\n`,
    )
  } finally {
    await browser.close()
  }
}
