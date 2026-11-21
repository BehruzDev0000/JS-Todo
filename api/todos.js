import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import seed from '../db.json' with { type: 'json' };

const path = 'todos.json';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const { method } = req;
  const id = req.query.id;
  const allowed = id ? ['PATCH', 'DELETE'] : ['GET', 'POST'];
  if (!allowed.includes(method)) {
    res.setHeader('Allow', allowed.join(', '));
    return res.status(405).end();
  }
  const { content, isCompleted } = req.body ?? {};
  if ((method === 'POST' || content !== undefined) &&
      (typeof content !== 'string' || !content.trim() || content.length > 2000)) {
    return res.status(400).json({ error: 'Enter 1 to 2000 characters.' });
  }
  if (isCompleted !== undefined && typeof isCompleted !== 'boolean') {
    return res.status(400).end();
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const saved = await get(path, { access: 'private', useCache: false });
    const todos = saved ? await new Response(saved.stream).json() : structuredClone(seed.todos);
    if (method === 'GET') return res.json(todos);
    let item;
    if (method === 'POST') {
      if (todos.length >= 2000) return res.status(409).json({ error: 'List is full.' });
      item = { id: randomUUID(), content: content.trim(), isCompleted: false };
      todos.push(item);
    } else {
      const index = todos.findIndex(todo => String(todo.id) === id);
      if (index < 0) return res.status(404).end();
      item = todos[index];
      if (method === 'DELETE') todos.splice(index, 1);
      else {
        if (content !== undefined) item.content = content.trim();
        if (isCompleted !== undefined) item.isCompleted = isCompleted;
      }
    }
    try {
      await put(path, JSON.stringify(todos), {
        access: 'private', contentType: 'application/json', addRandomSuffix: false,
        allowOverwrite: Boolean(saved), ifMatch: saved?.blob.etag
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError || (!saved && /already exists/i.test(error.message))) continue;
      throw error;
    }
    if (method === 'DELETE') return res.status(204).end();
    return res.status(method === 'POST' ? 201 : 200).json(item);
  }
  return res.status(409).json({ error: 'Concurrent edit. Try again.' });
}
