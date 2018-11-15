let faker = require("faker");
import * as moment from "moment";

export function dateFunctions(fakerOpts: any = {}) {
  // Date section
  return {
    pastDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...fakerOpts.pastDate,
          ...{ dateFormat }
        };

        const date = faker.date.past();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    },
    futureDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...fakerOpts.futureDate,
          ...{ dateFormat }
        };
        const date = faker.date.future();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    },
    recentDate: {
      args: ["dateFormat"],
      func: dateFormat => {
        const opts = {
          ...fakerOpts.recentDate,
          ...{ dateFormat }
        };
        const date = faker.date.recent();
        return dateFormat !== undefined
          ? moment(date).format(opts.dateFormat)
          : date;
      }
    }
  };
}
