export const csrfToken = () => {
  // Prefer cookie (always fresh — set by Rails after every response)
  const match = document.cookie.match(/CSRF-TOKEN=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);

  // Fallback: meta tag from initial page load
  return document.querySelector('meta[name="csrf-token"]')?.content || "";
};
