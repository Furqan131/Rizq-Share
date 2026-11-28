const prisma = require('../config/db');
const { deleteImage } = require('../utils/cloudinary');

const HOUR = 60 * 60 * 1000;
const KEEP_DAYS = 30; // how long expired posts are kept before they are deleted

async function runCleanup() {
  const now = new Date();

  // 1. Food nobody collected in time is marked as expired
  const expired = await prisma.foodPost.updateMany({
    where: { status: 'AVAILABLE', expiresAt: { lt: now } },
    data: { status: 'EXPIRED' },
  });

  // 2. Expired posts older than KEEP_DAYS are deleted, together with their photos
  const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * HOUR);
  const old = await prisma.foodPost.findMany({
    where: { status: 'EXPIRED', expiresAt: { lt: cutoff } },
    select: { id: true, imagePublicId: true },
  });
  let removed = 0;
  if (old.length > 0) {
    const result = await prisma.foodPost.deleteMany({ where: { id: { in: old.map((p) => p.id) } } });
    removed = result.count;
    for (const post of old) await deleteImage(post.imagePublicId);
  }

  // 3. Password reset links that ran out are deleted
  await prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } });

  if (expired.count || removed) {
    console.log(`Cleanup: ${expired.count} post(s) marked expired, ${removed} old post(s) deleted`);
  }
  return { expired: expired.count, removed };
}

// Runs shortly after the server starts, then every hour
function startCleanupJob() {
  const safeRun = () => runCleanup().catch((error) => console.error('Cleanup failed:', error.message));
  setTimeout(safeRun, 10 * 1000).unref();
  setInterval(safeRun, HOUR).unref();
}

module.exports = { runCleanup, startCleanupJob };
