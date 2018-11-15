let faker = require("faker");

export function addressFunctions(fakerOpts: any = {}) {
  // Address section
  return {
    zipCode: {
      args: ["zipFormat"],
      func: zipFormat => {
        const opts = {
          ...fakerOpts.zipCode,
          ...{ zipFormat }
        };
        return faker.address.zipCode(opts.zipFormat);
      }
    },
    zipCodeByState: {
      args: ["state"],
      func: state => {
        const opts = {
          ...fakerOpts.zipCodeByState,
          ...{ state }
        };
        return faker.address.zipCodeByState(opts.state);
      },
      city: () => faker.address.city(),
      // Skipped: faker.address.cityPrefix
      // Skipped: faker.address.citySuffix
      streetName: () => faker.address.streetName(),
      streetAddress: {
        args: ["useFullAddress"],
        func: useFullAddress => {
          const opts = {
            ...fakerOpts.streetAddress,
            ...{ useFullAddress }
          };
          return faker.address.streetAddress(opts.useFullAddress);
        }
      },
      // Skipped: faker.address.streetSuffix
      // Skipped: faker.address.streetPrefix
      secondaryAddress: () => faker.address.secondaryAddress(),
      county: () => faker.address.county(),
      country: () => faker.address.country(),
      countryCode: () => faker.address.countryCode(),
      state: () => faker.address.state(),
      stateAbbr: () => faker.address.stateAbbr(),
      latitude: {
        args: ["min", "max", "precision"],
        func: (min, max, precision) => {
          const opts = {
            ...fakerOpts.latitude,
            ...{ min, max, precision }
          };
          return faker.address.latitude(opts.min, opts.max, opts.precision);
        }
      },
      longitude: {
        args: ["min", "max", "precision"],
        func: (min, max, precision) => {
          const opts = {
            ...fakerOpts.longitude,
            ...{ min, max, precision }
          };
          return faker.address.longitude(opts.min, opts.max, opts.precision);
        }
      },
      nearbyGPSCoordinate: {
        args: ["latitude", "longitude", "radius", "isMetric"],
        func: (latitude, longitude, radius, isMetric) => {
          const opts = {
            ...fakerOpts.nearbyGPSCoordinate,
            ...{ latitude, longitude, radius, isMetric }
          };
          return faker.address.nearbyGPSCoordinate(
            [opts.latitude, opts.longitude],
            radius,
            isMetric
          );
        }
      }
    }
  };
}
