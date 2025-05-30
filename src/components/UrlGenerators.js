const api_key = import.meta.env.VITE_CENSUS_KEY

export const paramToURL = (param) => {
    return `https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,' + param + '&for=county:*&key=${api_key}`
}