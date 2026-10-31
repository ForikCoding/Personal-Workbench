/**
 * Clock readings one card shows about its runs.
 *
 * Every formatter here is written by hand rather than through `toLocaleTimeString` or
 * `toLocaleDateString`: these strings are scanned in columns — a list of run rows, a
 * card's own latest-run line — and a locale that renders a 12-hour clock or reorders a
 * date would change the shape the column is read as.
 *
 * The module exists because two surfaces need the same readings: the result page's run
 * history and the card face. A card face that said "最近 22:47" about a run from last
 * week would be a lie of omission, so both read the same rule from here.
 * @module dsh-workbench/client/skill-card/clock
 */
/**
 * Format one moment as a 24-hour clock time with seconds.
 * @param at - milliseconds since the epoch.
 * @returns `HH:MM:SS` in the browser's own time zone.
 */
export declare function clockText(at: number): string;
/**
 * The day one moment falls on, as a key the history groups by.
 * @param at - milliseconds since the epoch.
 * @returns `YYYY-MM-DD` in the browser's own time zone.
 */
export declare function dayKey(at: number): string;
/**
 * The clock reading one history row shows.
 *
 * The date belongs to the group's heading, so a row carries only the minute its run
 * completed.
 * @param at - milliseconds since the epoch.
 * @returns `HH:MM` in the browser's own time zone.
 */
export declare function runClockText(at: number): string;
/**
 * The moment a card names as its latest run.
 *
 * Today's run needs only its clock, while any earlier run carries its day, because
 * "最近 22:47" about a run from last week would be a lie of omission.
 * @param at - the newest run's completion moment.
 * @returns `HH:MM` for today, `YYYY-MM-DD HH:MM` otherwise.
 */
export declare function latestRunText(at: number): string;
