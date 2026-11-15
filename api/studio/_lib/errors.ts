/**
 * Standalone error type so lightweight handlers (`login`, `callback`, `ping`)
 * can map upstream failures without importing the GitHub adapter or its JSON
 * asset manifest.
 */
export class GitHubApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
  }
}
