import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './App.scss';
import Canvas from './components/Canvas';

const App = () => {
    // tooltips
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    const containerRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState((0));

    const [buttonData, setButtonData] = useState([]);
    const buttonsRef = useRef(null);

    const [legendData, setLegendData] = useState([]);
    const [keywordToInfo, setKeywordToInfo] = useState(null)

    const [populationURL, setPopulationURL] = useState('https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0001C&for=county:*');

    const [viewingMode, setViewingMode] = useState('quartile');
    const [sliderVal, setSliderVal] =useState(0);
    useEffect(() => {
        fetch('/apis.json') // Path relative to the public directory
            .then(response => response.json())
            .then(jsonData => setKeywordToInfo(jsonData.Buttons))
            .catch(error => console.error('Error fetching data:', error));
        }, []);
        
    const handleScroll = (scrollAmount) => {
        const newScrollPosition = scrollPosition + scrollAmount;
        if (newScrollPosition > 0 && newScrollPosition < 600){
            setScrollPosition(newScrollPosition);
        }

        containerRef.current.scrollLeft = newScrollPosition;
        console.log(newScrollPosition)
    }

    const renderButtons = (buttonID) => {
        console.log(keywordToInfo[buttonID]);

        const arr = keywordToInfo[buttonID]
        let newButtonData = [];
        for (const key in arr){
            var keyElement = {
                id : key,
                url: arr[key].url,
                label: arr[key].title,
            }
            newButtonData.push(keyElement)
        }
        console.log(newButtonData)
        setButtonData(newButtonData);
    }

    function renderQuartileData() {
        return (
            <div>
                {legendData.map((item, index) => (
                    <li key={index} id="legend-element">
                        <span style={{ backgroundColor: item.color , width: '2rem' , height: '2rem', marginRight: '10%', display: 'flex' }}></span>
                        {item.label}
                    </li>
                ))}
            </div>
        )
    }

    function renderSliderData(){
        // render only below x, above x, and no dta (3 labels)
        // render the slider
        console.log(sliderVal)
        return (
        <div id='sliderBox'>
            <input type="range" id="slider" name="slider" min="0" max="100000" step="5000" onChange={(value) => setSliderVal(value)}/>
            <div id="sliderValue"></div>
        </div>
        );
    }

    return (
        <>
            <div id="titleContainer">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div id="canvasTitleContainer">
                <h2 id='canvasTitle'>Loading....</h2>
            </div>
            <div id='bodyContainer'>
                <div id="canvas-panel">
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURL={populationURL}/>
                </div>
                <div id='info-panel'>
                    <div id="tooltips">
                        <div id='tooltip-county' ref={tooltipCountyRef}></div>
                        <div id='tooltip-stat' ref={tooltipStatRef}></div>
                    </div>
                    <div id="viewChanger">
                        <button id="quartileButton" className={viewingMode === 'quartile' ? 'active-mode-btn' : ''} onClick={() => setViewingMode('quartile')}>Quartile View</button>
                        <button id="sliderButton" className={viewingMode === 'slider' ? 'active-mode-btn' : ''}onClick={() => setViewingMode('slider')}>Slider View</button>
                        <button id="comparisonButton" className={viewingMode === 'comparison' ? 'active-mode-btn' : ''}onClick={() => setViewingMode('comparison')}>Comparison View</button>
                    </div>
                    <div id="legend-scale">
                        <ul id='legend-labels'>
                            {viewingMode === 'quartile' && <div className="content" style={{height: '100%'}}>{renderQuartileData()}</div>}
                            {viewingMode === 'slider' && <div className="content" style={{height: '100%'}}>{renderSliderData()}</div>}
                            {viewingMode === 'comparison' && <div className="content" style={{height: '100%'}}>TBD</div>}

                        </ul>
                    </div>
                    <div id='description'>Loading....</div>
                    <div id="selectionContainer">
                        <button id="slideLeft" type="button" onClick={()=>(handleScroll(-150))}>Prev</button>
                        <div id="buttonSelector" ref={containerRef}>
                            <button className="selectionButton" id="All" onClick={button => renderButtons(button.target.id)}>All Population</button>
                            <button className="selectionButton" id="Gender" onClick={button => renderButtons(button.target.id)}>Population by Gender</button>
                            <button className="selectionButton" id="Race" onClick={button => renderButtons(button.target.id)}>Population by Race</button>
                            <button className="selectionButton" id="Sexuality" onClick={button => renderButtons(button.target.id)}>Population by Sexuality</button>
                            <button className="selectionButton" id="Institutionalized" onClick={button => renderButtons(button.target.id)}>Institutionalized Population</button>
                            <button className="selectionButton" id="Median Age" onClick={button => renderButtons(button.target.id)}>Population by Median Age</button>
                        </div>
                        <button id="slideRight" type="button" onClick={()=>(handleScroll(150))}>Next</button>
                    </div>
                    <div id="boxContainer">
                        <div id="buttonBox" ref={buttonsRef}>
                            {buttonData.map((item, index) => (
                                <button key={index} className="datasetButton" id={item.id} onClick={() => setPopulationURL(item.url)}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div id="percent-count-selector">
                        <button id="countButton" className="active">Count View</button>
                        <button id="percentButton">Percentage View</button>
                    </div>
                </div>
                <div id="second-panel">
                    <div id="ageGroupContainer">

                    </div>
                </div>
            </div>  
        </>
    );
};

export default App;