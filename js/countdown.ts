const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type CountdownState = 'live' | 'soon' | 'final' | 'ended';

function readCountdown(dateString: string): {
  state: CountdownState;
  text: string;
} {
  const remaining = new Date(dateString).getTime() - Date.now();

  if (Number.isNaN(remaining) || remaining <= 0) {
    return { state: 'ended', text: 'Ended' };
  }

  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);

  if (remaining < HOUR) {
    return { state: 'final', text: `⚠ Final hour, ${minutes}m ${seconds}s` };
  }

  if (remaining < DAY) {
    return { state: 'soon', text: `◔ Ending soon, ${hours}h ${minutes}m` };
  }

  return { state: 'live', text: `◷ ${days}d ${hours}h left` };
}

export function paintCountdown(element: HTMLElement): void {
  const { state, text } = readCountdown(element.dataset.endsAt ?? '');
  element.textContent = text;
  element.dataset.countdown = state;
}

export function watchCountdowns(): void {
  const tick = () => {
    document
      .querySelectorAll<HTMLElement>('[data-ends-at]')
      .forEach(paintCountdown);
  };

  tick();
  setInterval(tick, SECOND);
}
