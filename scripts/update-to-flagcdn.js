const { Pool } = require('pg');
require('dotenv').config();

// Database connection using .env credentials
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Country code mapping from FlagCDN
const countryCodeMap = {
  "ad": "Andorra",
  "ae": "United Arab Emirates",
  "af": "Afghanistan",
  "ag": "Antigua and Barbuda",
  "ai": "Anguilla",
  "al": "Albania",
  "am": "Armenia",
  "ao": "Angola",
  "aq": "Antarctica",
  "ar": "Argentina",
  "as": "American Samoa",
  "at": "Austria",
  "au": "Australia",
  "aw": "Aruba",
  "ax": "Åland Islands",
  "az": "Azerbaijan",
  "ba": "Bosnia and Herzegovina",
  "bb": "Barbados",
  "bd": "Bangladesh",
  "be": "Belgium",
  "bf": "Burkina Faso",
  "bg": "Bulgaria",
  "bh": "Bahrain",
  "bi": "Burundi",
  "bj": "Benin",
  "bl": "Saint Barthélemy",
  "bm": "Bermuda",
  "bn": "Brunei",
  "bo": "Bolivia",
  "bq": "Caribbean Netherlands",
  "br": "Brazil",
  "bs": "Bahamas",
  "bt": "Bhutan",
  "bv": "Bouvet Island",
  "bw": "Botswana",
  "by": "Belarus",
  "bz": "Belize",
  "ca": "Canada",
  "cc": "Cocos (Keeling) Islands",
  "cd": "DR Congo",
  "cf": "Central African Republic",
  "cg": "Republic of the Congo",
  "ch": "Switzerland",
  "ci": "Côte d'Ivoire (Ivory Coast)",
  "ck": "Cook Islands",
  "cl": "Chile",
  "cm": "Cameroon",
  "cn": "China",
  "co": "Colombia",
  "cr": "Costa Rica",
  "cu": "Cuba",
  "cv": "Cape Verde",
  "cw": "Curaçao",
  "cx": "Christmas Island",
  "cy": "Cyprus",
  "cz": "Czechia",
  "de": "Germany",
  "dj": "Djibouti",
  "dk": "Denmark",
  "dm": "Dominica",
  "do": "Dominican Republic",
  "dz": "Algeria",
  "ec": "Ecuador",
  "ee": "Estonia",
  "eg": "Egypt",
  "eh": "Western Sahara",
  "er": "Eritrea",
  "es": "Spain",
  "et": "Ethiopia",
  "eu": "European Union",
  "fi": "Finland",
  "fj": "Fiji",
  "fk": "Falkland Islands",
  "fm": "Micronesia",
  "fo": "Faroe Islands",
  "fr": "France",
  "ga": "Gabon",
  "gb": "United Kingdom",
  "gd": "Grenada",
  "ge": "Georgia",
  "gf": "French Guiana",
  "gg": "Guernsey",
  "gh": "Ghana",
  "gi": "Gibraltar",
  "gl": "Greenland",
  "gm": "Gambia",
  "gn": "Guinea",
  "gp": "Guadeloupe",
  "gq": "Equatorial Guinea",
  "gr": "Greece",
  "gs": "South Georgia",
  "gt": "Guatemala",
  "gu": "Guam",
  "gw": "Guinea-Bissau",
  "gy": "Guyana",
  "hk": "Hong Kong",
  "hm": "Heard Island and McDonald Islands",
  "hn": "Honduras",
  "hr": "Croatia",
  "ht": "Haiti",
  "hu": "Hungary",
  "id": "Indonesia",
  "ie": "Ireland",
  "il": "Israel",
  "im": "Isle of Man",
  "in": "India",
  "io": "British Indian Ocean Territory",
  "iq": "Iraq",
  "ir": "Iran",
  "is": "Iceland",
  "it": "Italy",
  "je": "Jersey",
  "jm": "Jamaica",
  "jo": "Jordan",
  "jp": "Japan",
  "ke": "Kenya",
  "kg": "Kyrgyzstan",
  "kh": "Cambodia",
  "ki": "Kiribati",
  "km": "Comoros",
  "kn": "Saint Kitts and Nevis",
  "kp": "North Korea",
  "kr": "South Korea",
  "kw": "Kuwait",
  "ky": "Cayman Islands",
  "kz": "Kazakhstan",
  "la": "Laos",
  "lb": "Lebanon",
  "lc": "Saint Lucia",
  "li": "Liechtenstein",
  "lk": "Sri Lanka",
  "lr": "Liberia",
  "ls": "Lesotho",
  "lt": "Lithuania",
  "lu": "Luxembourg",
  "lv": "Latvia",
  "ly": "Libya",
  "ma": "Morocco",
  "mc": "Monaco",
  "md": "Moldova",
  "me": "Montenegro",
  "mf": "Saint Martin",
  "mg": "Madagascar",
  "mh": "Marshall Islands",
  "mk": "North Macedonia",
  "ml": "Mali",
  "mm": "Myanmar",
  "mn": "Mongolia",
  "mo": "Macau",
  "mp": "Northern Mariana Islands",
  "mq": "Martinique",
  "mr": "Mauritania",
  "ms": "Montserrat",
  "mt": "Malta",
  "mu": "Mauritius",
  "mv": "Maldives",
  "mw": "Malawi",
  "mx": "Mexico",
  "my": "Malaysia",
  "mz": "Mozambique",
  "na": "Namibia",
  "nc": "New Caledonia",
  "ne": "Niger",
  "nf": "Norfolk Island",
  "ng": "Nigeria",
  "ni": "Nicaragua",
  "nl": "Netherlands",
  "no": "Norway",
  "np": "Nepal",
  "nr": "Nauru",
  "nu": "Niue",
  "nz": "New Zealand",
  "om": "Oman",
  "pa": "Panama",
  "pe": "Peru",
  "pf": "French Polynesia",
  "pg": "Papua New Guinea",
  "ph": "Philippines",
  "pk": "Pakistan",
  "pl": "Poland",
  "pm": "Saint Pierre and Miquelon",
  "pn": "Pitcairn Islands",
  "pr": "Puerto Rico",
  "ps": "Palestine",
  "pt": "Portugal",
  "pw": "Palau",
  "py": "Paraguay",
  "qa": "Qatar",
  "re": "Réunion",
  "ro": "Romania",
  "rs": "Serbia",
  "ru": "Russia",
  "rw": "Rwanda",
  "sa": "Saudi Arabia",
  "sb": "Solomon Islands",
  "sc": "Seychelles",
  "sd": "Sudan",
  "se": "Sweden",
  "sg": "Singapore",
  "sh": "Saint Helena, Ascension and Tristan da Cunha",
  "si": "Slovenia",
  "sj": "Svalbard and Jan Mayen",
  "sk": "Slovakia",
  "sl": "Sierra Leone",
  "sm": "San Marino",
  "sn": "Senegal",
  "so": "Somalia",
  "sr": "Suriname",
  "ss": "South Sudan",
  "st": "São Tomé and Príncipe",
  "sv": "El Salvador",
  "sx": "Sint Maarten",
  "sy": "Syria",
  "sz": "Eswatini (Swaziland)",
  "tc": "Turks and Caicos Islands",
  "td": "Chad",
  "tf": "French Southern and Antarctic Lands",
  "tg": "Togo",
  "th": "Thailand",
  "tj": "Tajikistan",
  "tk": "Tokelau",
  "tl": "Timor-Leste",
  "tm": "Turkmenistan",
  "tn": "Tunisia",
  "to": "Tonga",
  "tr": "Turkey",
  "tt": "Trinidad and Tobago",
  "tv": "Tuvalu",
  "tw": "Taiwan",
  "tz": "Tanzania",
  "ua": "Ukraine",
  "ug": "Uganda",
  "um": "United States Minor Outlying Islands",
  "us": "United States",
  "uy": "Uruguay",
  "uz": "Uzbekistan",
  "va": "Vatican City (Holy See)",
  "vc": "Saint Vincent and the Grenadines",
  "ve": "Venezuela",
  "vg": "British Virgin Islands",
  "vi": "United States Virgin Islands",
  "vn": "Vietnam",
  "vu": "Vanuatu",
  "wf": "Wallis and Futuna",
  "ws": "Samoa",
  "xk": "Kosovo",
  "ye": "Yemen",
  "yt": "Mayotte",
  "za": "South Africa",
  "zm": "Zambia",
  "zw": "Zimbabwe"
};

// Custom mappings for countries that don't match exactly
const customMappings = {
  "Marianas": "mp",
  "Netherlands Antilles": "bq",
  "Sao Tome": "st",
  "US Virgin Isles": "vi",
  "Antigua Barbuda": "ag",
  "British Virgin Isles": "vg",
  "Burkina": "bf",
  "Burma": "mm",
  "Cape Verde Islands": "cv",
  "Comorro Islands": "km",
  "Congo": "cd",
  "Czechoslovakia": "cz",
  "Falklands Malvinas": "fk",
  "Faeroes": "fo",
  "Germany DDR": "de",
  "Germany FRG": "de",
  "Guinea Bissau": "gw",
  "Ivory Coast": "ci",
  "Kampuchea": "kh",
  "Laos": "la",
  "Lesotho": "ls",
  "Liberia": "lr",
  "Libya": "ly",
  "Liechtenstein": "li",
  "Luxembourg": "lu",
  "Malagasy": "mg",
  "Malawi": "mw",
  "Malaysia": "my",
  "Maldive Islands": "mv",
  "Mali": "ml",
  "Malta": "mt",
  "Mauritania": "mr",
  "Mauritius": "mu",
  "Mexico": "mx",
  "Monaco": "mc",
  "Mongolia": "mn",
  "Montserrat": "ms",
  "Morocco": "ma",
  "Mozambique": "mz",
  "Nauru": "nr",
  "Nepal": "np",
  "Netherlands": "nl",
  "New Zealand": "nz",
  "Nicaragua": "ni",
  "Niger": "ne",
  "Nigeria": "ng",
  "Niue": "nu",
  "North Korea": "kp",
  "North Yemen": "ye",
  "Norway": "no",
  "Oman": "om",
  "Pakistan": "pk",
  "Panama": "pa",
  "Papua New Guinea": "pg",
  "Parguay": "py",
  "Peru": "pe",
  "Philippines": "ph",
  "Poland": "pl",
  "Portugal": "pt",
  "Puerto Rico": "pr",
  "Qatar": "qa",
  "Romania": "ro",
  "Rwanda": "rw",
  "San Marino": "sm",
  "Saudi Arabia": "sa",
  "Senegal": "sn",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  "Singapore": "sg",
  "Soloman Islands": "sb",
  "Somalia": "so",
  "South Africa": "za",
  "South Korea": "kr",
  "South Yemen": "ye",
  "Spain": "es",
  "Sri Lanka": "lk",
  "St Helena": "sh",
  "St Kitts Nevis": "kn",
  "St Lucia": "lc",
  "St Vincent": "vc",
  "Sudan": "sd",
  "Surinam": "sr",
  "Swaziland": "sz",
  "Sweden": "se",
  "Switzerland": "ch",
  "Syria": "sy",
  "Taiwan": "tw",
  "Tanzania": "tz",
  "Thailand": "th",
  "Togo": "tg",
  "Tonga": "to",
  "Trinidad Tobago": "tt",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Turks Cocos Islands": "tc",
  "Tuvalu": "tv",
  "UAE": "ae",
  "Uganda": "ug",
  "UK": "gb",
  "Uruguay": "uy",
  "USA": "us",
  "USSR": "ru",
  "Vanuatu": "vu",
  "Vatican City": "va",
  "Venezuela": "ve",
  "Vietnam": "vn",
  "Western Samoa": "ws",
  "Yugoslavia": "rs",
  "Zaire": "cd",
  "Zambia": "zm",
  "Zimbabwe": "zw"
};

async function updateAllFlagUrls() {
  console.log('Updating all flag URLs to FlagCDN...\n');
  console.log('Database configuration:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  Database: ${process.env.DB_NAME}\n`);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Database connected\n');

    // Get all countries
    const result = await pool.query('SELECT id, name FROM countries ORDER BY name');
    const countries = result.rows;

    console.log(`Found ${countries.length} countries in database\n`);

    let updated = 0;
    let notFound = 0;

    for (const country of countries) {
      let countryCode = null;

      // Try custom mapping first
      if (customMappings[country.name]) {
        countryCode = customMappings[country.name];
      } else {
        // Try to find by exact match in countryCodeMap
        const entry = Object.entries(countryCodeMap).find(([code, name]) => 
          name.toLowerCase() === country.name.toLowerCase()
        );
        if (entry) {
          countryCode = entry[0];
        }
      }

      if (countryCode) {
        const flagUrl = `https://flagcdn.com/${countryCode}.svg`;
        
        await pool.query(
          'UPDATE countries SET flag_url = $1 WHERE id = $2',
          [flagUrl, country.id]
        );

        console.log(`✓ ${country.name} → ${flagUrl}`);
        updated++;
      } else {
        console.log(`✗ ${country.name} - No country code found`);
        notFound++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('Summary:');
    console.log(`  Total countries: ${countries.length}`);
    console.log(`  Updated:         ${updated}`);
    console.log(`  Not found:       ${notFound}`);
    console.log('='.repeat(70));

    if (notFound > 0) {
      console.log('\nCountries without codes need manual mapping in customMappings object.');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. .env file exists with correct credentials');
    console.error('2. Database is running and accessible');
    console.error('3. All environment variables are set correctly');
  } finally {
    await pool.end();
  }
}

// Run
updateAllFlagUrls()
  .then(() => {
    console.log('\n✓ Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
