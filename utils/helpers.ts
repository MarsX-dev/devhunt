export function omit(obj: object, keys: string[]): object {
  return Object.fromEntries(Object.entries(obj).filter(([k, _]) => !keys.includes(k)));
}

export function shuffleToolsBasedOnDate(tools) {
  if (!tools) {
    return [];
  }

  const _copy = Array.from(tools);

  for (let i = 0; i < new Date().getDate(); i++) {
    _copy.unshift(_copy.pop());
  }

  if (_copy.length % 2 === 0 || new Date().getDate() % 2 === 0) {
    _copy.reverse();
  }

  return _copy;
}
