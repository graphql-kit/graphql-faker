import { run } from ".";

describe("run", () => {
  describe("with file", () => {
    const started = run({
      extendUrl: "http://example.com/graphql",
      forwardHeaders: "Authorition",
      file: "./temp.faker.graphql"
    });

    test("started", () => {
      expect(started).toBeDefined();
    });
  });

  describe("with idl", () => {
    const idl = `
      type Pet {
        name: String @fake(type:firstName)
        image: String @fake(type:imageUrl, options: {imageCategory:cats})
      }
    `;

    const started = run({
      extendUrl: "http://example.com/graphql",
      forwardHeaders: "Authorition",
      idl
    });

    test("started", () => {
      expect(started).toBeDefined();
    });
  });
});
