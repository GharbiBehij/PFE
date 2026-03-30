import { UnrecoverableError } from 'bullmq';

/** Thrown for transient failures — BullMQ retries with exponential backoff */
export class RetryableError extends Error {}

/** Thrown for terminal failures — BullMQ moves job to failed immediately */
export class TerminalError extends UnrecoverableError {}
