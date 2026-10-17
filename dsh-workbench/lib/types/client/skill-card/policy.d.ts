/**
 * What a card template may and may not contain.
 *
 * One home for the rules the analyser reports and the renderer strips. They have
 * to agree: a rule the analyser missed would be silently removed at render time,
 * which reads to the user as "my template works" until the output is missing.
 * @module dsh-workbench/client/skill-card/policy
 */
/**
 * Why one construct is refused on content grounds.
 *
 * The editor localizes these; nothing here is user-facing copy.
 */
export type WorkbenchContentViolationCode = 'script' | 'event-attribute' | 'unsafe-url' | 'external-element' | 'external-css';
/**
 * Why one element is refused.
 * @param element - the element to judge.
 * @returns the reason, or undefined when the element is allowed.
 */
export declare function forbiddenElementReason(element: Element): WorkbenchContentViolationCode | undefined;
/**
 * Why one attribute is refused.
 * @param name - attribute name.
 * @param value - attribute value.
 * @returns the reason, or undefined when the attribute is allowed.
 */
export declare function forbiddenAttributeReason(name: string, value: string): WorkbenchContentViolationCode | undefined;
/**
 * Whether one CSS source loads something from outside the card.
 * @param text - the CSS source.
 * @returns whether it carries an external reference.
 */
export declare function hasExternalCss(text: string): boolean;
