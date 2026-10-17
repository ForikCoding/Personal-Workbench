/**
 * Shared plumbing for the workbench's private same-origin routes.
 *
 * Each route owns its own status codes and error vocabulary; what they share is
 * how a bounded JSON request body is read and how a JSON answer or error is
 * written under the family's no-store policy.
 * @module dsh-workbench/route-io
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
/** Outcome of reading one bounded JSON request body. */
export type JsonBodyResult = {
    readonly status: 'ok';
    readonly value: unknown;
} | {
    readonly status: 'too-large';
} | {
    readonly status: 'invalid';
    readonly reason: string;
};
/**
 * Read a bounded JSON body.
 * @param request - the request to drain.
 * @param maxBytes - cap on the body's byte length.
 * @returns the decoded value, or why the body was refused.
 */
export declare function readJsonBody(request: IncomingMessage, maxBytes: number): Promise<JsonBodyResult>;
/**
 * Send one JSON body with the route family's no-store policy.
 * @param response - the response to write.
 * @param status - HTTP status.
 * @param body - JSON-serializable body.
 */
export declare function sendJson(response: ServerResponse, status: number, body: unknown): void;
/**
 * Send one JSON error.
 *
 * The message is an operator-facing reason and never echoes request data.
 * @param response - the response to write.
 * @param status - HTTP status.
 * @param code - the route family's error code.
 * @param message - reason to report.
 */
export declare function sendError<C extends string>(response: ServerResponse, status: number, code: C, message: string): void;
