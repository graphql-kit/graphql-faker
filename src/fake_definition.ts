import {
  Kind,
  Source,
  DocumentNode,
  GraphQLError,
  GraphQLSchema,
  parse,
  validate,
  extendSchema,
  buildASTSchema,
  validateSchema,
  isObjectType,
  isInterfaceType,
  ValuesOfCorrectTypeRule,
} from 'graphql';

// FIXME
import { validateSDL } from 'graphql/validation/validate';

const fakeDefinitionAST = parse(/* GraphQL */ `
  enum fake__Locale {
    az
    cz
    de
    de_AT
    de_CH
    en
    en_AU
    en_BORK
    en_CA
    en_GB
    en_IE
    en_IND
    en_US
    en_au_ocker
    es
    es_MX
    fa
    fr
    fr_CA
    ge
    id_ID
    it
    ja
    ko
    nb_NO
    nep
    nl
    pl
    pt_BR
    ru
    sk
    sv
    tr
    uk
    vi
    zh_CN
    zh_TW
  }

  enum fake__Types {
    zipCode
    city
    streetName
    "Configure address with option \`useFullAddress\`"
    streetAddress
    secondaryAddress
    county
    country
    countryCode
    state
    stateAbbr
    latitude
    longitude

    colorName
    productCategory
    productName
    "Sum of money. Configure with options \`minMoney\`/\`maxMoney\` and 'decimalPlaces'."
    money
    productMaterial
    product

    companyName
    companyCatchPhrase
    companyBS

    dbColumn
    dbType
    dbCollation
    dbEngine

    """
    By default returns dates beetween 2000-01-01 and 2030-01-01.
    Configure date format with options \`dateFormat\` \`dateFrom\` \`dateTo\`.
    """
    date
    "Configure date format with option \`dateFormat\`"
    pastDate
    "Configure date format with option \`dateFormat\`"
    futureDate
    "Configure date format with option \`dateFormat\`"
    recentDate

    financeAccountName
    financeTransactionType
    currencyCode
    currencyName
    currencySymbol
    bitcoinAddress
    internationalBankAccountNumber
    bankIdentifierCode

    hackerAbbreviation
    hackerPhrase

    "An image url. Configure image with options: \`imageCategory\`, \`imageWidth\`, \`imageHeight\` and \`randomizeImageUrl\`"
    imageUrl
    "An URL for an avatar"
    avatarUrl
    "Configure email provider with option: \`emailProvider\`"
    email
    url
    domainName
    ipv4Address
    ipv6Address
    userAgent
    "Configure color with option: \`baseColor\`"
    colorHex
    macAddress
    "Configure password with option \`passwordLength\`"
    password

    "Lorem Ipsum text. Configure size with option \`loremSize\`"
    lorem

    firstName
    lastName
    fullName
    jobTitle

    phoneNumber

    number
    uuid
    word
    words
    locale

    filename
    mimeType
    fileExtension
    semver
  }

  input fake__imageSize {
    width: Int!
    height: Int!
  }

  enum fake__loremSize {
    word
    words
    sentence
    sentences
    paragraph
    paragraphs
  }

  input fake__color {
    red255: Int = 0
    green255: Int = 0
    blue255: Int = 0
  }

  input fake__options {
    "Only for type \`streetAddress\`"
    useFullAddress: Boolean
    "Only for type \`money\`"
    minMoney: Float
    "Only for type \`money\`"
    maxMoney: Float
    "Only for type \`money\`"
    decimalPlaces: Int
    "Only for type \`imageUrl\`"
    imageSize: fake__imageSize
    "Only for type \`imageUrl\`. Example value: \`[\\"nature\\", \\"water\\"]\`."
    imageKeywords: [String!]
    "Only for type \`imageUrl\`"
    randomizeImageUrl: Boolean
    "Only for type \`email\`"
    emailProvider: String
    "Only for type \`password\`"
    passwordLength: Int
    "Only for type \`lorem\`"
    loremSize: fake__loremSize
    "Only for types \`*Date\`. Example value: \`YYYY MM DD\`. [Full Specification](http://momentjs.com/docs/#/displaying/format/)"
    dateFormat: String = "YYYY-MM-DDTHH:mm:ss[Z]"
    "Only for types \`betweenDate\`. Example value: \`1986-11-02\`."
    dateFrom: String = "2010-01-01"
    "Only for types \`betweenDate\`. Example value: \`2038-01-19\`."
    dateTo: String = "2030-01-01"
    "Only for type \`colorHex\`. [Details here](https://stackoverflow.com/a/43235/4989887)"
    baseColor: fake__color = { red255: 0, green255: 0, blue255: 0 }
    "Only for type \`number\`"
    minNumber: Float
    "Only for type \`number\`"
    maxNumber: Float
    "Only for type \`number\`"
    precisionNumber: Float
  }

  directive @fake(
    type: fake__Types!
    options: fake__options = {}
    locale: fake__Locale
  ) on FIELD_DEFINITION | SCALAR

  directive @listLength(min: Int!, max: Int!) on FIELD_DEFINITION

  scalar examples__JSON
  directive @examples(values: [examples__JSON]!) on FIELD_DEFINITION | SCALAR
`);

function defToName(defNode) {
  const { kind, name } = defNode;
  if (name == null) {
    return '';
  }
  return (kind === Kind.DIRECTIVE_DEFINITION ? '@' : '') + name.value;
}

const fakeDefinitionsSet = new Set(
  fakeDefinitionAST.definitions.map(defToName),
);

const schemaWithOnlyFakedDefinitions = buildASTSchema(fakeDefinitionAST);
// FIXME: mark it as valid to be able to run `validate`
schemaWithOnlyFakedDefinitions['__validationErrors'] = [];

export function buildWithFakeDefinitions(
  schemaSDL: Source,
  extensionSDL?: Source,
  options?: { skipValidation: boolean },
): GraphQLSchema {
  const skipValidation = options?.skipValidation ?? false;
  const schemaAST = parseSDL(schemaSDL);

  // Remove Faker's own definitions that were added to have valid SDL for other
  // tools, see: https://github.com/APIs-guru/graphql-faker/issues/75
  const filteredAST = {
    ...schemaAST,
    definitions: schemaAST.definitions.filter((def) => {
      const name = defToName(def);
      return name === '' || !fakeDefinitionsSet.has(name);
    }),
  };

  let schema = extendSchemaWithAST(schemaWithOnlyFakedDefinitions, filteredAST);

  const config = schema.toConfig();
  schema = new GraphQLSchema({
    ...config,
    ...(config.astNode ? {} : getDefaultRootTypes(schema)),
  });

  if (extensionSDL != null) {
    schema = extendSchemaWithAST(schema, parseSDL(extensionSDL));

    for (const type of Object.values(schema.getTypeMap())) {
      if (isObjectType(type) || isInterfaceType(type)) {
        for (const field of Object.values(type.getFields())) {
          const isExtensionField = field.astNode?.loc?.source === extensionSDL;
          (field.extensions as any)['isExtensionField'] = isExtensionField;
        }
      }
    }
  }

  if (!skipValidation) {
    const errors = validateSchema(schema);
    if (errors.length !== 0) {
      throw new ValidationErrors(errors);
    }
  }

  return schema;

  function extendSchemaWithAST(
    schema: GraphQLSchema,
    extensionAST: DocumentNode,
  ): GraphQLSchema {
    if (!skipValidation) {
      const errors = [
        ...validateSDL(extensionAST, schema),
        ...validate(schemaWithOnlyFakedDefinitions, extensionAST, [
          ValuesOfCorrectTypeRule,
        ]),
      ];
      if (errors.length !== 0) {
        throw new ValidationErrors(errors);
      }
    }

    return extendSchema(schema, extensionAST, {
      assumeValid: true,
      commentDescriptions: true,
    });
  }
}

// FIXME: move to 'graphql-js'
export class ValidationErrors extends Error {
  subErrors: GraphQLError[];

  constructor(errors) {
    const message = errors.map((error) => error.message).join('\n\n');
    super(message);

    this.subErrors = errors;
    this.name = this.constructor.name;

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

function getDefaultRootTypes(schema) {
  return {
    query: schema.getType('Query'),
    mutation: schema.getType('Mutation'),
    subscription: schema.getType('Subscription'),
  };
}

function parseSDL(sdl: Source) {
  return parse(sdl, {
    allowLegacySDLEmptyFields: true,
    allowLegacySDLImplementsInterfaces: true,
  });
}
