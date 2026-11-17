const sources = import.meta.glob<string>(["./**/*.tsx", "!./**/*.test.tsx"], {
  query: "?raw",
  import: "default",
  eager: true,
});

it("spacing props use one token per prop (Chakra does not convert « 3 4 »)", () => {
  const twoValues = /\b(gap|p|px|py|m|mx|my|inset)="[\d.]+ [\d.]+"/;
  const offenders = Object.entries(sources)
    .filter(([, source]) => twoValues.test(source))
    .map(([path]) => path);
  expect(offenders).toEqual([]);
});
