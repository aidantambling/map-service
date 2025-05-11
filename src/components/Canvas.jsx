import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { zoom } from 'd3-zoom'
import { ButtonGroup } from '@mui/material';
import * as topojson from 'topojson-client';
import './canvas.scss';
import { geoPath, geoAlbersUsa } from 'd3-geo';

const Canvas = ({ tooltipCountyRef, tooltipStatRef, setLegendData, populationURLs, sliderVal, state, dispatch, countOrPercentage, setCountOrPercentage, setSliderSettings, selectedCounty, setSelectedCounty, setDataTitle, selectedPalette }) => {
    const [countyData, setCountyData] = useState([]);
    const [populationData, setPopulationData] = useState([]);
    const [cutoffs, setCutoffs] = useState([]);

    const [colorPalette, setColorPalette] = useState([])

    const svgRef = useRef();
    const zoomRef = useRef();

    // const countyURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

    const zoomBehavior = d3.zoom()
        .scaleExtent([0.9, 8])
        .on('zoom', (event) => {
            d3.select(svgRef.current).select('g').attr('transform', event.transform);
        });

    useEffect(() => {
        d3.select(svgRef.current).call(zoomBehavior);
    }, []);

    // Store zoomBehavior in a ref
    zoomRef.current = zoomBehavior;

    // initial map render
    useEffect(() => {
        const fetchData = async () => {
            try {
                const countyResponse = await d3.json('simple.json');
                const counties = topojson.feature(countyResponse, countyResponse.objects.merged).features;
                setCountyData(counties);

                const populationResponse = await d3.json(populationURLs[0]);
                setPopulationData(populationResponse.slice(1));
                const newCutoffs = getCutoffPoints(populationResponse.slice(1), 5000);
                setCutoffs(newCutoffs);
                setDataTitle("Total Population");
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // re-render the map whenever the API url is changed
    useEffect(() => {
        console.log('Population Data have been changed to ', populationURLs)
        const fetchData = async () => {
            try {
                const fetchPromises = populationURLs.map(url => {
                    return d3.json(url);
                }); const responses = await Promise.all(fetchPromises);

                responses.forEach((response, index) => {
                    if (!response || !Array.isArray(response)) {
                        throw new Error(`Invalid response structure from URL ${populationURLs[index]}`);
                    }
                });
                const combinedDataMap = new Map();

                responses.forEach(response => {
                    if (!response || !Array.isArray(response)) {
                        throw new Error('Invalid response structure');
                    }
                    response.slice(1).forEach(row => {
                        const countyId = row[1];
                        const value = +row[2];
                        if (combinedDataMap.has(countyId)) {
                            combinedDataMap.get(countyId)[2] = (parseFloat(combinedDataMap.get(countyId)[2]) + value).toString();
                        } else {
                            combinedDataMap.set(countyId, [...row]);
                        }
                    });
                });

                const combinedDataArray = Array.from(combinedDataMap.values());
                setPopulationData(combinedDataArray);

                const values = combinedDataArray.map(d => +d[2]); // Assuming the value to analyze is in the second column
                let highQuantile;
                if (countOrPercentage == 'Count') {
                    highQuantile = Math.ceil(d3.quantile(values.sort((a, b) => a - b), 0.95) / 20) * 20;
                    setSliderSettings(prev => ({
                        ...prev,
                        max: getRoundedSliderSettings(highQuantile, 20, 250).max,
                        step: getRoundedSliderSettings(highQuantile, 20, 250).step
                    }))
                }
                else {
                    highQuantile = Math.ceil(d3.quantile(values.sort((a, b) => a - b), 0.95));
                    setSliderSettings(prev => ({
                        ...prev,
                        max: getRoundedSliderSettings(highQuantile, 20, 0.5).max,
                        step: getRoundedSliderSettings(highQuantile, 20, 0.5).step
                    }))
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
                    if (countOrPercentage == 'Percentage' && newCutoffs[1] == 100 && newCutoffs[1] == newCutoffs[2] && newCutoffs[2] == newCutoffs[3] && newCutoffs[3] == newCutoffs[4]) {
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
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        fetchData();
    }, [populationURLs, state.viewingMode]);

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
        if (selectedPalette) updateLegend(cutoffs, state.viewingMode);
    }, [sliderVal, cutoffs, state.viewingMode, selectedCounty, selectedPalette])

    // whenever we access a new data API, we need to re-compute the cutoff points for quartiles
    function getCutoffPoints(data, roundVal) {
        const values = data.map(d => +d[2]).sort((a, b) => a - b);
        const quantiles = [];

        for (let i = 1; i < 4; i++) {
            const rawq = d3.quantile(values, i / 4);
            const q = Math.round(rawq / roundVal) * roundVal
            quantiles.push(q);
        }

        return [0, ...quantiles, values[values.length - 1]];
    }

    // re-configure the legend
    function updateLegend(cutoffs, viewingMode) {
        let legend = [];

        // cutoffs unnecessary - split by slider value
        if (viewingMode === 'Slider') {
            if (state.comparisonMode === 'overUnder') {
                let aboveLabel = `Above ${sliderVal.toLocaleString()}`;
                let belowLabel = `Below ${sliderVal.toLocaleString()}`;
                legend = [
                    {
                        color: selectedPalette[3],
                        label: aboveLabel
                    },
                    {
                        color: selectedPalette[0],
                        label: belowLabel
                    },
                    {
                        color: 'black',
                        label: 'No data'
                    }
                ];
            }
            if (state.comparisonMode === 'viewCompRange') {
                let aboveLabel = `Within 5000 of ${sliderVal.toLocaleString()}`;
                let belowLabel = `Outside 5000 of ${sliderVal.toLocaleString()}`;
                if (countOrPercentage === 'Percentage') {
                    aboveLabel += '%';
                    belowLabel += '%';
                }
                legend = [
                    {
                        color: selectedPalette[0],
                        label: aboveLabel
                    },
                    {
                        color: selectedPalette[1],
                        label: belowLabel
                    },
                    {
                        color: 'black',
                        label: 'No data'
                    }
                ];
            }
        }
        else if (viewingMode === 'Comparison') {
            if (state.comparisonMode === 'overUnder') {
                const colors = ['limegreen', 'tomato'];
                if (!selectedCounty || selectedCounty.stat === undefined) {
                    legend = [
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
                    legend = [
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
                    legend = [
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
                    legend = [
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
        else if (viewingMode === 'Quartile') {
            const [min, q1, q2, q3, max] = cutoffs;

            if (q1 === q2 && q2 === q3) {
                // Case 1: q1 = q2 = q3
                legend = [
                    { color: selectedPalette[0], label: q1 === 0 ? '0' : `Less than ${q1?.toLocaleString()}` },
                    { color: selectedPalette[3], label: `Greater than ${q1?.toLocaleString()}` }
                ];
                setColorPalette([selectedPalette[0], selectedPalette[3]])
            } else if (q1 === q2) {
                // Case 2a: q1 = q2
                legend = [
                    { color: selectedPalette[0], label: q1 === 0 ? '0' : `Less than ${q1?.toLocaleString()}` },
                    { color: selectedPalette[1], label: `${q1?.toLocaleString()} to ${q3?.toLocaleString()}` },
                    { color: selectedPalette[3], label: `Greater than ${q3?.toLocaleString()}` }
                ];
                setColorPalette([selectedPalette[0], selectedPalette[1], selectedPalette[3]])
            } else if (q2 === q3) {
                // Case 2b: q2 = q3
                legend = [
                    { color: selectedPalette[0], label: q1 === 0 ? '0' : `Less than ${q1?.toLocaleString()}` },
                    { color: selectedPalette[1], label: `${q1?.toLocaleString()} to ${q2?.toLocaleString()}` },
                    { color: selectedPalette[3], label: `Greater than ${q2?.toLocaleString()}` }
                ];
                setColorPalette([selectedPalette[0], selectedPalette[1], selectedPalette[3]])
            } else {
                // Case 3: All unique
                legend = [
                    { color: selectedPalette[0], label: q1 === 0 ? '0' : `Less than ${q1?.toLocaleString()}` },
                    { color: selectedPalette[1], label: `${q1?.toLocaleString()} to ${q2?.toLocaleString()}` },
                    { color: selectedPalette[2], label: `${q2?.toLocaleString()} to ${q3?.toLocaleString()}` },
                    { color: selectedPalette[3], label: `Greater than ${q3?.toLocaleString()}` }
                ];
                setColorPalette([selectedPalette[0], selectedPalette[1], selectedPalette[2], selectedPalette[3]])
            }

            var blackElement = {
                color: 'black',
                label: 'No data'
            };
            legend.push(blackElement);
        }
        if (legend) {
            setLegendData(legend); // whether the slider or quartile path was used, update the legend
        }
    }

    // given a county, find its color based on the threshold and its value
    const getColor = (countyVal, countyID, sliderVal, viewingMode) => {
        if (countyVal === null) return 'black';
        if (viewingMode === "Slider") {
            if (state.comparisonMode === 'overUnder') {
                return countyVal >= sliderVal ? selectedPalette[3] : selectedPalette[0];
            }
            if (state.comparisonMode === 'viewCompRange') {
                return (Math.abs(countyVal - sliderVal) <= 5000) ? selectedPalette[0] : selectedPalette[3];
            }
        }
        if (viewingMode === 'Comparison') {
            if (state.comparisonMode === 'overUnder') {
                if (countyID === selectedCounty.id) return 'purple';
                return countyVal >= selectedCounty.stat ? 'limegreen' : 'tomato';
            }
            if (state.comparisonMode === 'viewCompRange') {
                if (countyID === selectedCounty.id) return 'purple';
                return (Math.abs(countyVal - selectedCounty.stat) <= 5000) ? 'limegreen' : 'tomato';
            }
        }

        let filteredCutoffs = cutoffs.filter((cutoff, index) => {
            if (index == 0) return true;
            return index === cutoffs.length - 1 || cutoff !== cutoffs[index + 1];
        })

        for (let i = 0; i < filteredCutoffs.length - 1; i++) {
            if (countyVal <= filteredCutoffs[i + 1]) {
                return colorPalette[i];
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
            tooltipCountyRef.current.textContent = 'Hover over a county';
            tooltipStatRef.current.textContent = 'to see details!';
        }
    }

    // if we're in compare mode, handle selection of county
    const handleClick = (countyName, countyID, stat) => {
        if (state.viewingMode === 'Comparison') {
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

    const width = 960;
    const height = 600;

    const zoomIn = () => {
        d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 1.2);
    };

    const zoomOut = () => {
        d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, 0.8);
    };

    const resetZoom = () => {
        d3.select(svgRef.current).transition().call(zoomRef.current.transform, d3.zoomIdentity);
    };



    const [path, setPath] = useState(null);
    const [translateX, setTranslateX] = useState(0);
    const [translateY, setTranslateY] = useState(0);
    const [scale, setScale] = useState(1);

    const buttons = [
        <button className="zoom-button" onClick={() => zoomIn()}>+</button>,
        <button className="zoom-button" onClick={() => zoomOut()}>-</button>,
        <button className="zoom-button" onClick={() => resetZoom()}>Reset</button>,
    ];

    useEffect(() => {
        const projection = geoAlbersUsa()
            .fitSize([width, height], { type: "FeatureCollection", features: countyData });

        const pathGenerator = geoPath().projection(projection);

        // Compute bounds and scale
        const bounds = pathGenerator.bounds({ type: "FeatureCollection", features: countyData });
        const dx = bounds[1][0] - bounds[0][0];
        const dy = bounds[1][1] - bounds[0][1];
        const x = (bounds[0][0] + bounds[1][0]) / 2;
        const y = (bounds[0][1] + bounds[1][1]) / 2;
        const scale = 0.9 / Math.max(dx / width, dy / height);
        const translate = [width / 2 - scale * x - 75, height / 2 - scale * y];

        setTranslateX(translate[0]);
        setTranslateY(translate[1]);
        setScale(scale);
        setPath(() => pathGenerator);
    }, [countyData, width, height]);

    return (
        <div className='map-container'>
            <ButtonGroup orientation="vertical" aria-label="Vertical button group" className="zoom-buttons">
                {buttons}
            </ButtonGroup>
            <svg ref={svgRef} id="canvas" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
                <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
                    {countyData.map((county, index) => {
                        const id = county.id.toString();
                        const countyItem = populationData.find(item => {
                            let fipsCode = item[1].slice(-5);
                            // if (fipsCode.startsWith('0')) fipsCode = fipsCode.substring(1);
                            return fipsCode === id;
                        });

                        let countyVal = countyItem ? parseFloat(countyItem[2]) : null;
                        let countyID = countyItem ? countyItem[1] : null;

                        return (
                            <path
                                key={index}
                                d={path(county)}
                                className="county"
                                fill={getColor(countyVal, countyID, sliderVal, state.viewingMode)}
                                onMouseOver={() => { handleMouseOver(countyItem ? countyItem[0] : 'Unknown', countyItem ? countyItem[2] : 'Unknown') }}
                                onMouseOut={handleMouseOut}
                                onClick={() => handleClick(countyItem ? countyItem[0] : 'Unknown', countyItem ? countyItem[1] : 'Unknown', countyItem ? countyItem[2] : 'Unknown')}
                            />
                        );
                    })}
                </g>
            </svg>

        </div>
    );
};

export default Canvas;