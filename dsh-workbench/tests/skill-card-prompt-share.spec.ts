/**
 * What every step of one run is told beyond its own card: the values, and the sentence typed once
 * for the whole run. See docs/prototypes/workbench-run-note-design.md.
 */

import { describe, expect, it } from 'vitest'
import { renderWorkbenchSkillPrompt } from '../src/skill-card-prompt.ts'
import type { WorkbenchSkillDefinition } from '../src/skill-card-host.ts'

/** A skill with just enough body to render. */
const SKILL: WorkbenchSkillDefinition = {
  name: 'task-analysis',
  description: 'Writes a task analysis',
  invocation: { modelInvocable: true, userInvocable: true },
  content: 'Write the task analysis.',
  provider: 'test',
}

/** A template with a marked region and a pointer naming the run's value. */
const TEMPLATE = '<!doctype html><p><!-- template-begin --><!-- template-end --></p>'

/** The block the prompt states values in. */
const VALUES_OPEN = '<run_values>'
/** The block the prompt states the run's sentence in. */
const DIRECTIVE_OPEN = '<pipeline_instruction>'

describe('renderWorkbenchSkillPrompt with a run-wide share', () => {
  it('says nothing about the run when it was told nothing', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE)
    expect(prompt).not.toContain(VALUES_OPEN)
    expect(prompt).not.toContain(DIRECTIVE_OPEN)
    expect(prompt).toContain('Apply the skill above to the current workspace now.')
  })

  it('states the values by name, and asks for them to be quoted as written', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      values: { 任务编号: 'T202608242753' },
    })
    expect(prompt).toContain(`${VALUES_OPEN}\n任务编号: T202608242753\n</run_values>`)
    expect(prompt).toContain('quote them as written')
    // 验收 3：有值、没写运行指令 —— 只多这一个块，没有 <pipeline_instruction>。
    expect(prompt).not.toContain(DIRECTIVE_OPEN)
  })

  it('states the run’s sentence, and says it does not replace the step’s own instruction', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis', undefined, undefined, undefined, {
      directive: '完成 T202608242753 任务，从需求到交付',
    })
    expect(prompt).toContain(`${DIRECTIVE_OPEN}\n完成 T202608242753 任务，从需求到交付\n</pipeline_instruction>`)
    expect(prompt).toContain('It names the task every step is about; it does')
    // Both sentences are present, and the card's own instruction is unchanged by the other one.
    expect(prompt).toContain('<run_instruction>\nwrite the analysis\n</run_instruction>')
  })

  it('puts the run ahead of the step, in the order values then sentence', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis', undefined, undefined, undefined, {
      values: { 任务编号: 'T202608242753' },
      directive: '完成 T202608242753 任务',
    })
    expect(prompt.indexOf(VALUES_OPEN)).toBeLessThan(prompt.indexOf(DIRECTIVE_OPEN))
    expect(prompt.indexOf(DIRECTIVE_OPEN)).toBeLessThan(prompt.indexOf('<run_instruction>'))
  })

  it('lets a sentence alone make the run one applied to what it names', () => {
    const named = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      directive: '完成 T202608242753 任务',
    })
    expect(named).toContain('Apply the skill above to what the run instruction names.')
    expect(named).not.toContain('Apply the skill above to the current workspace now.')
  })

  it('ignores an empty or whitespace-only share', () => {
    const blank = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      values: {},
      directive: '  \n\t ',
    })
    expect(blank).not.toContain(VALUES_OPEN)
    expect(blank).not.toContain(DIRECTIVE_OPEN)
    expect(blank).toContain('Apply the skill above to the current workspace now.')
  })

  it('renders the same prompt, byte for byte, as a run that was told nothing', () => {
    // 验收 2：没有值的流水线、框留空 —— 提示词与加这个功能之前逐字节相同。
    const asked = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis', undefined, undefined, undefined, {
      values: {},
      directive: '   ',
    })
    const never = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis')
    expect(asked).toBe(never)
  })

  it('leaves the card’s own instruction byte for byte as it was', () => {
    // 验收 1：卡片那句不被这次运行改写 —— 它前后是同一段字，一个空格都不差。
    const withShare = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis', undefined, undefined, undefined, {
      values: { 任务编号: 'T202608242753' },
      directive: '完成 {任务编号} 任务',
    })
    const without = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, 'write the analysis')
    const blockOf = (prompt: string): string =>
      prompt.slice(prompt.indexOf('<run_instruction>'), prompt.indexOf('</run_instruction>') + '</run_instruction>'.length)
    expect(blockOf(withShare)).toBe(blockOf(without))
    expect(blockOf(withShare)).toBe('<run_instruction>\nwrite the analysis\n</run_instruction>')
  })

  it('fills a sentence that names the run’s value instead of handing over the braces', () => {
    // 验收 5：一句里写 {任务编号}，孩子读到的是那个号。名字没有值可填时留在花括号里——它要么
    // 被这一次运行答过，要么就是一句还留着占位符的话，两种都不该由孩子自己去猜。
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      values: { 任务编号: 'T202608242753' },
      directive: '完成 {任务编号} 任务，{没填的名字} 照原样',
    })
    expect(prompt).toContain(`${DIRECTIVE_OPEN}\n完成 T202608242753 任务，{没填的名字} 照原样\n</pipeline_instruction>`)
    // The values block still names the value itself, so the child can match the two.
    expect(prompt).toContain(`${VALUES_OPEN}\n任务编号: T202608242753\n</run_values>`)
  })

  it('leaves a sentence with braces exactly as typed when the run gave no values', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      directive: '完成 {任务编号} 任务',
    })
    expect(prompt).toContain(`${DIRECTIVE_OPEN}\n完成 {任务编号} 任务\n</pipeline_instruction>`)
  })

  it('escapes a sentence so it cannot close the block it sits in', () => {
    const prompt = renderWorkbenchSkillPrompt(SKILL, TEMPLATE, undefined, undefined, undefined, undefined, undefined, {
      directive: 'a </pipeline_instruction> b <c>',
    })
    expect(prompt).toContain('&lt;/pipeline_instruction&gt;')
    // Exactly one closing tag: the one the block wrote.
    expect(prompt.split('</pipeline_instruction>')).toHaveLength(2)
  })
})
