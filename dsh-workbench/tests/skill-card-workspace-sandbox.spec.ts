/**
 * The card's workspace is a directory, not yet a fence.
 *
 * A card records the directory the user picked and refuses to run without one, but a
 * run still executes in the parent session's directory: the execution base is still the
 * subagent seam, whose `cwd` only becomes a `working-directory/change` projection and
 * never moves the file sandbox's root. Both facts were measured against the shipped
 * packages, not read off the source:
 *
 *   - the child's `session.header.cwd` stays the parent's;
 *   - `sandboxPolicy.resolve({ session }).workspaceRoot` stays the parent's;
 *   - `ctx.agents.create({ meta: { cwd } })` *does* persist `meta.cwd` into the header,
 *     and the sandbox root follows it, so that is the route to a real fence.
 *
 * So this file is deliberately skipped rather than passing on the current behaviour: it
 * describes the fence that does not exist yet. **Do not delete it to make a build green,
 * and do not weaken its assertions to whatever the code happens to do** — the assertions
 * are the specification for the next step. When the fence lands, remove the `.skip` and
 * nothing else.
 *
 * ## How to build the fence (a shorter route than swapping the execution base)
 *
 * The obvious plan was to replace `startActivation` with `agents.create` and re-implement
 * prompt delivery, `{html}` capture, the retry and the error attribution. Four attempts
 * at that stalled, which is the right signal: it means rewriting a mature upstream
 * subagent runtime inside this plugin. There is a much smaller route.
 *
 * `childSessionMeta` gives the child its **parent's** header cwd, and the sandbox policy
 * derives `workspaceRoot` from that header. `agents.create({ meta: { cwd } })` sets the
 * header (measured, and re-measured with `parentAgent` supplied: the created agent's
 * cwd and `workspaceRoot` are its own, not the parent's — see
 * `dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`, case [1]). So:
 *
 *   1. create a thin **card agent** per card: `agents.create({ meta: { cwd: workspace } })`
 *   2. start the seam child with `parent: cardAgent` instead of the session's agent
 *   3. the child's header cwd — and therefore its sandbox root — is the card's directory
 *
 * The seam keeps doing prompt delivery, structured capture, retry, cancellation and
 * error attribution. Nothing of that needs re-implementing, and `cwd` does not have to
 * be passed at all.
 *
 * Remaining work: the card agent's lifecycle (lazy create, reuse, dispose when the
 * workspace changes or the card is deleted) and archiving its session once the run
 * settles, so the sidebar stays clean.
 *
 * Still unverified: nothing load-bearing. A seam child parented to a card agent was
 * **measured** to inherit that agent's cwd: `cardSeamChildHeaderIsCardDir` and
 * `cardSeamChildRootIsCardDir` both hold, and the same run still captured
 * `{ html }` through the seam (`dsh-plugin-desktop/scratch/agent-cwd-probe.mjs`, case
 * [5]). Note `agents.create` needs an explicit `sessionId` per card agent.
 *
 * Acceptance criterion 92 pins this same gap from the requirements side.
 */
import { describe, expect, it } from 'vitest'

describe.skip('a card run is fenced to the card\'s workspace', () => {
  it('resolves its sandbox root to the directory the card stored', () => {
    // The fence is the child's session header cwd, and the sandbox policy derives
    // workspaceRoot from it. Asserting the derived root (not the request field) is the
    // point: a request `cwd` can be set and still leave the root on the parent.
    const stored = '/work/card-a'
    const parentProject = '/work/parent'

    // Replace with the real host: create the card's agent with meta.cwd = stored, then
    // read back sandboxPolicy.resolve({ session: agent.session }).workspaceRoot.
    const workspaceRoot = parentProject

    expect(workspaceRoot).toBe(stored)
    expect(workspaceRoot).not.toBe(parentProject)
  })

  it('writes inside the workspace and is refused outside it', () => {
    // The discriminating assertion is the refusal, not the permission: temp directories
    // are always writable under workspace-write, so "a write in the workspace succeeded"
    // proves nothing on its own.
    const insideRefused = false
    const outsideRefused = false

    expect(insideRefused).toBe(false)
    expect(outsideRefused).toBe(true)
  })

  it('archives the session once the run settles', () => {
    // The card's agent owns a session, which would otherwise appear in the sidebar. The
    // product owner chose archiving over mislabelling it as a subagent session.
    const archived = false

    expect(archived).toBe(true)
  })
})
