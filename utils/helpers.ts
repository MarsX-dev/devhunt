export function omit(obj: object, keys: string[]): object {
  return Object.fromEntries(Object.entries(obj).filter(([k, _]) => !keys.includes(k)));
}

export function groupBy(array, callbackFn) {
  return array.reduce((res, item) => {
    const key = callbackFn(item);
    (res[key] = res[key] || []).push(item);
    return res;
  }, {});
}

export function groupByWithRef(array, callbackFn, refGetter) {
  return array.reduce((res, item) => {
    const key = callbackFn(item);

    if (!res[key]) {
      res[key] = {
        ref: refGetter(item),
        items: []
      };
    }

    res[key].items.push(item);

    return res;
  }, {});
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
