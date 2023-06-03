export default (title: string) => {
  const lowercaseTitle = title.toLowerCase();
  const slug = lowercaseTitle
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters (excluding hyphens)
    .replace(/-{2,}/g, '-'); // Remove multiple consecutive hyphens
  return slug;
};
