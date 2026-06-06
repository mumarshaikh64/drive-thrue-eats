/**
 * Global Image Helper
 * Resolves menu images dynamically using the NEXT_PUBLIC_IMAGE_BASE_URL environment variable.
 * Fallback to the default live domain if not specified.
 */
export function resolveMenuImage(src: string | null | undefined): string {
  if (!src) {
    // Return a default fallback placeholder image
    return 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400';
  }

  // If it's a base64 encoded string (image uploaded via Admin Panel)
  if (src.startsWith('data:image')) {
    return src;
  }

  // Get image base URL from environment variable or default to live website
  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://drive-thrueats.online';

  // For relative paths
  if (src.startsWith('/')) {
    // If it's in the uploads folder, serve it from the local Next.js server/relative path
    if (src.startsWith('/uploads/')) {
      return src;
    }
    // Otherwise, prepend the configured image base URL (e.g. for /admin/oimg/ or /oimg/)
    return `${imageBaseUrl}${src}`;
  }

  // For absolute paths that point to the hardcoded live site, replace with dynamic base URL
  if (src.includes('drive-thrueats.online')) {
    return src.replace(/https?:\/\/drive-thrueats\.online/gi, imageBaseUrl);
  }

  return src;
}
