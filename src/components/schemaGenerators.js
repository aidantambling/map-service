// obtain a schema for the hispanic sub-groups (the APIs are predictable so it is simpler to conditionally render this way, instead of storing in the .json file)
export function generateRaceGroupSchema(race) {
    const schema = {};
    const races = ["White", "Black", "American Indian + Alaska Native", "Asian", "Native Hawaiian + Other Pacific Islander", "Some Other Race", "Two Or More Races"]
    for (let i = 0; i < races.length; i++) {
    
        const key = races[i];
        let roundValue = 1;
        let dPval
        let stepVal = (i === 4) ? 100 : 250;
        if (97 + i < 100){
            dPval = `https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_00${(97 + i).toString().padStart(0, '0')}C&for=county:*`
        }
        else {
            dPval = `https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0${(97 + i).toString().padStart(0, '0')}C&for=county:*`
        }
        schema[key] = {
            url: dPval,
            title: `${key}`,
            description: `Population data for ${key} Hispanics`,
            round: roundValue,
            sliderConfig : {
                max : 'any',
                step : stepVal,
            },
        };
    }
    return schema;
}

// obtain a schema for the gender sub-groups (the APIs are predictable so it is simpler to conditionally render this way, instead of storing in the .json file)
export function generateAgeGroupSchema(gender, offset) {
    const schema = {};
    for (let i = 0; i < 18; i++) {
        let key, title;
        if (i < 17) {
            const ageStart = i * 5;
            const ageEnd = ageStart + 4;
            key = `${ageStart}-${ageEnd}`;
            title = `${gender} population ${key} years old`;
        } else {
            key = "85+";
            title = `${gender} population 85 years or older`;
        }

        let roundValue = (i === 15 || i === 16 || i === 17) ? 100 : 250;
        schema[key] = {
            url: `https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_00${(offset + i).toString().padStart(2, '0')}C&for=county:*`,
            title: title,
            description: `Population data for ${gender.toLowerCase()}s ${key} years old.`,
            round: roundValue,
            sliderConfig : {
                max : 'any',
                step : 250,
            },
        };
    }
    return schema;
}