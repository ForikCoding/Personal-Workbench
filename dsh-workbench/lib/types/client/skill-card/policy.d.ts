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
 * Which half of a card's markup is being judged.
 *
 * The two halves are authored by different parties, so they do not share one rule set. A
 * template is the user's own document and its script is the user's own code: that code runs,
 * because a card that reads a directory has to be written somewhere. The region is what a
 * model fills on every run, and it is text: a `script` a model wrote is never executed, so it
 * is refused rather than stored as a construct that looks like behaviour and is not.
 */
export type WorkbenchPolicyScope = 'template' | 'region';
/**
 * Why one element is refused.
 * @param element - the element to judge.
 * @param scope - which half of the document it sits in; a template's own script is allowed.
 * @returns the reason, or undefined when the element is allowed.
 */
export declare function forbiddenElementReason(element: Element, scope?: WorkbenchPolicyScope): WorkbenchContentViolationCode | undefined;
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
