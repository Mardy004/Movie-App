import { useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import { CloudDownloadIcon } from '../common/Icons.jsx';

/**
 * In-app player for a movie.
 * - mode "file": native <video> served through the backend stream proxy
 *   (Range-enabled, so seeking works) + a download button.
 * - mode "youtube": official trailer embed (the provider only exposes trailers).
 */
export default function WatchModal({ open, onClose, movie, watch }) {
  useEffect(() => {
    if (!open) return undefined;
    return () => undefined; // player unmounts with the modal, stopping playback
  }, [open]);

  const isFile = watch?.mode === 'file';
  const isYouTube = watch?.mode === 'youtube';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={movie?.title || 'Now playing'}
      subtitle={isFile ? 'Streaming from the MovieShow catalogue' : isYouTube ? 'Official trailer' : ''}
    >
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
        {isFile ? (
          <video
            key={watch.src}
            className="aspect-video w-full bg-black"
            src={watch.src}
            controls
            autoPlay
            playsInline
          />
        ) : isYouTube ? (
          <iframe
            key={watch.src}
            className="aspect-video w-full bg-black"
            src={watch.src}
            title={`${movie?.title || 'Movie'} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-center text-sm text-fog-400">
            <span className="text-3xl">🎬</span>
            <p>No video source is attached to this title yet.</p>
            <p className="text-xs text-fog-500">The admin can add one in the dashboard (Video URL field).</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fog-500">
          {isFile
            ? 'Video streams through the MovieShow API with seek support.'
            : isYouTube
              ? 'Trailer plays via YouTube - attach a video file in the admin dashboard to enable full playback and downloads.'
              : ''}
        </p>
        {watch?.downloadUrl ? (
          <a href={watch.downloadUrl} className="btn-accent btn-sm" download>
            <CloudDownloadIcon className="h-4 w-4" />
            Download movie
          </a>
        ) : null}
      </div>
    </Modal>
  );
}
