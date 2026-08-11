export async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
      console.log("Service Worker unregistered.");
    } catch (error) {
      console.warn("Service Worker cleanup failed:", error);
    }
  }
}
