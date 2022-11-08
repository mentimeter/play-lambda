import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";

export class LogReporter implements Reporter {
  results: TestResult[] = [];
  bucket: string;

  constructor() {
    this.bucket = process.env['PLAY_LAMBDA_TRACE_BUCKET'];
  }

  onTestEnd(_test: TestCase, result: TestResult): void {
    this.results.push(result);
  }

  onEnd(): void {
    if (!this.bucket) {
      console.warn("PLAY_LAMBDA_TRACE_BUCKET is not set, no trace links will be logged");
      return;
    }

    let traceNo = 0;
    this.results.forEach(result => {
      result.attachments.forEach((attachment) => {
        const traceLink = this.getTraceLink(attachment.path);
        console.log(`Trace ${++traceNo}: ${traceLink}`);
      })
    });
  }

  getTraceLink(tracePath: string): string {
    return `https://trace.playwright.dev/?trace=https://${this.bucket}.s3.amazonaws.com/${tracePath}`;
  }
}

export default LogReporter;
