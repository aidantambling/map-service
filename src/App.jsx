import React, { useState, useReducer, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import './App.scss';
import Canvas from './components/Canvas';
import { generateAgeGroupSchema, generateRaceGroupSchema } from './components/schemaGenerators';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

const reducer = (state, action) => {
    switch (action.type) {
        case 'viewQuartile':
            return { viewingMode: 'quartile' };
        case 'viewSlider':
            return { viewingMode: 'slider' };
        case 'viewComparison':
            return { viewingMode: 'comparison' };
        case 'viewOverUnder':
            return { viewingMode: 'comparison', comparisonMode: 'overUnder' };
        case 'viewCompRange':
            return { viewingMode: 'comparison', comparisonMode: 'viewCompRange' };
        default:
            throw new Error();
    }
}


const App = () => {
    const [state, dispatch] = useReducer(reducer, { viewingMode: 'quartile', comparisonMode: 'over/under' })
    const [populationURL, setPopulationURL] = useState('https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0001C&for=county:*'); // API access URL - passed to Canvas.jsx
    const [keywordToInfo, setKeywordToInfo] = useState(null); // stores .json data to interpret/access API URLs

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    // slider state values
    const [sliderMax, setSliderMax] = useState(100000);
    const [sliderStep, setSliderStep] = useState(5000);
    const [sliderVal, setSliderVal] = useState(0);

    // dataset buttons-related
    const buttonsRef = useRef(null); // contains dataset and subdataset buttons
    const [buttonData, setButtonData] = useState([]); // track the dataset buttons that should be rendered
    const [activeDatasetClassButton, setactiveDatasetClassButton] = useState("All");
    const [activeDatasetButton, setActiveDatasetButton] = useState("populationDataBtn");
    const [activeSubDatasetButton, setActiveSubDatasetButton] = useState("populationDataBtn");

    // dataset context elements
    const [dataDescription, setDataDescription] = useState("Loading...");
    const [dataTitle, setDataTitle] = useState("Loading...");
    const [legendData, setLegendData] = useState([]);

    // change the data from a "count" context to a "percentage" context, and vice-versa
    const [countOrPercentage, setCountOrPercentage] = useState("Count");

    // changing the view mode
    const [selectedCounty, setSelectedCounty] = useState([]);

    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

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
            setDataDescription(keywordToInfo["All"]["populationDataBtn"].description);
            setDataTitle(keywordToInfo["All"]["populationDataBtn"].title);
        }
    }, [keywordToInfo]);

    useEffect(() => {
        setSliderVal("0");
    }, [populationURL])

    // load only the legend for quartile view
    function renderQuartileData() {
        return (
            <div>
                {legendData.map((item, index) => (
                    <li key={index} id="legend-element">
                        <span style={{ backgroundColor: item.color, width: '2rem', height: '2rem', marginRight: '10%', display: 'flex' }}></span>
                        {item.label}
                    </li>
                ))}
            </div>
        )
    }

    // load the legend (same as quartile view - the legend has alr been updated via useEffect in Canvas.jsx), and load the slider itself as well
    function renderSliderData() {
        let renderSliderVal = sliderVal;
        if (countOrPercentage === 'Percentage') {
            renderSliderVal += "%";
        }

        return (
            <>
                {renderQuartileData()}
                <div id='sliderBox'>
                    <input className="slider"
                        type="range"
                        id="slider"
                        name="slider"
                        min="0"
                        max={sliderMax.toString()}
                        step={sliderStep.toString()}
                        value={sliderVal}
                        onChange={(v) => setSliderVal(v.target.value)} />
                    <div id="sliderValue">{renderSliderVal}</div>
                </div>
            </>
        );
    }

    function renderComparisonData() {
        return (
            <>
                {selectedCounty.countyName}
                <br></br>
                {selectedCounty.stat}
                {renderQuartileData()}
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
        if (item.id !== "maleDataBtn" && item.id !== "femaleDataBtn" && item.id !== "hispanicBtn") {
            configurePopulationURL(item.url);
            setDataDescription(item.description);
            setDataTitle(item.label);
            // console.log(item);
            return;
        }

        // otherwise, we need to update the button data to display the children buttons
        let schema;
        if (item.id === "maleDataBtn" || item.id === "femaleDataBtn") {
            const gender = item.id === "maleDataBtn" ? "Male" : "Female";
            const offset = item.id === "maleDataBtn" ? 26 : 50;
            schema = generateAgeGroupSchema(gender, offset);
        } else if (item.id === "hispanicBtn") {
            schema = generateRaceGroupSchema("Hispanic");
        }

        let newButtonData = [{
            id: item.id + '-all', // Unique ID for the 'All' button
            url: item.url,
            label: `All ${item.label}`, // Label for the 'All' button
            desc: `All ${item.description}` // Description for the 'All' button
        }];

        newButtonData.push(...Object.keys(schema).map(key => ({
            id: key,
            url: schema[key].url,
            label: schema[key].title,
            desc: schema[key].description
        })));

        // If the item already has children displayed and we click it again, we want to collapse the sub-menu - remove the children from the new data
        if (item.children && item.children.length > 0) {
            item.children = [];
            newButtonData = [];
        }
        const updatedButtonData = buttonData.map(button => {
            if (button.id === item.id) {
                return { ...button, children: newButtonData };
            }
            return button;
        });
        setButtonData(updatedButtonData);
    }

    // abstracting useState setPopulationURL to adjust the API access based on whether we are in count or percent mode
    const configurePopulationURL = (url) => {
        // console.log(countOrPercentage)
        if (countOrPercentage === "Percentage") {
            url = url.replace('C&for', 'P&for');
        }
        else if (countOrPercentage === "Count") {
            url = url.replace('P&for', 'C&for');
        }
        setPopulationURL(url);
    }

    // if count or percentage is changed, we should change the url without having to re-select the dataset button we have selected
    useEffect(() => {
        configurePopulationURL(populationURL);
    }, [countOrPercentage])

    const responsive = {
        superLargeDesktop: {
            // the naming can be any, depends on you.
            breakpoint: { max: 4000, min: 3000 },
            items: 5
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1
        }
    };

    const toggleSideMenu = () => {
        setIsSideMenuOpen(!isSideMenuOpen);
    };

    const toggleViewMenu = () => {
        setIsViewMenuOpen(!isViewMenuOpen);
    };

    return (
        <>
            <div id="titleContainer">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div id="canvasTitleContainer">
                <h2 id='canvasTitle'>{dataTitle}</h2>
            </div>
            <div id='bodyContainer'>
                <div id="canvas-panel">
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURL={populationURL} sliderVal={sliderVal} viewingMode={state.viewingMode} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderMax={setSliderMax} setSliderStep={setSliderStep} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />
                </div>
                <div id='info-panel'>
                    <div id="tooltips">
                        <div id='tooltip-county' ref={tooltipCountyRef}></div>
                        <div id='tooltip-stat' ref={tooltipStatRef}></div>
                    </div>
                    <button id="toggleSideMenuButton" onClick={toggleViewMenu}>Change View</button>
                    {isViewMenuOpen && (
                        <div id="viewChanger">
                            <button id="quartileButton" className={state.viewingMode === 'quartile' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewQuartile' })}>Quartile View</button>
                            <button id="sliderButton" className={state.viewingMode === 'slider' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewSlider' })}>Slider View</button>
                            <button id="comparisonButton" className={state.viewingMode === 'comparison' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewComparison' })}>Comparison View</button>
                            {/* <button id="compRangeButton" className={state.viewingMode === 'comprange' ? 'active-mode-btn' : ''} onClick={() => setViewingMode('comprange')}>Comparison Range View</button> */}
                        </div>
                    )}
                    <div id="legend-scale">
                        <ul id='legend-labels'>
                            {state.viewingMode === 'quartile' && <div className="content" style={{ height: '100%' }}>{renderQuartileData()}</div>}
                            {state.viewingMode === 'slider' && <div className="content" style={{ height: '100%' }}>{renderSliderData()}</div>}
                            {state.viewingMode === 'comparison' && <div className="content" style={{ height: '100%' }}>{renderComparisonData()}</div>}
                        </ul>
                    </div>
                    <div id='description'>{dataDescription}</div>
                    {state.viewingMode === 'comparison' && (
                        <>
                            <button onClick={() => dispatch({ type: 'viewOverUnder' })}>Over/Under</button>
                            <button onClick={() => dispatch({ type: 'viewCompRange' })}>Range</button>
                            {state.comparisonMode}
                        </>
                    )}
                    <button id="toggleSideMenuButton" onClick={toggleSideMenu}>Change Dataset</button>

                    {isSideMenuOpen && (
                        <div className="sideMenu">
                            <div className="sideMenuContent">
                                <button id="closeSideMenuButton" onClick={toggleSideMenu}>Close</button>
                                <Carousel
                                    centerMode={false}
                                    customTransition="all 0.3s linear"
                                    draggable={true}
                                    focusOnSelect={true}
                                    keyBoardControl={true}
                                    renderArrowsWhenDisabled={false}
                                    responsive={responsive}
                                    slidesToSlide={2}
                                    swipeable>
                                    <button className={activeDatasetClassButton === 'All' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="All" onClick={button => renderButtons(button.target.id)}>All Population</button>
                                    <button className={activeDatasetClassButton === 'Gender' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Gender" onClick={button => renderButtons(button.target.id)}>Population by Gender</button>
                                    <button className={activeDatasetClassButton === 'Race' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Race" onClick={button => renderButtons(button.target.id)}>Population by Race</button>
                                    <button className={activeDatasetClassButton === 'Sexuality' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Sexuality" onClick={button => renderButtons(button.target.id)}>Population by Sexuality</button>
                                    <button className={activeDatasetClassButton === 'Institutionalized' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Institutionalized" onClick={button => renderButtons(button.target.id)}>Institutionalized Population</button>
                                    <button className={activeDatasetClassButton === 'Median Age' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Median Age" onClick={button => renderButtons(button.target.id)}>Population by Median Age</button>
                                </Carousel>
                                <div id="boxContainer">
                                    <div id="buttonBox" ref={buttonsRef}>
                                        {buttonData.map((item, index) => (
                                            <React.Fragment key={index}>
                                                <button className={activeDatasetButton === item.id ? 'selectedDatasetButton' : 'datasetButton'} id={item.id} onClick={() => renderSubButtons(item)}>
                                                    {item.label}
                                                </button>
                                                {item.children.map((child, childIndex) => (
                                                    <button key={childIndex} className={activeSubDatasetButton === child.id ? "selectedDatasetButton" : "datasetButton"} onClick={() => {
                                                        configurePopulationURL(child.url);
                                                        setActiveSubDatasetButton(child.id);
                                                        setDataDescription(child.desc);
                                                        setDataTitle(child.label);
                                                    }}>
                                                        {child.label}
                                                    </button>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                <div id="percent-count-selector">
                                    <button id="countButton" className={countOrPercentage === 'Count' ? 'count-percent-buttons-active' : 'count-percent-buttons'} onClick={() => setCountOrPercentage('Count')}>Count View</button>
                                    <button id="percentButton" className={countOrPercentage === 'Percentage' ? 'count-percent-buttons-active' : 'count-percent-buttons'} onClick={() => setCountOrPercentage('Percentage')}>Percentage View</button>
                                </div>
                            </div>
                        </div>

                    )}
                </div>
            </div>
        </>
    );
};

export default App;