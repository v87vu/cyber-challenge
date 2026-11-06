export function adminEmails() {
  return new Set([process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}
