export function clientToPercent(e: MouseEvent | TouchEvent, container: HTMLElement) {
  const rect = container.getBoundingClientRect();
  const isTouch = (e as TouchEvent).changedTouches !== undefined;
  const clientX = isTouch ? (e as TouchEvent).changedTouches[0].clientX : (e as MouseEvent).clientX;
  const clientY = isTouch ? (e as TouchEvent).changedTouches[0].clientY : (e as MouseEvent).clientY;
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}
