import { filter } from 'd3';
import { useState, useEffect } from 'react';
const api_key = import.meta.env.VITE_CENSUS_KEY

export const paramToURL = (param, level, state = '*') => {
    return `https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,` + param + `&for=${level}:${state}&key=${api_key}`
}
// terminology:

// there are many variables for a given API, which are stored in variables.json. For users to be able to make sense of them, we need a tree-like ordering of them.
// top level: concept groups, sorted by the first 3 chars of the variable, i.e. all variables that begin with B01.
// third level: concepts, sorted by the first 6 chars of the variable, i.e. all variables that begin with B01001.
// second level: subconcepts, sorted by the first 6 chars of the variable + letter appendix + _, i.e. all variables that begin with B01001A_
// bottom level: labels, sorted by all chars of the variable, i.e. B01001A_001E

// grab the top-level concept groups
export const fetchConceptGroups = async () => {
    try {
        // grab the data from our file
        const response = await fetch('/variables.json');
        const data = await response.json();
        const mappedData = Object.entries(data.variables).map(([key, value]) => ({
            concept: value.concept,
            group: value.group
        }));

        // sort the data (ensure the first entry for some concept group is the one we care about, i.e. base case)
        mappedData.sort((a, b) => {
            if (a.group && b.group) {
                return a.group.localeCompare(b.group);
            }
            return 0;
        });

        // use a map to find unique concept groups
        const uniqueConceptsMap = new Map();
        mappedData.forEach(({ concept, group }) => {
            const groupPrefix = group.slice(0, 3)
            if (!uniqueConceptsMap.has(groupPrefix)) {
                uniqueConceptsMap.set(groupPrefix, { concept, groupPrefix });
            }
        });

        const uniqueConcepts = Array.from(uniqueConceptsMap.entries()).sort((a, b) => {
            return a[1].groupPrefix.localeCompare(b[1].groupPrefix);
        });

        return uniqueConcepts.map(([groupPrefix, { concept, group }]) => ({ conceptGroup: concept, groupPrefix }));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// when user selects a concept group, find the concepts that form it.
export const findConcepts = async (keyVal) => {
    try {
        const response = await fetch('/variables.json');
        const data = await response.json();

        const filteredData = Object.entries(data.variables).filter(([key, value]) => key.startsWith(keyVal.slice(0, 3))); // the keyval should be only 3 chars, but slice anyway
        const conceptsWithGroup = filteredData.map(([key, value]) => ({
            concept: value.concept,
            group: key
        })).filter(item => item.group !== null);

        // sort the conceptsWithGroup based on their group (ensure groups will be in order)
        conceptsWithGroup.sort((a, b) => {
            const [groupA, suffixA] = a.group.split('_');
            const [groupB, suffixB] = b.group.split('_');

            if (groupA < groupB) return -1;
            if (groupA > groupB) return 1;
            return 0;
        });

        // use a set to grab only *unique* concepts
        const uniquePrefixes = new Set();
        const uniqueConcepts = [];
        conceptsWithGroup.forEach(({ concept, group }) => {
            const prefix = group.slice(0, 6);
            if (!uniquePrefixes.has(prefix)) {
                uniquePrefixes.add(prefix);
                uniqueConcepts.push({ concept, group: group.slice(0, 6) });
            }
        });

        return uniqueConcepts;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


const reduceConcepts = (concepts) => {
    if (concepts.length === 0) return [];

    const baseConceptObj = concepts[0];
    const baseConcept = baseConceptObj.concept;
    const baseConceptPattern = new RegExp(`^${baseConcept}\\s*\\((.*?)\\)$`);

    return concepts.map(conceptObj => {
        if (typeof conceptObj.concept !== 'string') {
            console.error('Invalid concept type:', conceptObj);
            return {
                concept: conceptObj.concept,
                group: conceptObj.group
            };
        }

        if (conceptObj.concept === baseConcept) {
            return {
                concept: 'Total',
                group: conceptObj.group
            };
        }

        const match = conceptObj.concept.match(baseConceptPattern);
        if (match) {
            return {
                concept: match[1],
                group: conceptObj.group
            };
        }

        // Add any specific rules that should not apply the base concept reduction
        // if (conceptObj.concept.includes('Place of Birth by Age')) {
        //     return conceptObj.concept; // Do not alter these specific cases
        // }

        return conceptObj.concept;
    });
};


export const findConceptsFromBase = async (keyVal) => {
    try {
        const response = await fetch('/variables.json');
        const data = await response.json();

        const filteredData = Object.entries(data.variables).filter(([key, value]) => key.startsWith(keyVal));
        const conceptsWithGroup = filteredData.map(([key, value]) => {
            return { concept: value.concept, group: value.group };
        }).filter(item => item.group !== null);

        conceptsWithGroup.sort((a, b) => {
            if (a.group < b.group) return -1;
            if (a.group > b.group) return 1;
            return 0;
        });

        const refinedConcepts = reduceConcepts(conceptsWithGroup)

        const uniqueConceptsMap = new Map();

        refinedConcepts.forEach(({ concept, group }) => {
            if (!uniqueConceptsMap.has(concept)) {
                uniqueConceptsMap.set(concept, group);
            }
        });

        const uniqueConcepts = Array.from(uniqueConceptsMap.entries()).map(([concept, group]) => ({ concept, group }));
        return uniqueConcepts;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// take the data from the keyVal set into an array of objects where the lines are split by '!!' delimiter
const parseEntries = async (keyVal) => {
    try {
        const response = await fetch('/variables.json');
        const data = await response.json();

        const filteredData = Object.entries(data.variables).filter(([key, value]) => key.startsWith(keyVal));

        const arr = [];
        filteredData.map(([key, value]) => {
            const path = value.label.split(/!!/);
            const name = key;
            if (path) arr.push({
                path: path,
                name: name
            });
        }).filter(name => name !== null);

        const sortedArr = arr.sort((a, b) => a.name.localeCompare(b.name));
        return sortedArr;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// take the split data and make it into an object compatible with the nested dropdown
const buildHierarchy = (data, categoryPrefix) => {
    const root = { children: {} };

    // from the split data, build it into a hierarchical object
    data.forEach((entry) => {
        if (entry.path && Array.isArray(entry.path)) {
            let current = root;

            entry.path.forEach((segment, index) => {
                segment = segment.replace(/:$/, '');
                if (current && current.children === null) {
                    current.children = {};
                }
                if (!current.children) {
                    current.children = {};
                }
                if (!current.children[segment]) {
                    current.children[segment] = (index === entry.path.length - 1) ?
                        {
                            name: entry.name,
                            children: null
                        }
                        :
                        {
                            name: entry.name,
                            children: {}
                        };
                }
                current = current.children[segment];
            });
        }
    });

    const getFirstChild = (node) => {
        if (!node || !node.children) return null;
        const keys = Object.keys(node.children);
        if (keys.length === 0) return null;
        return node.children[keys[0]];
    };


    // map the hierarchical object to fit the import constraints of RecursiveSelect.jsx
    const transformNode = (node, category = 'Total', fullPath = categoryPrefix) => {
        if (!node) {
            return [];
        }
        if (!node.children) {
            const group = node?.name;
            const id = `${group}-${category}-${0}`
            const children = undefined;
            const key = category;
            return [{
                label: key,
                group: group,
                id: id,
                category: category,
                fullpath: fullPath,
                ...(children && { children })
            }]
        }
        const entries = Object.entries(node.children);

        return entries.map(([key, value], index) => {
            const group = value?.name;
            const id = `${group}-${category}-${index}`;
            const fp = fullPath + ": " + key;
            const children = value?.children ? transformNode(value, key, fp) : undefined;
            return {
                label: key,
                group: group,
                id: id,
                category: category,
                fullpath: fp,
                ...(children && { children })
            };
        });
    };

    if (!root.children.Estimate) {
        console.error('Estimate node is not defined in the root.');
        return [];
    }

    const estimateNode = root.children.Estimate;
    const firstChild = getFirstChild(estimateNode);

    if (!firstChild) {
        console.error('No child node is defined under Estimate.');
        return [];
    }

    const bullshit = transformNode(firstChild);
    firstChild.children = bullshit;
    const returnNode = {
        category: 'Tier 1',
        children: bullshit,
        fullpath: categoryPrefix,
        group: firstChild.name,
        id: firstChild.name + '-' + 'dummy',
        label: categoryPrefix
    }
    return returnNode;
};

// for a given keyVal, get its 'labels'
export const getVariablesFromConcept = async (keyVal, category) => {
    const [group, suffix] = keyVal.split('_');

    const parsedSet = await parseEntries(group + '_');

    return JSON.stringify(buildHierarchy(parsedSet, category), null, 2)
}