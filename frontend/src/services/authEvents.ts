export const authEvents = new EventTarget();
export const triggerLogout = () => authEvents.dispatchEvent(new Event("logout"));
