/**
 * Static Maine ZIP code → county lookup table.
 * Source: USPS ZIP code assignments for Maine (16 counties).
 * Used to populate county for home health CMS records whose dataset
 * does not include a countyparish / county_name column.
 */
const MAINE_ZIP_COUNTY = {
  // Androscoggin County
  "04210": "Androscoggin", "04211": "Androscoggin", "04212": "Androscoggin",
  "04214": "Androscoggin", "04216": "Androscoggin", "04217": "Androscoggin",
  "04219": "Androscoggin", "04220": "Androscoggin", "04222": "Androscoggin",
  "04224": "Androscoggin", "04225": "Androscoggin", "04228": "Androscoggin",
  "04231": "Androscoggin", "04236": "Androscoggin", "04238": "Androscoggin",
  "04240": "Androscoggin", "04241": "Androscoggin", "04242": "Androscoggin",
  "04243": "Androscoggin", "04250": "Androscoggin", "04252": "Androscoggin",
  "04253": "Androscoggin", "04254": "Androscoggin", "04256": "Androscoggin",
  "04258": "Androscoggin", "04259": "Androscoggin", "04260": "Androscoggin",
  "04263": "Androscoggin", "04265": "Androscoggin", "04274": "Androscoggin",
  "04280": "Androscoggin", "04281": "Androscoggin", "04282": "Androscoggin",

  // Aroostook County
  "04730": "Aroostook", "04732": "Aroostook", "04733": "Aroostook",
  "04734": "Aroostook", "04735": "Aroostook", "04736": "Aroostook",
  "04737": "Aroostook", "04738": "Aroostook", "04739": "Aroostook",
  "04740": "Aroostook", "04741": "Aroostook", "04742": "Aroostook",
  "04743": "Aroostook", "04744": "Aroostook", "04745": "Aroostook",
  "04746": "Aroostook", "04747": "Aroostook", "04748": "Aroostook",
  "04750": "Aroostook", "04751": "Aroostook", "04756": "Aroostook",
  "04757": "Aroostook", "04758": "Aroostook", "04760": "Aroostook",
  "04761": "Aroostook", "04762": "Aroostook", "04763": "Aroostook",
  "04764": "Aroostook", "04765": "Aroostook", "04766": "Aroostook",
  "04768": "Aroostook", "04769": "Aroostook", "04772": "Aroostook",
  "04773": "Aroostook", "04774": "Aroostook", "04775": "Aroostook",
  "04776": "Aroostook", "04777": "Aroostook", "04779": "Aroostook",
  "04780": "Aroostook", "04781": "Aroostook", "04783": "Aroostook",
  "04785": "Aroostook", "04786": "Aroostook", "04787": "Aroostook",

  // Cumberland County
  "04001": "York",        "04002": "York",        "04003": "Cumberland",
  "04005": "York",        "04006": "York",        "04007": "Cumberland",
  "04008": "Cumberland",  "04009": "Cumberland",  "04010": "Cumberland",
  "04011": "Cumberland",  "04013": "Cumberland",  "04015": "Cumberland",
  "04017": "Cumberland",  "04019": "Cumberland",  "04021": "Cumberland",
  "04022": "Cumberland",  "04024": "Cumberland",  "04029": "Cumberland",
  "04030": "York",        "04032": "Cumberland",  "04033": "Cumberland",
  "04034": "Cumberland",  "04038": "Cumberland",  "04039": "Cumberland",
  "04040": "Oxford",      "04041": "Oxford",       "04042": "York",
  "04043": "York",        "04046": "York",         "04047": "York",
  "04048": "York",        "04049": "York",         "04050": "Cumberland",
  "04051": "Oxford",      "04055": "Oxford",       "04057": "Oxford",
  "04061": "York",        "04062": "Cumberland",   "04063": "York",
  "04064": "York",        "04066": "Cumberland",   "04068": "York",
  "04069": "Cumberland",  "04070": "Cumberland",   "04071": "Cumberland",
  "04072": "York",        "04073": "York",         "04074": "Cumberland",
  "04075": "Cumberland",  "04076": "York",         "04077": "Cumberland",
  "04078": "Cumberland",  "04079": "Cumberland",   "04082": "Cumberland",
  "04083": "York",        "04084": "Cumberland",   "04085": "Cumberland",
  "04086": "Sagadahoc",   "04087": "York",         "04088": "Oxford",
  "04090": "York",        "04091": "York",         "04092": "Cumberland",
  "04093": "Cumberland",  "04094": "York",         "04095": "York",
  "04096": "Cumberland",  "04097": "Cumberland",   "04098": "Cumberland",
  "04101": "Cumberland",  "04102": "Cumberland",   "04103": "Cumberland",
  "04104": "Cumberland",  "04105": "Cumberland",   "04106": "Cumberland",
  "04107": "Cumberland",  "04108": "Cumberland",   "04109": "Cumberland",
  "04110": "Cumberland",  "04112": "Cumberland",   "04116": "Cumberland",
  "04117": "Oxford",      "04122": "Cumberland",   "04123": "Cumberland",
  "04124": "Cumberland",

  // Franklin County
  "04920": "Somerset",    "04921": "Waldo",        "04922": "Waldo",
  "04923": "Somerset",    "04924": "Kennebec",     "04925": "Somerset",
  "04926": "Kennebec",    "04927": "Kennebec",     "04928": "Penobscot",
  "04929": "Waldo",       "04930": "Somerset",     "04932": "Waldo",
  "04933": "Waldo",       "04935": "Waldo",        "04936": "Franklin",
  "04937": "Kennebec",    "04938": "Franklin",     "04939": "Waldo",
  "04940": "Franklin",    "04941": "Waldo",        "04942": "Somerset",
  "04943": "Somerset",    "04944": "Somerset",     "04945": "Franklin",
  "04947": "Franklin",    "04949": "Waldo",        "04950": "Somerset",
  "04951": "Waldo",       "04952": "Waldo",        "04953": "Somerset",
  "04954": "Franklin",    "04955": "Kennebec",     "04956": "Franklin",
  "04957": "Somerset",    "04958": "Somerset",     "04961": "Franklin",
  "04962": "Kennebec",    "04963": "Kennebec",     "04964": "Franklin",
  "04966": "Franklin",    "04967": "Somerset",     "04969": "Somerset",
  "04970": "Franklin",    "04971": "Somerset",     "04973": "Waldo",
  "04974": "Waldo",       "04975": "Somerset",     "04976": "Somerset",
  "04978": "Somerset",    "04979": "Somerset",     "04981": "Waldo",
  "04982": "Franklin",    "04983": "Franklin",     "04984": "Franklin",
  "04985": "Somerset",    "04986": "Waldo",        "04987": "Waldo",
  "04988": "Waldo",       "04989": "Kennebec",

  // Hancock County
  "04401": "Penobscot",   "04402": "Penobscot",   "04406": "Piscataquis",
  "04408": "Hancock",     "04410": "Penobscot",   "04411": "Penobscot",
  "04412": "Penobscot",   "04413": "Washington",  "04414": "Piscataquis",
  "04415": "Piscataquis", "04416": "Hancock",     "04417": "Penobscot",
  "04418": "Penobscot",   "04419": "Penobscot",   "04420": "Hancock",
  "04421": "Hancock",     "04422": "Penobscot",   "04424": "Aroostook",
  "04426": "Piscataquis", "04427": "Penobscot",   "04428": "Penobscot",
  "04429": "Penobscot",   "04430": "Piscataquis", "04431": "Hancock",
  "04434": "Penobscot",   "04435": "Penobscot",   "04436": "Penobscot",
  "04437": "Penobscot",   "04438": "Waldo",       "04441": "Piscataquis",
  "04442": "Piscataquis", "04443": "Somerset",    "04444": "Penobscot",
  "04448": "Penobscot",   "04449": "Penobscot",   "04450": "Penobscot",
  "04451": "Aroostook",   "04453": "Penobscot",   "04454": "Washington",
  "04455": "Penobscot",   "04456": "Penobscot",   "04457": "Penobscot",
  "04459": "Penobscot",   "04460": "Piscataquis", "04461": "Penobscot",
  "04462": "Piscataquis", "04463": "Penobscot",   "04464": "Piscataquis",
  "04468": "Penobscot",   "04469": "Penobscot",   "04471": "Aroostook",
  "04472": "Hancock",     "04473": "Penobscot",   "04474": "Penobscot",
  "04475": "Penobscot",   "04476": "Hancock",     "04478": "Piscataquis",
  "04479": "Somerset",    "04480": "Piscataquis", "04481": "Piscataquis",
  "04485": "Piscataquis", "04487": "Penobscot",   "04488": "Penobscot",
  "04489": "Penobscot",   "04490": "Washington",  "04491": "Washington",
  "04492": "Washington",  "04493": "Penobscot",   "04495": "Penobscot",
  "04496": "Waldo",       "04497": "Aroostook",

  // Hancock County (05xx range)
  "04530": "Sagadahoc",   "04535": "Lincoln",     "04537": "Sagadahoc",
  "04538": "Lincoln",     "04539": "Lincoln",     "04541": "Lincoln",
  "04543": "Lincoln",     "04544": "Lincoln",     "04547": "Knox",
  "04548": "Knox",        "04549": "Lincoln",     "04551": "Knox",
  "04553": "Lincoln",     "04554": "Lincoln",     "04555": "Lincoln",
  "04556": "Lincoln",     "04558": "Lincoln",     "04562": "Sagadahoc",
  "04563": "Knox",        "04564": "Knox",        "04565": "Sagadahoc",
  "04568": "Knox",        "04570": "Lincoln",     "04571": "Sagadahoc",
  "04572": "Lincoln",     "04573": "Lincoln",     "04574": "Lincoln",
  "04575": "Lincoln",     "04576": "Lincoln",     "04578": "Lincoln",
  "04579": "Sagadahoc",

  // Kennebec County
  "04330": "Kennebec",    "04332": "Kennebec",    "04333": "Kennebec",
  "04336": "Kennebec",    "04338": "Kennebec",    "04341": "Kennebec",
  "04342": "Sagadahoc",   "04343": "Kennebec",    "04344": "Kennebec",
  "04345": "Kennebec",    "04346": "Kennebec",    "04347": "Kennebec",
  "04348": "Kennebec",    "04349": "Kennebec",    "04350": "Kennebec",
  "04351": "Kennebec",    "04352": "Kennebec",    "04353": "Kennebec",
  "04354": "Kennebec",    "04355": "Kennebec",    "04357": "Sagadahoc",
  "04358": "Kennebec",    "04359": "Kennebec",    "04360": "Kennebec",
  "04363": "Kennebec",    "04364": "Kennebec",

  // Knox County
  "04841": "Knox",        "04843": "Knox",        "04846": "Knox",
  "04847": "Knox",        "04848": "Knox",        "04849": "Knox",
  "04850": "Knox",        "04851": "Knox",        "04852": "Knox",
  "04853": "Knox",        "04854": "Knox",        "04855": "Knox",
  "04856": "Knox",        "04857": "Knox",        "04858": "Knox",
  "04859": "Knox",        "04860": "Knox",        "04861": "Knox",
  "04862": "Knox",        "04863": "Knox",        "04864": "Knox",

  // Oxford County
  "04200": "Oxford",      "04216": "Oxford",      "04217": "Oxford",
  "04219": "Oxford",      "04220": "Oxford",      "04231": "Oxford",
  "04237": "Oxford",      "04239": "Oxford",      "04255": "Oxford",
  "04257": "Oxford",      "04261": "Oxford",      "04262": "Oxford",
  "04267": "Oxford",      "04268": "Oxford",      "04270": "Oxford",
  "04271": "Oxford",      "04275": "Oxford",      "04276": "Oxford",
  "04284": "Oxford",      "04285": "Oxford",      "04286": "Oxford",
  "04287": "Sagadahoc",   "04288": "Androscoggin","04289": "Oxford",
  "04290": "Oxford",      "04291": "Oxford",      "04292": "Oxford",

  // Penobscot County (core)
  "04901": "Kennebec",    "04902": "Kennebec",    "04903": "Kennebec",

  // Piscataquis County (additional)
  "04498": "Washington",

  // Sagadahoc County
  "04500": "Sagadahoc",   "04501": "Sagadahoc",

  // Waldo County
  "04915": "Waldo",       "04917": "Kennebec",    "04918": "Kennebec",

  // Washington County
  "04600": "Washington",  "04605": "Hancock",     "04606": "Washington",
  "04607": "Hancock",     "04609": "Hancock",     "04611": "Washington",
  "04612": "Hancock",     "04613": "Hancock",     "04614": "Hancock",
  "04616": "Hancock",     "04617": "Hancock",     "04619": "Washington",
  "04622": "Washington",  "04623": "Washington",  "04624": "Washington",
  "04625": "Hancock",     "04626": "Washington",  "04627": "Hancock",
  "04628": "Washington",  "04629": "Hancock",     "04630": "Washington",
  "04631": "Washington",  "04634": "Washington",  "04635": "Hancock",
  "04637": "Washington",  "04638": "Washington",  "04640": "Hancock",
  "04642": "Hancock",     "04643": "Washington",  "04644": "Hancock",
  "04645": "Hancock",     "04646": "Hancock",     "04648": "Washington",
  "04649": "Washington",  "04650": "Hancock",     "04652": "Washington",
  "04653": "Hancock",     "04654": "Washington",  "04655": "Washington",
  "04657": "Washington",  "04658": "Hancock",     "04660": "Hancock",
  "04662": "Hancock",     "04664": "Hancock",     "04666": "Washington",
  "04667": "Washington",  "04668": "Washington",  "04669": "Hancock",
  "04671": "Washington",  "04672": "Hancock",     "04673": "Hancock",
  "04674": "Hancock",     "04675": "Hancock",     "04676": "Hancock",
  "04677": "Hancock",     "04679": "Hancock",     "04680": "Washington",
  "04681": "Hancock",     "04683": "Hancock",     "04684": "Hancock",
  "04685": "Hancock",     "04686": "Washington",  "04691": "Washington",
  "04693": "Hancock",     "04694": "Washington",

  // York County (03900s)
  "03901": "York",        "03902": "York",        "03903": "York",
  "03904": "York",        "03905": "York",        "03906": "York",
  "03907": "York",        "03908": "York",        "03909": "York",
  "03910": "York",        "03911": "York",
};

/**
 * Look up the Maine county for a given ZIP code.
 * Returns the county name string, or null if not found.
 * Normalizes the zip to 5-digit zero-padded string.
 */
export function countyFromZip(zip) {
  if (!zip) return null;
  const normalized = String(zip).trim().replace(/-.*$/, "").padStart(5, "0");
  return MAINE_ZIP_COUNTY[normalized] || null;
}
