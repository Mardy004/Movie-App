import { useCallback, useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorState } from '../common/StateBlocks.jsx';
import { ChatIcon, ReplyIcon, TrashIcon } from '../common/Icons.jsx';

const NAME_KEY = 'movieshow.comment.name';
const EMAIL_KEY = 'movieshow.comment.email';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const timeAgo = (iso) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (seconds >= size) {
      const value = Math.floor(seconds / size);
      return `${value} ${unit}${value > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
};

/**
 * Comment chat for one movie. Guests post with a display name + email;
 * the signed-in admin replies inline and can delete.
 */
export default function CommentSection({ movieId }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setComments(await api.comments.list(movieId));
    } catch (error) {
      setLoadError(error);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      localStorage.setItem(NAME_KEY, name.trim());
      localStorage.setItem(EMAIL_KEY, email.trim());
      const created = await api.comments.add(movieId, { name: name.trim(), email: email.trim(), body });
      setComments((current) => [...current, created]);
      setBody('');
      toast.success('Comment posted');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (commentId) => {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      const updated = await api.comments.reply(movieId, commentId, replyText.trim());
      setComments((current) => current.map((entry) => (entry.id === commentId ? updated : entry)));
      setReplyTo(null);
      setReplyText('');
      toast.success('Reply posted');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (commentId) => {
    try {
      await api.comments.remove(movieId, commentId);
      setComments((current) => current.filter((entry) => entry.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <section className="shell section" aria-label="Comments">
      <div className="card p-6 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-300">
            <ChatIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-fog-50">Comments ({comments.length})</h2>
            <p className="text-xs text-fog-400">Share what you think - a display name and email are required</p>
          </div>
        </div>

        {loadError ? (
          <ErrorState error={loadError} title="Comments unavailable" onRetry={load} />
        ) : loading ? (
          <div className="space-y-3">
            <div className="skeleton h-20 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-fog-400">
            No comments yet. Be the first to review this movie!
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-2xl border border-white/10 bg-ink-800/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-300">
                      {comment.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-fog-50">{comment.name}</p>
                      <p className="text-[11px] text-fog-500">
                        {timeAgo(comment.createdAt)}
                        {comment.email ? ` · ${comment.email}` : ''}
                      </p>
                    </div>
                  </div>
                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="icon-btn h-9 w-9 rounded-xl border-coral-500/40 text-coral-400 hover:bg-coral-500/15"
                      onClick={() => remove(comment.id)}
                      title="Delete comment"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-fog-200">{comment.body}</p>

                {comment.reply ? (
                  <div className="mt-3 rounded-2xl border-l-2 border-brand-400 bg-brand-500/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-300">
                      {comment.reply.by || 'Studio Admin'} · admin reply
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-fog-100">{comment.reply.body}</p>
                  </div>
                ) : null}

                {isAuthenticated ? (
                  replyTo === comment.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        className="field min-h-[70px]"
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Write your reply…"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button type="button" className="btn-primary btn-sm" disabled={busy || !replyText.trim()} onClick={() => sendReply(comment.id)}>
                          Send reply
                        </button>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => setReplyTo(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-400"
                      onClick={() => {
                        setReplyTo(comment.id);
                        setReplyText('');
                      }}
                    >
                      <ReplyIcon className="h-3.5 w-3.5" />
                      Reply as admin
                    </button>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3 border-t border-white/10 pt-5">
          <div className="grid gap-3 sm:grid-cols-[180px,220px,1fr]">
            <label className="block">
              <span className="field-label">Your name</span>
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. MovieFan42"
                maxLength={40}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Email</span>
              <input
                className="field"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                maxLength={254}
                required
              />
            </label>
            <label className="block">
              <span className="field-label">Comment</span>
              <textarea
                className="field min-h-[44px]"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="What did you think of this movie?"
                maxLength={1000}
                required
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={busy || !name.trim() || !EMAIL_RE.test(email.trim()) || !body.trim()}>
              Post comment
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
