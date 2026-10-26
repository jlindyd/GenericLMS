import { Readable } from 'node:stream';
import { connection } from '../../../../../../../platform/config';
import { noStore, serviceFailure, ServiceError } from '../../../../../../../platform/server';
import { cookieNames, isSameOrigin, readAs } from '../../../../../../../platform/session';
import { loadActivityExecution } from '../../../../../../../platform/execution';
import { packageResource, xapiResource } from '../../../../../../../platform/activity';

export const config = { api: { bodyParser: false, responseLimit: false } };
async function requestBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4 * 1024 * 1024) throw new ServiceError('Activity request is too large.', 413);
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
export default async function handler(req, res) {
  noStore(res);
  if (!isSameOrigin(req)) return res.status(403).json({ message: 'Not allowed.' });
  const token = req.cookies?.[cookieNames.access];
  if (!token) return res.status(401).json({ message: 'Sign in to continue.' });
  const controller = new AbortController();
  const abort = () => controller.abort();
  res.once('close', abort);
  const timeout = setTimeout(abort, 90000);
  try {
    const { courseId, lessonId, taskId, path } = req.query;
    const data = await loadActivityExecution(token, courseId, lessonId, taskId);
    if (data.legacy) throw new ServiceError('This task is not a self-paced activity.', 409);
    if (!Array.isArray(path)) throw new ServiceError('Unknown activity request.', 404);
    if (path.length === 1 && path[0] === 'status' && req.method === 'GET') return res.json({ status: data.activity.status, progress: data.course.progress, lessons: data.course.lessons });
    let url, headers = {}, body;
    if (path[0] === 'assets') {
      if (req.method !== 'GET') throw new ServiceError('Method not allowed.', 405);
      url = packageResource(data.activity, path.slice(1)).href;
      if (req.headers.range) headers.Range = req.headers.range;
    } else if (path[0] === 'xapi') {
      url = `${connection.learning}/${xapiResource(taskId, path.slice(1), req.method, req.query)}`;
      headers = { Authorization: `Bearer ${token}`, 'Client-Id': connection.clientId, 'X-Experience-API-Version': req.headers['x-experience-api-version'] || '1.0.3' };
      for (const name of ['if-match', 'if-none-match']) if (req.headers[name]) headers[name] = req.headers[name];
      if (['POST', 'PUT'].includes(req.method)) {
        body = await requestBody(req);
        headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      }
    } else throw new ServiceError('Unknown activity request.', 404);
    const upstream = await fetch(url, { method: req.method, headers, body, cache: 'no-store', redirect: 'error', signal: controller.signal });
    for (const name of ['Content-Type', 'ETag', 'Last-Modified', 'Content-Range', 'Accept-Ranges']) {
      const value = upstream.headers.get(name); if (value) res.setHeader(name, value);
    }
    res.status(upstream.status);
    if (!upstream.body) return res.end();
    await new Promise((resolve, reject) => {
      const stream = Readable.fromWeb(upstream.body);
      stream.once('error', reject); res.once('finish', resolve); res.once('close', resolve); stream.pipe(res);
    });
  } catch (error) {
    if (res.destroyed || res.writableEnded) return;
    if (res.headersSent) res.destroy();
    else serviceFailure(res, error);
  } finally { clearTimeout(timeout); res.removeListener('close', abort); }
}
