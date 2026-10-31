const canonicalize = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((ordered, key) => {
        ordered[key] = canonicalize(value[key]);
        return ordered;
      }, {});
  }

  return value;
};

export const canonicalStringify = (value, space = 0) =>
  JSON.stringify(canonicalize(value), null, space);

export const canonicalJson = (value) => `${canonicalStringify(value, 2)}\n`;
