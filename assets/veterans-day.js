(() => {
  const expiry = Date.parse('2026-11-12T00:00:00-05:00');
  const refresh = () => { if (Date.now() >= expiry) window.location.reload(); };
  // Refresh already-open tabs too; the server serves the ordinary homepage after expiry.
  setTimeout(refresh, Math.max(0, expiry - Date.now()) + 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
