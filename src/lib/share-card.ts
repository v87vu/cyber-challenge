export type ShareCardData = {
  title: string;
  score: number;
  total: number;
  stars: number;
  badges: string[];
};

const SITE_URL = 'cyber-challenge-v2.vercel.app';
const FILE_NAME = 'digital-awareness-achievement.png';

export async function createShareCard(data: ShareCardData): Promise<Blob> {
  const cairo = getComputedStyle(document.documentElement).getPropertyValue('--font-ar').trim() || 'Cairo';
  await document.fonts.load(`900 64px ${cairo}`);
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');

  const background = context.createLinearGradient(0, 0, 1080, 1350);
  background.addColorStop(0, '#e8f6ff');
  background.addColorStop(0.55, '#ffffff');
  background.addColorStop(1, '#fff1c7');
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1350);

  context.fillStyle = '#ffffff';
  context.fillRect(90, 150, 900, 1010);
  context.fillStyle = '#2fa96a';
  context.fillRect(90, 150, 900, 18);

  context.direction = 'rtl';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#12283f';
  context.font = `900 72px ${cairo}`;
  context.fillText('تحدي الوعي الرقمي', 540, 290);

  context.fillStyle = '#c88a00';
  context.font = `900 88px ${cairo}`;
  context.fillText(data.title, 540, 455);

  context.fillStyle = '#1c7d4d';
  context.font = `900 112px ${cairo}`;
  context.fillText(`${data.score} / ${data.total}`, 540, 650);

  context.fillStyle = '#775000';
  context.font = `900 72px ${cairo}`;
  context.fillText(`★ ${data.stars}`, 540, 790);

  const badges = Array.from(new Set([...data.badges, '🏆', '⭐'])).slice(0, 3);
  context.font = `700 84px ${cairo}`;
  context.fillText(badges.join(' '), 540, 940);

  context.direction = 'ltr';
  context.fillStyle = '#46617c';
  context.font = `700 38px ${cairo}`;
  context.fillText(SITE_URL, 540, 1090);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create the share card'));
    }, 'image/png');
  });
}

export async function shareAchievement(data: ShareCardData) {
  const blob = await createShareCard(data);
  const file = new File([blob], FILE_NAME, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: 'تحدي الوعي الرقمي', files: [file] });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = FILE_NAME;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
