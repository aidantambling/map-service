import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './canvas.scss';

const Canvas = ({ tooltipCountyRef, tooltipStatRef, setLegendData, populationURL, sliderVal, viewingMode}) => {
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
                const newCutoffs = getCutoffPoints(populationResponse.slice(1));
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
                const newCutoffs = getCutoffPoints(populationResponse.slice(1));
                setCutoffs(newCutoffs);
            } catch(error){
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
    function getCutoffPoints(data) {
        const values = data.map(d => +d[2]).sort((a, b) => a - b);
        const quantiles = [];
  
      for (let i = 1; i < 4; i++) {
          const q = d3.quantile(values, i / 4);
          quantiles.push(q);
      }
  
      return [0, ...quantiles, values[values.length - 1]];
    }

    // re-configure the legend
    function updateLegend(cutoffs, viewingMode) {
        let newLegendData = [];

        // cutoffs unnecessary - split by slider value
        if (viewingMode === 'slider'){
            const colors = ['tomato', 'orange'];
            newLegendData = [
                {
                    color: colors[0],
                    label: `Below ${sliderVal.toLocaleString()}`
                },
                {
                    color: colors[1],
                    label: `Above ${sliderVal.toLocaleString()}`
                },
                {
                    color: 'black',
                    label: 'No data'
                }
            ];
        }
        else {
            const colors = ['tomato', 'orange', 'lightgreen', 'limegreen'];
            // Quartile logic
            newLegendData = cutoffs.map((cutoff, index) => {
                if (index < colors.length) {
                    let keyMessage;
                    if (index === 0) {
                        keyMessage = `Less than ${cutoffs[index + 1]?.toLocaleString()}`;
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
            }).filter(item => item);
            
            var blackElement = {
                color: 'black',
                label: 'No data'
            };
            newLegendData.push(blackElement);
        }
        setLegendData(newLegendData); // whether the slider or quartile path was used, update the legend
    }

    // given a county, find its color based on the threshold and its value
    const getColor = (countyVal, sliderVal, viewingMode) => {
        if (viewingMode === "slider"){
            return countyVal >= sliderVal ? 'limegreen' : 'tomato';
        }
        if (countyVal === 0) return 'black';
        for (let i = 0; i < cutoffs.length - 1; i++) {
            if (countyVal <= cutoffs[i + 1]) {
                return ['tomato', 'orange', 'lightgreen', 'limegreen'][i];
            }
        }
        return 'limegreen';
    };

    // display county data (name, value) on mouse-over
    const handleMouseOver  = (countyName, stat) => {
        if (tooltipCountyRef.current && tooltipStatRef.current) {
            tooltipCountyRef.current.textContent = countyName;
            tooltipStatRef.current.textContent = stat;
        }
    };

    return (
        <svg id='canvas'>
            {countyData.map((county, index) => {
                const id = county.id.toString();
                const countyItem = populationData.find(item => {
                    let fipsCode = item[1].slice(-5);
                    if (fipsCode.startsWith('0')) fipsCode = fipsCode.substring(1);
                    return fipsCode === id;
                });
                let countyVal = countyItem ? parseFloat(countyItem[2]) : 0;

                return (
                    <path
                        key={index}
                        d={d3.geoPath()(county)}
                        className="county"
                        fill={getColor(countyVal, sliderVal, viewingMode)}
                        onMouseOver={(event) => {handleMouseOver(countyItem[0], countyItem[2])
                            }
                        }
                        onMouseOut={(event) => {/* Your mouseout logic here */}}
                    />
                );
            })}
        </svg>
    );
};

export default Canvas;