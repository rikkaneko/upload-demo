import express from 'express';
import config from './config.js';
import { v4 as uuidv4 } from 'uuid';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SubmissionMeta } from './types.js';

// Create AWS Client
const client = new S3Client({
  endpoint: config.ENDPOINT,
  region: config.REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
});

// Dummy database
// task_id -> Submission
const task = new Map<string, SubmissionMeta[]>();
// file_id -> task_id
const submission = new Map<string, string>();

async function check_file_exist(filename: string): Promise<boolean> {
  const command = new HeadObjectCommand({
    Bucket: config.BUCKET_NAME,
    Key: filename,
  });
  try {
    const _ = await client.send(command);
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException) {
      if (error.$metadata.httpStatusCode === 404) {
        return false;
      }
    }
  }

  return false;
}

const app = express();

app.post('/add_submission', async (req, res) => {
  if (!['user_id', 'task_id'].every((key) => Object.hasOwn(req.query, key))) {
    res.json({
      status: 'error',
      message: 'Requires both User ID and Task ID fields.',
    });
    return;
  }

  const user_id = req.query.user_id as string;
  const task_id = req.query.task_id as string;

  // Generate new file_id
  const file_id = `${task_id}-${uuidv4()}`;

  const command = new PutObjectCommand({
    Bucket: config.BUCKET_NAME,
    Key: file_id,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 1800 });
  const current_time = Date.now();

  const meta: SubmissionMeta = {
    file_id,
    user_id,
    status: 'created',
    create_time: current_time,
    last_update_time: current_time,
  };

  // Insert the record to the database
  if (!task.has(task_id)) {
    task.set(task_id, [meta]);
  } else {
    task.get(task_id)!.push(meta);
  }
  // Keep temp file_id
  submission.set(file_id, task_id);

  res.json({
    status: 'success',
    upload_url: url,
    file_id,
  });
});

app.post('/done_submission', async (req, res) => {
  if (!Object.hasOwn(req.query, 'file_id')) {
    res.json({
      status: 'error',
      message: 'Missing or invalid file_id parameter',
    });
    return;
  }

  const file_id = req.query.file_id as string;

  // Check whether file exist in the database
  if (!submission.has(file_id)) {
    res.json({
      status: 'error',
      message: 'Invalid file_id parameter',
    });
    return;
  }
  const task_id = submission.get(file_id)!;

  // Check if the file exist in the bucket
  if (!(await check_file_exist(file_id))) {
    res.json({
      status: 'error',
      message: `Submission ${file_id} has not finished uploading`,
    });
    return;
  }

  task.get(task_id)!.forEach((value) => {
    if (value.file_id === file_id) {
      value.status = 'uploaded';
      value.last_update_time = Date.now();
      res.json({
        status: 'success',
        message: 'Submission completed',
      });
    }
  });
});

app.get('/list_task', (req, res) => {
  res.json({
    status: 'success',
    task: Object.fromEntries(task),
  });
});

app.get('/get_download_url', async (req, res) => {
  if (!Object.hasOwn(req.query, 'file_id')) {
    res.json({
      status: 'error',
      message: 'Missing or invalid file_id parameter',
    });
    return;
  }

  const file_id = req.query.file_id as string;
  // Check whether file exist in the database
  // if (!submission.has(file_id)) {
  //   res.json({
  //     status: 'error',
  //     message: 'Invalid file_id parameter',
  //   });
  //   return;
  // }

  // Check if the file exist in the bucket
  if (!(await check_file_exist(file_id))) {
    res.json({
      status: 'error',
      message: `Submission ${file_id} does not exist`,
    });
    return;
  }

  const command = new GetObjectCommand({
    Bucket: config.BUCKET_NAME,
    Key: file_id,
  });

  const url = await getSignedUrl(client, command, { expiresIn: 1800 });
  res.json({
    status: 'success',
    url,
  });
});

app.get('/', (_, res) => {
  res.json({
    status: 'success',
    message: 'Service is running.',
  });
});

app.get('*', (req, res) => {
  res.json({
    status: 'error',
    message: `\`${req.path}\` does not found.`,
  });
});

app.listen(8881, () => {
  console.log('Server started at http://localhost:8881');
});
