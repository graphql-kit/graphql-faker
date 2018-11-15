import { createFakers } from "./fakers";

export function createFake(config) {
  const fakers = createFakers(config);
  const { getRandomInt, getRandomItem, typeFakers, fakeValue } = fakers;

  return { getRandomInt, getRandomItem, typeFakers, fakeValue };
}
