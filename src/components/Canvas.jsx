import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './canvas.scss';

const Canvas = ({ tooltipCountyRef, tooltipStatRef, setLegendData, populationURL, sliderVal, viewingMode }) => {
    const [countyData, setCountyData] = useState([]);
    const [populationData, setPopulationData] = useState([]);
    const [cutoffs, setCutoffs] = useState([]);

    const countyURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

    // initial map render
    useEffect(() => {
        const fetchData = async () => {
            try {
                const countyResponse = await d3.json(countyURL);
                const counties = topojson.feature(countyResponse, countyResponse.objects.counties).features;
                setCountyData(counties);

                const populationResponse = await d3.json(populationURL);
                setPopulationData(populationResponse.slice(1));
                const newCutoffs = getCutoffPoints(populationResponse.slice(1), 5000);
                setCutoffs(newCutoffs);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // re-render the map whenever the API url is changed
    useEffect(() => {
        console.log('Population Data has been changed to ', populationURL)
        const fetchData = async () => {
            try {
                const populationResponse = await d3.json(populationURL);
                setPopulationData(populationResponse.slice(1));

                const roundMatrix = [1, 100, 1000, 2500, 5000, 10000];
                // use the largest roundValue that is sufficiently balanced (score < 1000)
                let optimalVal = -1;
                let optimalScore = -1;
                roundMatrix.forEach(roundVal => {
                    const newCutoffs = getCutoffPoints(populationResponse.slice(1), roundVal);
                    console.log('Rounding to ', roundVal, ': ', newCutoffs);
                    const newScore = getCountyDistribution(populationResponse.slice(1), newCutoffs);
                    if (optimalVal == -1 || newScore < 1000 || newScore < optimalScore) { // if score is uninit, take the score. or, take the highest roundval with reasonable score
                        optimalVal = roundVal;
                        optimalScore = newScore;
                    }
                })
                const newCutoffs = getCutoffPoints(populationResponse.slice(1), optimalVal);
                setCutoffs(newCutoffs);
                console.log('Optimal score: ', optimalVal);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [populationURL]);

    // update the legend whenever we adjust the slider, cutoff points, or viewing mode
    useEffect(() => {
        updateLegend(cutoffs, viewingMode);
    }, [sliderVal, cutoffs, viewingMode])

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
            const colors = ['limegreen', 'tomato'];
            newLegendData = [
                {
                    color: colors[0],
                    label: `Above ${sliderVal.toLocaleString()}`
                },
                {
                    color: colors[1],
                    label: `Below ${sliderVal.toLocaleString()}`
                },
                {
                    color: 'black',
                    label: 'No data'
                }
            ];
        }
        else {
            console.log(cutoffs);
            const colors = ['tomato', 'orange', 'lightgreen', 'limegreen'];
            newLegendData = cutoffs
                .filter((cutoff, index) => {
                    // Exclude a cutoff if it is the same as the next one
                    // return index === cutoffs.length - 1 || cutoff !== cutoffs[index + 1];
                    return true;
                }).map((cutoff, index) => {
                    console.log(cutoff, index)
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
        console.log(newLegendData);
        setLegendData(newLegendData); // whether the slider or quartile path was used, update the legend
    }

    // given a county, find its color based on the threshold and its value
    const getColor = (countyVal, sliderVal, viewingMode) => {
        if (viewingMode === "slider") {
            return countyVal >= sliderVal ? 'limegreen' : 'tomato';
        }
        if (countyVal === null) return 'black';
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
        if (tooltipCountyRef.current && tooltipStatRef.current) {
            tooltipCountyRef.current.textContent = countyName;
            tooltipStatRef.current.textContent = stat;
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
        console.log('County Distribution per Color:', colorCounts);
        const score = scoreDistribution(colorCounts);
        console.log('Score: ', score);
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

    return (
        <svg id='canvas'>
            {countyData.map((county, index) => {
                const id = county.id.toString();
                const countyItem = populationData.find(item => {
                    let fipsCode = item[1].slice(-5);
                    if (fipsCode.startsWith('0')) fipsCode = fipsCode.substring(1);
                    return fipsCode === id;
                });
                let countyVal = countyItem ? parseFloat(countyItem[2]) : null;

                return (
                    <path
                        key={index}
                        d={d3.geoPath()(county)}
                        className="county"
                        fill={getColor(countyVal, sliderVal, viewingMode)}
                        onMouseOver={(event) => {
                            handleMouseOver(countyItem[0], countyItem[2])
                        }
                        }
                        onMouseOut={(event) => {/* Your mouseout logic here */ }}
                    />
                );
            })}
        </svg>
    );
};

export default Canvas;