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
 * are the specification for the next step. When `agents.create({ meta: { cwd } })` and
 * the archived-session lifecycle land, remove the `.skip` and nothing else.
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
