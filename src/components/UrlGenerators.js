export const paramToURL = (param) => {
    return 'https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,' + param + '&for=county:*'
}