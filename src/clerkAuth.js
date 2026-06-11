const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
let clerkPromise = null;
const clerkJsUrl = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@6/dist/clerk.browser.js';

export function isClerkConfigured() {
  return Boolean(publishableKey);
}

export async function getClerk() {
  if (!publishableKey) return null;
  if (!clerkPromise) {
    clerkPromise = (async () => {
      if (!window.Clerk) {
        await new Promise((resolve, reject) => {
          const existing = document.querySelector('script[data-clerk-publishable-key]');
          if (existing) {
            existing.addEventListener('load', resolve, { once: true });
            existing.addEventListener('error', reject, { once: true });
            return;
          }

          const script = document.createElement('script');
          script.async = true;
          script.crossOrigin = 'anonymous';
          script.src = clerkJsUrl;
          script.setAttribute('data-clerk-publishable-key', publishableKey);
          script.addEventListener('load', resolve, { once: true });
          script.addEventListener('error', () => reject(new Error('Could not load Clerk JS.')), { once: true });
          document.head.appendChild(script);
        });
      }

      const clerk = window.Clerk;
      await clerk.load();
      return clerk;
    })();
  }
  return clerkPromise;
}

export async function getClerkSessionToken() {
  const clerk = await getClerk();
  if (!clerk?.session) return null;
  return clerk.session.getToken();
}

export async function exchangeCurrentClerkSession(onSessionReady) {
  const clerk = await getClerk();
  if (!clerk?.session) return false;
  const token = await clerk.session.getToken();
  if (!token) return false;
  await onSessionReady(token);
  return true;
}

export async function redirectToClerkSignIn() {
  const clerk = await getClerk();
  if (!clerk) return;
  sessionStorage.setItem('watchtower.clerkRedirectPending', '1');
  const returnUrl = window.location.href;
  await clerk.redirectToSignIn({
    fallbackRedirectUrl: returnUrl,
    signUpFallbackRedirectUrl: returnUrl,
  });
}

export async function watchClerkSession(onSessionReady) {
  const clerk = await getClerk();
  if (!clerk) return null;
  return clerk.addListener(({ session }) => {
    if (!session) return;
    session.getToken()
      .then((token) => token && onSessionReady(token))
      .catch(() => {});
  });
}

export function consumeClerkRedirectPending() {
  const pending = sessionStorage.getItem('watchtower.clerkRedirectPending') === '1';
  if (pending) sessionStorage.removeItem('watchtower.clerkRedirectPending');
  return pending;
}

export async function signOutClerk() {
  if (!publishableKey) return;
  const clerk = await getClerk();
  if (clerk?.session) {
    await clerk.signOut();
  }
}
