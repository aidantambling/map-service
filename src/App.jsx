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
            return { viewingMode: 'slider', comparisonMode: 'overUnder' };
        case 'viewComparison':
            return { viewingMode: 'comparison', comparisonMode: 'overUnder' };
        case 'viewOverUnder':
            return { viewingMode: state.viewingMode, comparisonMode: 'overUnder' };
        case 'viewCompRange':
            return { viewingMode: state.viewingMode, comparisonMode: 'viewCompRange' };
        default:
            throw new Error();
    }
}

// const datasetReducer = (state, action) => {
//     switch (action.type) {
//         case ''
//     }
// }


const App = () => {
    const [state, dispatch] = useReducer(reducer, { viewingMode: 'quartile', comparisonMode: 'over/under' })

    const [populationURLs, setPopulationURLs] = useState([
        'https://api.census.gov/data/2020/dec/dp?get=NAME,GEO_ID,DP1_0001C&for=county:*'
    ]);
    const [keywordToInfo, setKeywordToInfo] = useState(null); // stores .json data to interpret/access API URLs

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    const [jewish, setJewish] = useState([]);

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

    // combine into reducer:
    const [gender, setGender] = useState('');
    const [race, setRace] = useState('All');
    const [selectedAges, setSelectedAges] = useState([]);

    // initial fetch of API data
    useEffect(() => {
        console.log(typeof (populationURLs))
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
    }, [populationURLs])

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
                <br />
                <a href={selectedCounty.wikiLink}>Wikipedia Link</a>
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
    // TODO: HAS NOT BEEN ADAPTED FOR MULTI-URL APPROACH
    const configurePopulationURL = (url) => {
        // url = url[0];
        // // console.log(countOrPercentage)
        // if (countOrPercentage === "Percentage") {
        //     url = url.replace('C&for', 'P&for');
        // }
        // else if (countOrPercentage === "Count") {
        //     url = url.replace('P&for', 'C&for');
        // }
        // setPopulationURLs(url);
    }

    // if count or percentage is changed, we should change the url without having to re-select the dataset button we have selected
    useEffect(() => {
        configurePopulationURL(populationURLs);
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

    const ageRanges = [
        "All", "Under 5 years", "5 to 9 years", "10 to 14 years", "15 to 17 years",
        "18 and 19 years", "20 years", "21 years", "22 to 24 years",
        "25 to 29 years", "30 to 34 years", "35 to 39 years", "40 to 44 years",
        "45 to 49 years", "50 to 54 years", "55 to 59 years", "60 and 61 years",
        "62 to 64 years", "65 and 66 years", "67 to 69 years", "70 to 74 years",
        "75 to 79 years", "80 to 84 years", "85 years and over"
    ];

    const raceAgeRanges = [
        "All", "Under 5 years", "5 to 9 years", "10 to 14 years", "15 to 17 years",
        "18 and 19 years", "20 to 24 years",
        "25 to 29 years", "30 to 34 years", "35 to 44 years",
        "45 to 54 years", "55 to 64 years", "65 to 74 years",
        "75 to 84 years", "85 years and over"
    ];

    const handleAgeRangeChange = (event) => {
        const { value, checked } = event.target;
        if (value === 'All') {
            if (checked) {
                setSelectedAges(['All']);
            } else {
                setSelectedAges([]);
            }
        } else {
            setSelectedAges(prevSelectedAges => {
                if (checked) {
                    const newSelectedAges = prevSelectedAges.filter(age => age !== 'All').concat(value);
                    return newSelectedAges;
                } else {
                    return prevSelectedAges.filter(age => age !== value);
                }
            });
        }
    };

    const submitQuery = (event) => {
        event.preventDefault();
        console.log('Select values:', gender);
        console.log('Select values:', race);
        console.log('Checkbox values:', selectedAges);

        // let currentAge = selectedAges[0];
        // console.log(currentAge);

        let generatedURLs = [];

        selectedAges.forEach(currentAge => {
            console.log(currentAge);
            let param = 'B01001X_XXXE';

            let val = 1;
            if (gender === 'all') {
                //TODO: the ACS gives queries in a binary where you can select either male or female. the exceptions are for 
                // the total total, white total, black total, etc. in this case val must remain 1. you cannot specify the age (yet - this requires summation of queries)
            }
            else {
                val++;
            }
            if (gender.toLowerCase() === 'female') {
                val += 24;
            }

            switch (race.toLowerCase()) {
                case 'all':
                    param = param.replace('X', '');
                    if (ageRanges.indexOf(currentAge) !== -1) {
                        val += ageRanges.indexOf(currentAge);
                    }
                    break;
                case 'white':
                    param = param.replace('X', 'A');
                    break;
                case 'black':
                    param = param.replace('X', 'B');
                    break;
                case 'native':
                    param = param.replace('X', 'C');
                    break;
                case 'asian':
                    param = param.replace('X', 'D');
                    break;
                default:
                    console.log('Unknown race:', race);
                    break;
            }
            if (race.toLowerCase() !== 'all') {
                if (raceAgeRanges.indexOf(currentAge) !== -1) {
                    val += raceAgeRanges.indexOf(currentAge);
                }
            }
            param = param.replace('XXX', String(val).padStart(3, '0'));
            param = 'https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,' + param + '&for=county:*'
            console.log(param);
            generatedURLs.push(param);
        });
        setPopulationURLs(generatedURLs);
    }

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
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURLs={populationURLs} sliderVal={sliderVal} state={state} dispatch={dispatch} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderMax={setSliderMax} setSliderStep={setSliderStep} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />
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
                    {(state.viewingMode === 'comparison' || state.viewingMode === 'slider') && (
                        <>
                            <button onClick={() => dispatch({ type: 'viewOverUnder' })}>Over/Under</button>
                            <button onClick={() => dispatch({ type: 'viewCompRange' })}>Range</button>
                            {state.comparisonMode}
                        </>
                    )}
                    <button id="toggleSideMenuButton" onClick={toggleSideMenu}>Change Dataset</button>
                    {isSideMenuOpen && (
                        // <div className="sideMenu">
                        //     <div className="sideMenuContent">
                        //         <button id="closeSideMenuButton" onClick={toggleSideMenu}>Close</button>
                        //         <Carousel
                        //             centerMode={false}
                        //             customTransition="all 0.3s linear"
                        //             draggable={true}
                        //             focusOnSelect={true}
                        //             keyBoardControl={true}
                        //             renderArrowsWhenDisabled={false}
                        //             responsive={responsive}
                        //             slidesToSlide={2}
                        //             swipeable>
                        //             <button className={activeDatasetClassButton === 'All' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="All" onClick={button => renderButtons(button.target.id)}>All Population</button>
                        //             <button className={activeDatasetClassButton === 'Gender' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Gender" onClick={button => renderButtons(button.target.id)}>Population by Gender</button>
                        //             <button className={activeDatasetClassButton === 'Race' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Race" onClick={button => renderButtons(button.target.id)}>Population by Race</button>
                        //             <button className={activeDatasetClassButton === 'Sexuality' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Sexuality" onClick={button => renderButtons(button.target.id)}>Population by Sexuality</button>
                        //             <button className={activeDatasetClassButton === 'Institutionalized' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Institutionalized" onClick={button => renderButtons(button.target.id)}>Institutionalized Population</button>
                        //             <button className={activeDatasetClassButton === 'Median Age' ? 'selected-dataset-class-button' : 'dataset-class-button'} id="Median Age" onClick={button => renderButtons(button.target.id)}>Population by Median Age</button>
                        //         </Carousel>
                        //         <div id="boxContainer">
                        //             <div id="buttonBox" ref={buttonsRef}>
                        //                 {buttonData.map((item, index) => (
                        //                     <React.Fragment key={index}>
                        //                         <button className={activeDatasetButton === item.id ? 'selectedDatasetButton' : 'datasetButton'} id={item.id} onClick={() => renderSubButtons(item)}>
                        //                             {item.label}
                        //                         </button>
                        //                         {item.children.map((child, childIndex) => (
                        //                             <button key={childIndex} className={activeSubDatasetButton === child.id ? "selectedDatasetButton" : "datasetButton"} onClick={() => {
                        //                                 configurePopulationURL(child.url);
                        //                                 setActiveSubDatasetButton(child.id);
                        //                                 setDataDescription(child.desc);
                        //                                 setDataTitle(child.label);
                        //                             }}>
                        //                                 {child.label}
                        //                             </button>
                        //                         ))}
                        //                     </React.Fragment>
                        //                 ))}
                        //             </div>
                        //         </div>
                        //         <div id="percent-count-selector">
                        //             <button id="countButton" className={countOrPercentage === 'Count' ? 'count-percent-buttons-active' : 'count-percent-buttons'} onClick={() => setCountOrPercentage('Count')}>Count View</button>
                        //             <button id="percentButton" className={countOrPercentage === 'Percentage' ? 'count-percent-buttons-active' : 'count-percent-buttons'} onClick={() => setCountOrPercentage('Percentage')}>Percentage View</button>
                        //         </div>
                        //     </div>
                        // </div>
                        <>
                            <form className="form-container" onSubmit={submitQuery}>
                                <div className="form-section">
                                    <label className="label">Gender:</label>
                                    <select className="select" value={gender} onChange={e => setGender(e.target.value)}>
                                        <option value="">Select Gender</option>
                                        <option value="all">All</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                </div>
                                <div className="form-section">
                                    <label className="label">Race:</label>
                                    <select className="select" value={race} onChange={e => setRace(e.target.value)}>
                                        <option value="">Select Race</option>
                                        <option value="all">All</option>
                                        <option value="white">White</option>
                                        <option value="black">Black or African American</option>
                                        <option value="native">American Indian and Alaska Native</option>
                                        <option value="asian">Asian</option>
                                        {/* Other races */}
                                    </select>
                                </div>
                                <div className="form-section">
                                    <label className="label">Age Ranges:</label>
                                    <div className="checkbox-container">
                                        {(race === 'All') &&
                                            (
                                                ageRanges.map((range, index) => (
                                                    <label key={index} className="checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            value={range}
                                                            checked={selectedAges.includes(range)}
                                                            onChange={handleAgeRangeChange}
                                                        />
                                                        {range}
                                                    </label>
                                                ))
                                            )
                                        }
                                        {(race !== 'All') &&
                                            (
                                                raceAgeRanges.map((range, index) => (
                                                    <label key={index} className="checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox"
                                                            value={range}
                                                            checked={selectedAges.includes(range)}
                                                            onChange={handleAgeRangeChange}
                                                        />
                                                        {range}
                                                    </label>
                                                ))
                                            )
                                        }
                                    </div>
                                </div>
                                <button type="submit">Submit</button>
                            </form>
                            {/* <button id="toggleSideMenuButton" onClick={() => setPopulationURLs('https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,B05005_003E&for=county:*')}>Old Shi</button> */}

                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default App;