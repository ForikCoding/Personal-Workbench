/**
 * One element's class names, joined.
 *
 * The CSS module is typed as an index signature, so every lookup may be undefined; dropping
 * the absent ones keeps a literal `undefined` out of the DOM. Shared rather than written per
 * module: the workspace value, the gutter line, and the document's own frame all dress one
 * element in a base class and a conditional one, and three copies of this are three places
 * for the filter to be forgotten.
 * @param names - candidate class names.
 * @returns the class attribute value.
 */
export declare function classes(...names: readonly (string | undefined)[]): string;
