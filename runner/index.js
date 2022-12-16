const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const util = require("util");
const mime = require("mime-types");
const glob = require("glob");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

function initRunDir(runDir) {
  fs.mkdirSync(runDir);
  fs.symlinkSync(`${process.cwd()}/node_modules`, `${runDir}/node_modules`);
}

function runCmd(command, opts) {
  console.log(`Running command: ${command}, opts: ${opts}`);
  return execSync(command, {
    ...opts,
    shell: "/bin/sh",
  });
}

function getAttachments(runDir) {
  const globDir = `${runDir}/test-results/**`;

  const files = glob.sync(globDir, { nodir: true });
  const randomChars = crypto.randomBytes(10).toString("hex");
  return files.map((f) => {
    const filePath = f.replace(`${runDir}/`, "");
    return {
      file: f,
      bucketKey: `${path.dirname(filePath)}-${randomChars}/${path.basename(
        filePath
      )}`,
    };
  });
}

async function uploadAttachments(attachments) {
  if (!process.env.PLAY_LAMBDA_TRACE_BUCKET) {
    return;
  }

  const awsRegion = process.env.PLAY_LAMBDA_AWS_REGION ?? "us-east-1";

  const s3 = new S3Client({ region: awsRegion });
  const bucket = process.env.PLAY_LAMBDA_TRACE_BUCKET;

  // Upload attachments in parallel, some are ~8MB large
  await Promise.all(
    attachments.map(({ bucketKey, file }) => {
      return s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: bucketKey,
          Body: fs.readFileSync(file),
          ContentType: mime.lookup(file),
        })
      );
    })
  );

  // The tmpfs on lambda may be reused between invocations and has a finite size
  attachments.map(({ file }) => {
    fs.unlink(file, (err) => {
      if (err) {
        console.log(`delete error ${file}, ${err}`);
      }
    });
  });
}

function execErrorResponse(commandDesc, e, attachments = []) {
  console.log("error:");
  console.log(util.inspect(e, false, null, false));
  console.log("attachments:");
  console.log(util.inspect(attachments, false, null, false));

  let out = "";
  let err = "";
  if (e.stdout) {
    out = e.stdout.toString();
  }
  if (e.stderr) {
    err = e.stderr.toString();
  }

  return failResponse(
    `Exec command ${commandDesc} failed: ${e}`,
    out,
    err,
    attachments
  );
}

function successResponse(out, attachments = []) {
  return {
    out,
    attachments,
    success: true,
    reason: "",
    err: "",
  };
}

function failResponse(reason, out, err, attachments = []) {
  return {
    success: false,
    reason,
    out,
    err,
    attachments,
  };
}

const exists = (p) => {
  try {
    fs.statSync(p);
  } catch {
    return false;
  }
  return true;
};

const runPlayLambda = async (event, context) => {
  const runDir = "/tmp/play-run";

  if (!exists(runDir)) {
    initRunDir(runDir);
  }

  if (event.env) {
    for (const [key, value] of Object.entries(event.env)) {
      process.env[key] = value;
    }
  }

  for (const file of event.files) {
    const dir = `${runDir}/${path.dirname(file.name)}`;
    if (!exists(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileBuffer = Buffer.from(file.content, "base64");
    fs.writeFileSync(`${runDir}/${file.name}`, fileBuffer);
  }

  try {
    runCmd("node init-chromium.js", {
      cwd: runDir,
    });
  } catch (execErr) {
    return execErrorResponse("initializing chromium", execErr);
  }

  let commandOut;
  if (!event.command) {
    return failResponse("no command defined", event, "");
  }

  try {
    const commandOutBuf = runCmd(event.command, {
      cwd: runDir,
    });
    commandOut = commandOutBuf.toString();

    // Flaky but successful tests have attachments
    const attachments = getAttachments(runDir);
    try {
      await uploadAttachments(attachments);
    } catch (error) {
      return failResponse("s3 upload error", "", error);
    }
    return successResponse(commandOut, attachments);

  } catch (execErr) {
    // Completely failed tests have non-zero exit code but still have
    // traces
    let attachments = [];
    try {
      attachments = getAttachments(runDir);
      await uploadAttachments(attachments);
    } catch (error) {
      return failResponse(`attachment upload error ${error}`, "", execErr);
    }

    return execErrorResponse(
      `playwright command: ${event.command}`,
      execErr,
      attachments
    );
  } finally {
    // Delete "assumed" env variables so that they dont lie around between runs.
    Object.keys(process.env)
      .filter(
        (key) => key.startsWith("E2E_") || key.startsWith("PLAY_LAMBDA_")
      )
      .forEach((filteredKey) => delete process.env[filteredKey]);
    delete process.env.ENV;
  }
};

module.exports.handler = async (event, context) => {
  return runPlayLambda(event, context);
};
