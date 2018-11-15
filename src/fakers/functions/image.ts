let faker = require("faker");

export function imageFunctions(fakerOpts: any = {}) {
  // Image section
  return {
    imageUrl: {
      args: ["imageHeight", "imageWidth", "imageCategory", "randomizeImageUrl"],
      func: (height, width, category, randomize) => {
        const opts = {
          ...fakerOpts.imageUrl,
          ...{ height, width, category, randomize }
        };
        return faker.image.imageUrl(
          opts.height,
          opts.width,
          opts.category,
          opts.randomize,
          false
        );
      }
    }
  };
}
