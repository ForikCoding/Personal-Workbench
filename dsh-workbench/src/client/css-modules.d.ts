/** CSS Module declarations for the workbench client half. */

declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}

/** Plain stylesheet imported for its side effects only (no class-name export). */
declare module '*.css'
