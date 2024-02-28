import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './canvas.scss';

const Canvas = ({ tooltipCountyRef, tooltipStatRef, setLegendData, populationURL}) => {
    const [countyData, setCountyData] = useState([]);
    const [populationData, setPopulationData] = useState([]);
    const [cutoffs, setCutoffs] = useState([]);

    // const populationURL = 'https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0001C&for=county:*';
    const countyURL = 'https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json';

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
                // updateLegend(cutoffs);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);
    

    useEffect(() => {
        // This effect will run whenever `cutoffs` is updated
        console.log('Population Data has been changed to ', populationURL)
        const fetchData = async () => {
            try {
                const populationResponse = await d3.json(populationURL);
                setPopulationData(populationResponse.slice(1));
                const newCutoffs = getCutoffPoints(populationResponse.slice(1));
                setCutoffs(newCutoffs);
                updateLegend(cutoffs);
            } catch(error){
                console.error('Error fetching data:', error);
            }
        }

        fetchData();
    }, [populationURL]); // Add `cutoffs` as a dependency

    useEffect(() => {
        // This effect will run whenever `cutoffs` is updated
        updateLegend(cutoffs);
    }, [cutoffs]); // Add `cutoffs` as a dependency

    const updateDataset = async (url) => {
        const populationResponse = await d3.json(url);
        setPopulationData(populationResponse.slice(1));
        const newCutoffs = getCutoffPoints(populationResponse.slice(1));
        setCutoffs(newCutoffs);
        updateLegend(cutoffs);
    }

    function getCutoffPoints(data) {
        const values = data.map(d => +d[2]).sort((a, b) => a - b);
        const quantiles = [];
  
      for (let i = 1; i < 4; i++) {
          const q = d3.quantile(values, i / 4);
          quantiles.push(q);
      }
  
      return [0, ...quantiles, values[values.length - 1]];
    }

    function updateLegend(cutoffs) {
        const colors = ['tomato', 'orange', 'lightgreen', 'limegreen'];
        const newLegendData = cutoffs.map((cutoff, index) => {
            if (index < 4){
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
                    label: keyMessage, // Add the keyMessage as a property
                };
            }
        }).filter(item => item);

        var blackElement = {
            'color' : 'black',
            'label' : 'No data'
        }
        newLegendData.push(blackElement)
        setLegendData(newLegendData);

  }

    const getColor = (percentage) => {
        if (percentage === 0) return 'black';
        for (let i = 0; i < cutoffs.length - 1; i++) {
            if (percentage <= cutoffs[i + 1]) {
                return ['tomato', 'orange', 'lightgreen', 'limegreen'][i];
            }
        }
        return 'limegreen';
    };

    const handleMouseOver  = (countyName, stat) => {
        // console.log(countyName, stat)
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
                let percentage = countyItem ? parseFloat(countyItem[2]) : 0;

                return (
                    <path
                        key={index}
                        d={d3.geoPath()(county)}
                        className="county"
                        fill={getColor(percentage)}
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