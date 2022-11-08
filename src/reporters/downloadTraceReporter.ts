import { dirname } from "path";
import { createWriteStream, mkdirSync } from "fs";
import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export class DownloadTraceReporter implements Reporter {
  s3: S3Client;
  bucket: string;

  constructor() {
    const awsRegion = process.env.PLAY_LAMBDA_AWS_REGION ?? "us-east-1";
    this.s3 = new S3Client({ region: awsRegion });
    this.bucket = process.env.PLAY_LAMBDA_TRACE_BUCKET;
  }

  async onTestEnd(_test: TestCase, result: TestResult): Promise<void> {
    await Promise.all(
      result.attachments.map((a) => this.downloadAttachment(a))
    );
  }

  async downloadAttachment(attachment: { path?: string }): Promise<void> {
    if (!attachment.path || !this.bucket) {
      return;
    }
    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: attachment.path,
      })
    );

    mkdirSync(dirname(attachment.path), { recursive: true });

    const streamWriter = createWriteStream(attachment.path);
    //@ts-expect-error Body is a stream
    response.Body.pipe(streamWriter);

    return new Promise<void>((resolve) => {
      streamWriter.on("finish", () => {
        resolve();
      });
      streamWriter.on("error", (err) => {
        console.log(`failed to download ${attachment}, ${err}`);
        resolve();
      });
    });
  }
}

export default DownloadTraceReporter;
