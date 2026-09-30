// utils/lessonMedia.js — optional per-lesson video and "Watch further" cards.
//
// Video is embed-first: a YouTube or Vimeo URL becomes a privacy-friendly
// iframe (the host serves the file and its captions). A direct file URL
// (.mp4/.webm) is supported as a fallback, with a WebVTT captions track.
// Nothing is bundled, downloaded or rehosted here, and nothing autoplays.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

export function youTubeId(url) {
  const m = String(url || '').match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function vimeoId(url) {
  const m = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

/** Normalize a lesson's `video` field; returns null when there's nothing to show. */
export function lessonVideo(lesson) {
  const v = lesson?.video;
  if (!v || !(v.embedUrl || v.src)) return null;
  return v;
}

/**
 * Lesson video field:
 *   video: {
 *     embedUrl:    'https://www.youtube.com/watch?v=…' | 'https://vimeo.com/…',
 *     src:         'https://…/clip.mp4',   // only if not using an embed
 *     captionsUrl: 'https://…/clip.en.vtt', // for `src` files; embeds use the host's captions
 *     title:       'What neutral looks like',
 *     caption:     'Optional one-line note shown under the video'
 *   }
 */
export function renderLessonVideo(lesson) {
  const v = lessonVideo(lesson);
  if (!v) return '';
  const title = esc(v.title || `${lesson.title} video`);
  let player = '';

  const yt = youTubeId(v.embedUrl);
  const vimeo = !yt && vimeoId(v.embedUrl);
  if (yt) {
    // cc_load_policy=1 turns the host's captions on by default.
    const params = 'rel=0&modestbranding=1&playsinline=1&cc_load_policy=1';
    player = `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?${params}" title="${title}"
      loading="lazy" referrerpolicy="strict-origin-when-cross-origin"
      allow="encrypted-media; picture-in-picture; fullscreen"></iframe>`;
  } else if (vimeo) {
    player = `<iframe src="https://player.vimeo.com/video/${vimeo}?dnt=1&texttrack=en" title="${title}"
      loading="lazy" allow="picture-in-picture; fullscreen"></iframe>`;
  } else if (v.src) {
    player = `<video controls playsinline preload="metadata" aria-label="${title}">
      <source src="${esc(v.src)}">
      ${v.captionsUrl ? `<track kind="captions" srclang="en" label="English" src="${esc(v.captionsUrl)}" default>` : ''}
    </video>`;
  } else {
    console.warn(`[lesson ${lesson.id}] video.embedUrl isn't a YouTube or Vimeo link:`, v.embedUrl);
    return '';
  }

  return `
    <div class="lesson-video">${player}</div>
    ${v.caption ? `<p class="lesson-video-caption">${esc(v.caption)}</p>` : ''}
  `;
}

/**
 * "Watch further" — link-out cards to real talks by Trevor Moawad, credited
 * to him and to the channel that published them. Link only: we open YouTube,
 * we never download, rehost, or synthesize his voice or likeness.
 *
 *   watchFurther: [{ youtubeId, title, channel }]
 */
export function renderWatchFurther(lesson) {
  const items = (lesson?.watchFurther || []).filter(w => /^[A-Za-z0-9_-]{11}$/.test(w.youtubeId || ''));
  if (!items.length) return '';
  return `
    <section class="watch-further" aria-label="Watch further">
      <div class="watch-further-label">Watch further</div>
      ${items.map(w => `
        <a class="watch-card" href="https://www.youtube.com/watch?v=${w.youtubeId}"
           target="_blank" rel="noopener noreferrer">
          <img src="https://i.ytimg.com/vi/${w.youtubeId}/mqdefault.jpg" alt="" loading="lazy">
          <div>
            <div class="watch-card-title">${esc(w.title)}</div>
            <div class="watch-card-credit">Trevor Moawad · ${esc(w.channel)} on YouTube</div>
          </div>
        </a>
      `).join('')}
      <p class="watch-further-note">Opens YouTube. Videos belong to their creators.</p>
    </section>
  `;
}
