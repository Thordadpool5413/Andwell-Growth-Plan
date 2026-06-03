const CMS_PROVIDER_DATA_BASE = "https://data.cms.gov/provider-data/api/1";

export const CMS_DATASETS = {
  hospiceProviderData: {
    program: "Hospice",
    name: "Hospice Provider Data",
    identifier: "252m-zfp9",
    purpose: "Hospice provider list and hospice quality measures.",
  },
  hospiceStateData: {
    program: "Hospice",
    name: "Hospice State Data",
    identifier: "eda0-92f0",
    purpose: "State-level hospice dataset.",
  },
  hospiceNationalData: {
    program: "Hospice",
    name: "Hospice National Data",
    identifier: "3xeb-u9wp",
    purpose: "National hospice benchmark dataset.",
  },
  hospiceCahpsProviderData: {
    program: "Hospice",
    name: "Hospice CAHPS Provider Data",
    identifier: "gxki-hrr8",
    purpose: "Hospice CAHPS provider survey data.",
  },
  hospiceGeneralInformation: {
    program: "Hospice",
    name: "Hospice General Information",
    identifier: "yc9t-dgbk",
    purpose: "Hospice general provider information.",
  },
  hospiceZipData: {
    program: "Hospice",
    name: "Hospice ZIP Data",
    identifier: "95rg-2usp",
    purpose: "Hospice ZIP-level service area data.",
  },
  homeHealthAgencies: {
    program: "Home health",
    name: "Home Health Care Agencies",
    identifier: "6jpm-sxkc",
    purpose: "Registered home health agencies with addresses and quality ratings.",
  },
  homeHealthHhcahpsProvider: {
    program: "Home health",
    name: "Home Health Care Patient Survey HHCAHPS",
    identifier: "ccn4-8vby",
    purpose: "HHCAHPS patient survey data.",
  },
  homeHealthHhcahpsMeasureDates: {
    program: "Home health",
    name: "Home Health Care HHCAHPS Measure Dates",
    identifier: "fa88-6ff2",
    purpose: "HHCAHPS measure date reference data.",
  },
  homeHealthHhcahpsStateData: {
    program: "Home health",
    name: "Home Health Care HHCAHPS State Data",
    identifier: "m5jg-jg7i",
    purpose: "State-level HHCAHPS benchmark data.",
  },
  homeHealthHhcahpsNationalData: {
    program: "Home health",
    name: "Home Health Care HHCAHPS National Data",
    identifier: "vxub-6swi",
    purpose: "National HHCAHPS benchmark data.",
  },
  homeHealthHhvbpAgencyData: {
    program: "Home health",
    name: "Expanded Home Health Value Based Purchasing Model Agency Data",
    identifier: "56d7-4994",
    purpose: "HHVBP agency performance data.",
  },
};

export const HRSA_DATASETS = {
  cmsApprovedHospices: {
    program: "HRSA Data Warehouse",
    name: "CMS Approved Facilities Hospices",
    sourceType: "ArcGIS REST service",
    endpoint:
      "https://gisportal.hrsa.gov/server/rest/services/HealthCareFacilities/CMSApprovedFacilities_FS/MapServer/4/query?where=CMS_PROVIDER_STATE_ABBR%3D%27ME%27&outFields=FACILITY_NM,CMS_PROVIDER_ADDRESS,CMS_PROVIDER_CITY,CMS_PROVIDER_STATE_ABBR,CMS_PROVIDER_ZIP_CD,CMS_PROVIDER_NUM,PHONE_NUM&returnGeometry=true&outSR=4326&f=pjson",
    purpose: "National hospice facility layer derived from CMS QIES and published by HRSA.",
  },
};

export function withCmsEndpoints(dataset) {
  return {
    ...dataset,
    metadataEndpoint: `${CMS_PROVIDER_DATA_BASE}/metastore/schemas/dataset/items/${dataset.identifier}`,
    dataEndpoint: `${CMS_PROVIDER_DATA_BASE}/datastore/query/${dataset.identifier}/0`,
  };
}

export const CMS_DATASET_REGISTRY = Object.fromEntries(
  Object.entries(CMS_DATASETS).map(([key, dataset]) => [key, withCmsEndpoints(dataset)]),
);

export const DATA_SOURCE_REGISTRY = {
  cms: CMS_DATASET_REGISTRY,
  hrsa: HRSA_DATASETS,
};

export default DATA_SOURCE_REGISTRY;
