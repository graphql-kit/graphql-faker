let faker = require("faker");

export function systemFunctions() {
  // Internet section
  return {
    // System section
    // Skipped: faker.system.fileName
    // TODO: Add ext and type
    filename: () => faker.system.commonFileName(),
    mimeType: () => faker.system.mimeType(),
    // Skipped: faker.system.fileType
    // Skipped: faker.system.commonFileType
    // Skipped: faker.system.commonFileExt
    fileExtension: () => faker.system.fileExt(),
    semver: () => faker.system.semver()
  };
}
