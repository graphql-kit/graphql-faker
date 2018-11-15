# Faker types

Usage:

`name: String @fake(type:firstName)`

With arguments:

`image: String @fake(type:imageUrl, options: {imageCategory:cats})`

## Address

- `zipCode` (format)
- `zipCodeByState` (state)
- `city`
- `streetName`
- `streetAddress` (useFullAddress)
- `secondaryAddress`
- `county`
- `country`
- `countryCode`
- `state`
- `stateAbbr`
- `latitude` (min, max, precision)
- `longitude` (min, max, precision)
- `nearbyGPSCoordinate` (latitude, longitude, radius, isMetric)

## Commerce

- `colorName`
- `productCategory`
- `productName`
- `money` (minMoney, maxMoney, decimalPlaces)
- `productMaterial`
- `product`

## Company

- `companyName`
- `companyCatchPhrase`
- `companyBs`

## Database

- `dbColumn`
- `dbType`
- `dbCollation`
- `dbEngine`

## Date

- `pastDate` (dateFormat)
- `futureDate` (dateFormat)
- `recentDate`

## Finance

- `financeAccountName`
- `financeTransactionType`
- `currencyCode`
- `currencyName`
- `currencySymbol`
- `bitcoinAddress`
- `internationalBankAccountNumber`
- `bankIdentifierCode`

## Hacker

- `hackerAbbr`
- `hackerPhrase`

## Image

- `imageUrl` (imageHeight, imageWidth, imageCategory, randomizeImageUrl)

## Internet

- `avatarUrl`
- `email` (emailProvider)
- `url`
- `domainName`
- `ipv4Address`
- `ipv6Address`
- `userAgent`
- `colorHex` (baseColor)
- `macAddress`
- `password` (passwordLenth)

## Lorem

- `lorem` (loremSize)

## Name and title

- `firstName`
- `lastName`
- `fullName`
- `title`
- `jobTitle`

## Phone

- `phoneNumber` (format)

## Random

- `alpha` (count, upcase)
- `alphaNumeric` (count)
- `hexaDecimal` (count)
- `number` (minNumber, maxNumber, precisionNumber)
- `uuid`
- `word`
- `words` (count)
- `locale`
- `filename`
- `mimeType`
- `fileExtension`
- `semver`
