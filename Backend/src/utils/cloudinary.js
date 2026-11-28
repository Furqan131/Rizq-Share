const { v2: cloudinary } = require('cloudinary');

const photosEnabled = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (photosEnabled()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Uploads an image from memory; photos are shrunk to at most 1200px and optimised
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'rizq-share',
          resource_type: 'image',
          transformation: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      .end(buffer);
  });
}

// Best effort: a failed delete should never break the request
async function deleteImage(publicId) {
  if (!photosEnabled() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Could not delete image', publicId, error.message);
  }
}

// Only accept image links that really point at our own Cloudinary account
function isOurImage(url, publicId) {
  if (!photosEnabled()) return false;
  const prefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
  return (
    typeof url === 'string' &&
    typeof publicId === 'string' &&
    url.length < 500 &&
    url.startsWith(prefix) &&
    publicId.startsWith('rizq-share/') &&
    url.includes(publicId)
  );
}

module.exports = { photosEnabled, uploadBuffer, deleteImage, isOurImage };
