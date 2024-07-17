import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './canvas.scss';

const Canvas = ({ tooltipCountyRef, tooltipStatRef, setLegendData, populationURLs, sliderVal, state, dispatch, countOrPercentage, setCountOrPercentage, setSliderMax, setSliderStep, selectedCounty, setSelectedCounty, setDataTitle }) => {
    const [countyData, setCountyData] = useState([]);
    const [populationData, setPopulationData] = useState([]);
    const [cutoffs, setCutoffs] = useState([]);

    const countyURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

    // initial map render
    useEffect(() => {
        const fetchData = async () => {
            try {
                const countyResponse = await d3.json(countyURL);
                // const countyResponse = await d3.json("CT_Councils_of_Governments.json");
                const counties = topojson.feature(countyResponse, countyResponse.objects.counties).features;
                setCountyData(counties);

                const populationResponse = await d3.json(populationURLs[0]);
                setPopulationData(populationResponse.slice(1));
                const newCutoffs = getCutoffPoints(populationResponse.slice(1), 5000);
                setCutoffs(newCutoffs);
                setDataTitle("Sex by Age - Total Population");
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // re-render the map whenever the API url is changed
    useEffect(() => {
        console.log('Population Data have been changed to ', populationURLs)
        console.log(typeof (populationURLs))
        const fetchData = async () => {
            try {
                const fetchPromises = populationURLs.map(url => {
                    console.log('Fetching URL:', url); // Log each URL being fetched
                    return d3.json(url);
                }); const responses = await Promise.all(fetchPromises);

                responses.forEach((response, index) => {
                    console.log(`Response from URL ${populationURLs[index]}:`, response);
                    if (!response || !Array.isArray(response)) {
                        throw new Error(`Invalid response structure from URL ${populationURLs[index]}`);
                    }
                });

                // Combine and sum the data by county
                const combinedDataMap = new Map();

                responses.forEach(response => {
                    console.log(response)
                    if (!response || !Array.isArray(response)) {
                        throw new Error('Invalid response structure');
                    }
                    response.slice(1).forEach(row => {
                        const countyId = row[1]; // Assuming the county ID is in the second column
                        const value = +row[2];  // Assuming the value to sum is in the third column
                        if (combinedDataMap.has(countyId)) {
                            combinedDataMap.get(countyId)[2] = (parseFloat(combinedDataMap.get(countyId)[2]) + value).toString();
                        } else {
                            combinedDataMap.set(countyId, [...row]);
                        }
                    });
                });

                // Convert the combinedDataMap back to an array
                const combinedDataArray = Array.from(combinedDataMap.values());

                setPopulationData(combinedDataArray);

                const values = combinedDataArray.map(d => +d[1]); // Assuming the value to analyze is in the second column
                let highQuantile;
                if (countOrPercentage == 'Count') {
                    const maxVal = Math.max(...values);
                    highQuantile = Math.ceil(d3.quantile(values.sort((a, b) => a - b), 0.95) / 20) * 20;
                    setSliderMax(getRoundedSliderSettings(highQuantile, 20, 250).max);
                    setSliderStep(getRoundedSliderSettings(highQuantile, 20, 250).step);
                }
                else {
                    highQuantile = Math.ceil(d3.quantile(values.sort((a, b) => a - b), 0.95));
                    console.log(getRoundedSliderSettings(highQuantile, 20, 0.5));
                    setSliderMax(getRoundedSliderSettings(highQuantile, 20, 0.5).max);
                    setSliderStep(getRoundedSliderSettings(highQuantile, 20, 0.5).step);
                }

                let roundMatrix;
                if (countOrPercentage == 'Count') {
                    roundMatrix = [1, 100, 1000, 2500, 5000, 10000];
                }
                else {
                    roundMatrix = [1, 0.1, 0.01];
                }
                // use the largest roundValue that is sufficiently balanced (score < 1000)
                let optimalVal = -1;
                let optimalScore = -1;
                roundMatrix.forEach(roundVal => {
                    const newCutoffs = getCutoffPoints(combinedDataArray, roundVal);
                    // console.log('Rounding to ', roundVal, ': ', newCutoffs);
                    if (countOrPercentage == 'Percentage' && newCutoffs[1] == 100 && newCutoffs[1] == newCutoffs[2] && newCutoffs[2] == newCutoffs[3] && newCutoffs[3] == newCutoffs[4]) {
                        // console.log('Meaningless percentages');
                        //TODO: display popup saying that percentage not available for this
                        setCountOrPercentage('Count')
                    }
                    const newScore = getCountyDistribution(combinedDataArray, newCutoffs);
                    if (optimalVal == -1 || newScore < 1000 || newScore < optimalScore) { // if score is uninit, take the score. or, take the highest roundval with reasonable score
                        optimalVal = roundVal;
                        optimalScore = newScore;
                    }
                })
                const newCutoffs = getCutoffPoints(combinedDataArray, optimalVal);
                setCutoffs(newCutoffs);
                // console.log('Optimal score: ', optimalVal);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [populationURLs]);

    function getRoundedSliderSettings(maxValue, numSteps, base) {
        const roundedMax = Math.ceil(maxValue / base) * base;
        let initialStep = roundedMax / numSteps;
        const roundedStep = Math.ceil(initialStep / base) * base;
        const adjustedMax = roundedStep * numSteps;

        return {
            max: adjustedMax,
            step: roundedStep
        };
    }

    // update the legend whenever we adjust the slider, cutoff points, or viewing mode
    useEffect(() => {
        updateLegend(cutoffs, state.viewingMode);
    }, [sliderVal, cutoffs, state.viewingMode, selectedCounty])

    // whenever we access a new data API, we need to re-compute the cutoff points for quartiles
    function getCutoffPoints(data, roundVal) {
        const values = data.map(d => +d[2]).sort((a, b) => a - b);
        const quantiles = [];

        for (let i = 1; i < 4; i++) {
            // const roundVal = 1000; // value we want the quartiles to round to
            const rawq = d3.quantile(values, i / 4);
            const q = Math.round(rawq / roundVal) * roundVal
            // const q = d3.quantile(values, i / 4) - d3.quantile(values, i / 4) % roundVal;
            quantiles.push(q);
        }

        // console.log('RoundVal: ', roundVal, quantiles);

        return [0, ...quantiles, values[values.length - 1]];
    }

    // re-configure the legend
    function updateLegend(cutoffs, viewingMode) {
        let newLegendData = [];

        // cutoffs unnecessary - split by slider value
        if (viewingMode === 'slider') {
            if (state.comparisonMode === 'overUnder') {
                const colors = ['limegreen', 'tomato'];
                let aboveLabel = `Above ${sliderVal.toLocaleString()}`;
                let belowLabel = `Below ${sliderVal.toLocaleString()}`;
                if (countOrPercentage === 'Percentage') {
                    aboveLabel += '%';
                    belowLabel += '%';
                }
                newLegendData = [
                    {
                        color: colors[0],
                        label: aboveLabel
                    },
                    {
                        color: colors[1],
                        label: belowLabel
                    },
                    {
                        color: 'black',
                        label: 'No data'
                    }
                ];
            }
            if (state.comparisonMode === 'viewCompRange') {
                const colors = ['limegreen', 'tomato'];
                let aboveLabel = `Within 5000 of ${sliderVal.toLocaleString()}`;
                let belowLabel = `Outside 5000 of ${sliderVal.toLocaleString()}`;
                if (countOrPercentage === 'Percentage') {
                    aboveLabel += '%';
                    belowLabel += '%';
                }
                newLegendData = [
                    {
                        color: colors[0],
                        label: aboveLabel
                    },
                    {
                        color: colors[1],
                        label: belowLabel
                    },
                    {
                        color: 'black',
                        label: 'No data'
                    }
                ];
            }
        }
        else if (viewingMode === 'comparison') {
            if (state.comparisonMode === 'overUnder') {
                const colors = ['limegreen', 'tomato'];
                if (!selectedCounty || selectedCounty.stat === undefined) {
                    console.log('couyrse 1')
                    newLegendData = [
                        {
                            color: colors[0],
                            label: 'Select a county to color in the map!'
                        }
                    ]
                }

                else {
                    let aboveLabel = `Above ${selectedCounty.stat.toLocaleString()}`;
                    let belowLabel = `Below ${selectedCounty.stat.toLocaleString()}`;
                    if (countOrPercentage === 'Percentage') {
                        aboveLabel += '%';
                        belowLabel += '%';
                    }
                    newLegendData = [
                        {
                            color: colors[0],
                            label: aboveLabel
                        },
                        {
                            color: colors[1],
                            label: belowLabel
                        },
                        {
                            color: 'black',
                            label: 'No data'
                        }
                    ];
                }
            }
            if (state.comparisonMode === 'viewCompRange') {
                const colors = ['limegreen', 'tomato'];
                if (!selectedCounty || selectedCounty.stat === undefined) {
                    console.log('couyrse 1')
                    newLegendData = [
                        {
                            color: colors[0],
                            label: 'Select a county to color in the map!'
                        }
                    ]
                }

                else {
                    let aboveLabel = `Within 5000 of ${selectedCounty.stat.toLocaleString()}`;
                    let belowLabel = `Outside 5000 of ${selectedCounty.stat.toLocaleString()}`;
                    if (countOrPercentage === 'Percentage') {
                        aboveLabel += '%';
                        belowLabel += '%';
                    }
                    newLegendData = [
                        {
                            color: colors[0],
                            label: aboveLabel
                        },
                        {
                            color: colors[1],
                            label: belowLabel
                        },
                        {
                            color: 'black',
                            label: 'No data'
                        }
                    ];
                }
            }

        }

        else if (viewingMode === 'quartile') {
            const colors = ['tomato', 'orange', 'lightgreen', 'limegreen'];
            newLegendData = cutoffs
                .filter((cutoff, index) => {
                    // Exclude a cutoff if it is the same as the next one
                    // return index === cutoffs.length - 1 || cutoff !== cutoffs[index + 1];
                    return true;
                }).map((cutoff, index) => {
                    if (index < colors.length) {
                        let keyMessage;
                        if (index === 0) {
                            if (cutoffs[1] == 0) {
                                keyMessage = `${cutoffs[1]?.toLocaleString()}`
                            }
                            else {
                                keyMessage = `Less than ${cutoffs[1]?.toLocaleString()}`;
                            }
                        } else if (index === colors.length - 1) {
                            keyMessage = `More than ${cutoff.toLocaleString()}`;
                        } else {
                            keyMessage = `${cutoff.toLocaleString()} to ${cutoffs[index + 1]?.toLocaleString()}`;
                        }
                        if (countOrPercentage == 'Percentage') {
                            keyMessage += '%';
                        }
                        return {
                            color: colors[index],
                            label: keyMessage
                        };
                    }
                }).filter(item => item).reverse();



            var blackElement = {
                color: 'black',
                label: 'No data'
            };
            newLegendData.push(blackElement);
        }
        setLegendData(newLegendData); // whether the slider or quartile path was used, update the legend
    }

    // given a county, find its color based on the threshold and its value
    const getColor = (countyVal, countyID, sliderVal, viewingMode) => {
        if (countyVal === null) return 'black';
        if (viewingMode === "slider") {
            if (state.comparisonMode === 'overUnder') {
                return countyVal >= sliderVal ? 'limegreen' : 'tomato';
            }
            if (state.comparisonMode === 'viewCompRange') {
                return (Math.abs(countyVal - sliderVal) <= 5000) ? 'limegreen' : 'tomato';
            }
        }
        if (viewingMode === 'comparison') {
            if (state.comparisonMode === 'overUnder') {
                if (countyID === selectedCounty.id) return 'purple';
                return countyVal >= selectedCounty.stat ? 'limegreen' : 'tomato';
            }
            if (state.comparisonMode === 'viewCompRange') {
                if (countyID === selectedCounty.id) return 'purple';
                return (Math.abs(countyVal - selectedCounty.stat) <= 5000) ? 'limegreen' : 'tomato';
            }
        }
        for (let i = 0; i < cutoffs.length - 1; i++) {
            if (countyVal <= cutoffs[i + 1]) {
                // const retVal = ['tomato', 'orange', 'lightgreen', 'limegreen'][i];
                // colorCounts[retVal] += 1;
                return ['tomato', 'orange', 'lightgreen', 'limegreen'][i];
            }
        }
        return 'limegreen';
    };

    // display county data (name, value) on mouse-over
    const handleMouseOver = (countyName, stat) => {
        if (state.viewingMode === 'Comparison') return; // compare mode - forget mouseover
        if (tooltipCountyRef.current && tooltipStatRef.current) {
            tooltipCountyRef.current.textContent = countyName;
            tooltipStatRef.current.textContent = stat;
        }
    };

    const handleMouseOut = () => {
        if (tooltipCountyRef.current && tooltipStatRef.current) {
            tooltipCountyRef.current.textContent = 'Hover over a county to see details!';
            tooltipStatRef.current.textContent = '';
        }
    }

    // if we're in compare mode, handle selection of county
    const handleClick = (countyName, countyID, stat) => {
        if (state.viewingMode === 'comparison') {
            let wikiLink = `https://en.wikipedia.org/wiki/${countyName.replace(/ /g, "_")}`;
            const obj = {
                countyName: countyName,
                id: countyID,
                stat: stat,
                wikiLink: wikiLink
            }
            setSelectedCounty(obj)
        }
    };

    // Function that counts counties per color category
    function getCountyDistribution(data, newCutoffs) {
        const colorCounts = {
            "limegreen": 0,
            "lightgreen": 0,
            "orange": 0,
            "tomato": 0
        }

        // Assign counties to colors based on their values
        data.forEach(item => {
            const countyVal = parseFloat(item[2]);

            if (countyVal === null) {
                return;
            }

            // Determine the color category for each county
            for (let i = 0; i < newCutoffs.length - 1; i++) {
                if (countyVal <= newCutoffs[i + 1]) {
                    const color = ['tomato', 'orange', 'lightgreen', 'limegreen'][i];
                    colorCounts[color] += 1;
                    break;
                }
            }
        });

        // Log results to the console
        const score = scoreDistribution(colorCounts);
        return score;
    }

    // Function to calculate standard deviation
    function calculateStdDev(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    // Function to calculate the sum of absolute differences from the mean
    function calculateSumAbsDiffs(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.abs(val - mean), 0);
    }

    // Function to score the distribution
    function scoreDistribution(distribution) {
        const quartileCounts = Object.values(distribution);
        const stdDevScore = calculateStdDev(quartileCounts);
        const sumAbsDiffsScore = calculateSumAbsDiffs(quartileCounts);

        // Custom scoring: Sum both scores for a comprehensive view
        const totalScore = stdDevScore + sumAbsDiffsScore;

        // Alternatively, you could use a more sophisticated scoring strategy based on your requirements
        return totalScore;
    }

    const scale = 1;
    const width = 960;
    const height = 600;

    // const translateX = (width / 2) - ((width * scale) / 2);
    const translateX = 0;
    const translateY = 0;

    return (
        <svg id="canvas" width="90%" height="90%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
                {countyData.map((county, index) => {
                    const id = county.id.toString();
                    const countyItem = populationData.find(item => {
                        let fipsCode = item[1].slice(-5);
                        if (fipsCode.startsWith('0')) fipsCode = fipsCode.substring(1);
                        return fipsCode === id;
                    });

                    let countyVal = countyItem ? parseFloat(countyItem[2]) : null;
                    let countyID = countyItem ? countyItem[1] : null;

                    return (
                        <path
                            key={index}
                            d={d3.geoPath()(county)}
                            className="county"
                            fill={getColor(countyVal, countyID, sliderVal, state.viewingMode)}
                            onMouseOver={() => handleMouseOver(countyItem ? countyItem[0] : 'Unknown', countyItem ? countyItem[2] : 'Unknown')}
                            onMouseOut={handleMouseOut}
                            onClick={() => handleClick(countyItem ? countyItem[0] : 'Unknown', countyItem ? countyItem[1] : 'Unknown', countyItem ? countyItem[2] : 'Unknown')}
                        />
                    );
                })}
            </g>
        </svg>
    );
};

export default Canvas;