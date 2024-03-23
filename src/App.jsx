import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './App.scss';
import Canvas from './components/Canvas';
import { generateAgeGroupSchema, generateRaceGroupSchema } from './components/schemaGenerators';

const App = () => {
    const [populationURL, setPopulationURL] = useState('https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0001C&for=county:*'); // API access URL - passed to Canvas.jsx
    const [keywordToInfo, setKeywordToInfo] = useState(null); // stores .json data to interpret/access API URLs

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);
    
    // used to facilitate scroll over dataset class buttons
    const containerRef = useRef(null);
    const [scrollPosition, setScrollPosition] = useState((0));

    // dataset buttons-related
    const buttonsRef = useRef(null); // contains dataset and subdataset buttons
    const [buttonData, setButtonData] = useState([]); // track the dataset buttons that should be rendered
    const [activeDatasetClassButton, setactiveDatasetClassButton] = useState("All");
    const [activeDatasetButton, setActiveDatasetButton] = useState("populationDataBtn");

    // dataset context elements
    const [dataDescription, setDataDescription] = useState("Loading...");
    const [legendData, setLegendData] = useState([]);

    // changing the view mode
    const [viewingMode, setViewingMode] = useState('quartile');
    const [sliderVal, setSliderVal] =useState(0);

    // initial fetch of API data
    useEffect(() => {
        fetch('/apis.json') // Path relative to the public directory
            .then(response => response.json())
            .then(jsonData => setKeywordToInfo(jsonData.Buttons))
            .catch(error => console.error('Error fetching data:', error));
        }, []);

    // when API is confirmed as fetched, or is changed (?), render the 'All" dataset buttons
    useEffect(() => {
        if (keywordToInfo) {
            renderButtons("All");
        }
    }, [keywordToInfo]); 
        
    // scroll thru the dataset class buttons
    const handleScroll = (scrollAmount) => {
        const newScrollPosition = scrollPosition + scrollAmount;
        if (newScrollPosition > 0 && newScrollPosition < 600){
            setScrollPosition(newScrollPosition);
        }

        containerRef.current.scrollLeft = newScrollPosition;
    }

    // load only the legend for quartile view
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

    // load the legend (same as quartile view - the legend has alr been updated via useEffect in Canvas.jsx), and load the slider itself as well
    function renderSliderData(){
        return (
            <>
                {renderQuartileData()}
                <div id='sliderBox'>
                    <input type="range" id="slider" name="slider" min="0" max="100000" step="5000" onChange={(v) => setSliderVal(v.target.value)}/>
                    <div id="sliderValue">{sliderVal}</div>
                </div>
            </>
        );
    }

    // when a class button is clicked, render its contents (e.g. male, female)
    const renderButtons = (buttonID) => {
        let newButtonData = [];
        const obj = keywordToInfo[buttonID];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) { // Checking if the key is a property of the object
                const item = obj[key];
                var keyElement = {
                    id: key,
                    url: item.url,
                    label: item.title,
                    description: item.description,
                    children: []
                };
                newButtonData.push(keyElement);
            }
        }
        setButtonData(newButtonData); // set the button data (to be rendered) as the data we extracted from the .json
        setactiveDatasetClassButton(buttonID); // set the class button as active
    };

    // if a dataset button has children (male, female, hispanic), render its children below it
    const renderSubButtons = (item) => {
        setActiveDatasetButton(item.id); // set the dataset button as active

        // for a dataset button w/ no children, just render the map and update the display
        if (item.id !== "maleDataBtn" && item.id !== "femaleDataBtn" && item.id !== "hispanicBtn" ){
            setPopulationURL(item.url);
            setDataDescription(item.description);
            return;
        }

        // otherwise, we need to update the button data to display the children buttons
        let schema;
        if (item.id === "maleDataBtn" || item.id === "femaleDataBtn") {
            const gender = item.id === "maleDataBtn" ? "Male" : "Female";
            const offset = item.id === "maleDataBtn" ? 26 : 50;
            schema = generateAgeGroupSchema(gender, offset);
        } else if (item.id === "hispanicBtn"){
            schema = generateRaceGroupSchema("Hispanic");
        }

        let newButtonData = Object.keys(schema).map(key => ({
            id: key,
            url: schema[key].url,
            label: schema[key].title,
            desc: schema[key].description
        }));

        // Update the children of the category button
        if (item.children && item.children.length > 0){
            item.children = [];
            newButtonData = [];
            // const updatedButtonData = buttonData.map(button => {
            //     if (button.id === item.id) {
            //         return { ...button, children: [] };
            //     }
            //     return button;
            // });
            // setButtonData(updatedButtonData);
            // return;
        }
        const updatedButtonData = buttonData.map(button => {
            if (button.id === item.id) {
                return { ...button, children: newButtonData };
            }
            return button;
        });    
        setButtonData(updatedButtonData);
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
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURL={populationURL} sliderVal={sliderVal} viewingMode={viewingMode}/>
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
                    <div id='description'>{dataDescription}</div>
                    <div id="selectionContainer">
                        <button id="slideLeft" type="button" onClick={()=>(handleScroll(-150))}>Prev</button>
                        <div id="buttonSelector" ref={containerRef}>
                            <button className={activeDatasetClassButton === 'All' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="All" onClick={button => renderButtons(button.target.id)}>All Population</button>
                            <button className={activeDatasetClassButton === 'Gender' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Gender" onClick={button => renderButtons(button.target.id)}>Population by Gender</button>
                            <button className={activeDatasetClassButton === 'Race' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Race" onClick={button => renderButtons(button.target.id)}>Population by Race</button>
                            <button className={activeDatasetClassButton === 'Sexuality' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Sexuality" onClick={button => renderButtons(button.target.id)}>Population by Sexuality</button>
                            <button className={activeDatasetClassButton === 'Institutionalized' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Institutionalized" onClick={button => renderButtons(button.target.id)}>Institutionalized Population</button>
                            <button className={activeDatasetClassButton === 'Median Age' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Median Age" onClick={button => renderButtons(button.target.id)}>Population by Median Age</button>
                        </div>
                        <button id="slideRight" type="button" onClick={()=>(handleScroll(150))}>Next</button>
                    </div>
                    <div id="boxContainer">
                        <div id="buttonBox" ref={buttonsRef}>
                            {buttonData.map((item, index) => (
                                <React.Fragment key={index}>
                                    <button className={activeDatasetButton === item.id ? 'selectedDatasetButton' : 'datasetButton'} id={item.id} onClick={() => renderSubButtons(item)}>
                                        {item.label}
                                    </button>
                                    {item.children.map((child, childIndex) => (
                                        <button key={childIndex} className="datasetButton" onClick={() => setPopulationURL(child.url)}>
                                            {child.label}
                                        </button>
                                    ))}
                                </React.Fragment>
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