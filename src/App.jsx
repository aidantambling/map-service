import React, { useState, useReducer, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import DynamicForm from './components/DynamicForm';
import { paramToURL } from './components/UrlGenerators';
import { getVariablesFromConcept, findConceptsFromBase, fetchConceptGroups, findConcepts } from './components/useCensusData';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import './App.scss';
import { active } from 'd3';
import ModalDisplay from './components/Modal/Modal';
import TreeView from './components/TreeView/TreeView';

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

const App = () => {
    const [state, dispatch] = useReducer(reducer, { viewingMode: 'quartile', comparisonMode: 'over/under' });
    const [populationURLs, setPopulationURLs] = useState([
        'https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,B01003_001E&for=county:*'
    ]);
    // const [keywordToInfo, setKeywordToInfo] = useState(null); // stores .json data to interpret/access API URLs

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    // slider state values
    const [sliderMax, setSliderMax] = useState(100000);
    const [sliderStep, setSliderStep] = useState(5000);
    const [sliderVal, setSliderVal] = useState(0);

    // dataset buttons-related
    // const [buttonData, setButtonData] = useState([]); // track the dataset buttons that should be rendered
    const [activeDatasetClassButton, setActiveDatasetClassButton] = useState("All");

    // dataset context elements
    const [dataDescription, setDataDescription] = useState("Loading...");
    const [dataTitle, setDataTitle] = useState("Loading...");
    const [legendData, setLegendData] = useState([]);

    // change the data from a "count" context to a "percentage" context, and vice-versa
    const [countOrPercentage, setCountOrPercentage] = useState("Count");

    // changing the view mode
    const [selectedCounty, setSelectedCounty] = useState([]);
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(true);
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

    // // initial fetch of API data
    // useEffect(() => {
    //     console.log(typeof (populationURLs))
    //     fetch('/apis.json') // Path relative to the public directory
    //         .then(response => response.json())
    //         .then(jsonData => setKeywordToInfo(jsonData.Buttons))
    //         .catch(error => console.error('Error fetching data:', error));
    // }, []);

    // // when API is confirmed as fetched, or is changed (?), render the 'All" dataset buttons
    // useEffect(() => {
    //     if (keywordToInfo) {
    //         console.log('keywordTOINFOOOOOOO')
    //         renderButtons("All");
    //         setDataDescription(keywordToInfo["All"]["populationDataBtn"].description);
    //         setDataTitle(keywordToInfo["All"]["populationDataBtn"].title);
    //     }
    // }, [keywordToInfo]);

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

    // abstracting useState setPopulationURL to adjust the API access based on whether we are in count or percent mode
    // TODO: HAS NOT BEEN ADAPTED FOR MULTI-URL APPROACH
    // const configurePopulationURL = (url) => {
    //     // url = url[0];
    //     // // console.log(countOrPercentage)
    //     // if (countOrPercentage === "Percentage") {
    //     //     url = url.replace('C&for', 'P&for');
    //     // }
    //     // else if (countOrPercentage === "Count") {
    //     //     url = url.replace('P&for', 'C&for');
    //     // }
    //     // setPopulationURLs(url);
    // }

    // if count or percentage is changed, we should change the url without having to re-select the dataset button we have selected
    // useEffect(() => {
    //     configurePopulationURL(populationURLs);
    // }, [countOrPercentage])

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

    // const toggleSideMenu = () => {
    //     setIsSideMenuOpen(!isSideMenuOpen);
    // };

    const toggleViewMenu = () => {
        setIsViewMenuOpen(!isViewMenuOpen);
    };

    const [conceptGroups, setConceptGroups] = useState([]);
    const [baseConcepts, setBaseConcepts] = useState([]);
    const [concepts, setConcepts] = useState();
    const [labels, setLabels] = useState({});

    const [selectedConcept, setSelectedConcept] = useState();

    const [queryVars, setQueryVars] = useState([])

    // 1. upon loading the dataset, fetch the top-level concept groups to display
    useEffect(() => {
        fetchConceptGroups().then(conceptGroups => setConceptGroups(conceptGroups));
    }, [])

    // 2. when a user selects a concept group, display the concepts it refers to
    // migrated to Modal.jsx
    // const renderConcepts = (form, index) => {
    //     console.log(form.conceptGroup)
    //     setActiveDatasetClassButton(form.conceptGroup)
    //     const pullData = async () => {
    //         const c = await findConcepts(form.groupPrefix);
    //         setBaseConcepts(c);
    //     }
    //     pullData();
    //     // activateForm(form)
    // }

    // 3. when a user selects a concept, display its subconcepts.
    const renderSubconcepts = async (form) => {
        console.log(form)
        const pullData = async () => {
            let c = await findConceptsFromBase(form.slice(0, 6));

            // Create an array of promises
            const promises = c.map(async (entry) => {
                console.log(entry)
                const children = await renderLabels(entry.group, entry.concept);
                console.log(children)
                return {
                    id: entry.group,
                    group: entry.group,
                    label: entry.concept,
                    children: children,
                };
            });

            // Wait for all promises to resolve
            const result = await Promise.all(promises);

            // Update state with the resolved data
            setConcepts(result);
        }
        await pullData();
        // await renderLabels(form) // we necessarily must render the labels, too
    }

    // useEffect(() => {
    //     if (concepts) {
    //         renderLabels(selectedConcept.group)
    //     }
    // }, [selectedConcept])

    // useEffect(() => {
    //     console.log(concepts)
    // }, [concepts])

    // 4. labels are tied to a subconcept. so when the user selects a concept (implicitly selecting subconcept) or explicitly selects subconcept, display the labels
    const renderLabels = async (formVal, category) => {
        console.log(formVal)
        const pullData = async () => {
            const fetchedLabels = await getVariablesFromConcept(formVal, category);
            if (typeof fetchedLabels === 'string') {
                try {
                    return JSON.parse(fetchedLabels);
                } catch (e) {
                    console.error('Failed to parse labels:', e);
                }
            } else {
                return fetchedLabels;
            }
        }
        const labels = await pullData();
        return labels
    }

    const queryAPI = () => {
        const popURLs = queryVars.map(queryVar => paramToURL(queryVar.access));
        console.log(popURLs);
        setPopulationURLs(popURLs);
    }

    const addVarToQuery = (obj) => {
        // add some logic here - if male total, female total selected, maybe just query total? or if total selected, and male total selected, rm total?
        console.log(obj)
        const variable = {
            fullpath: obj.fullpath,
            access: obj.group,
        }
        console.log(variable)
        setQueryVars([...queryVars, variable])
    }

    const handleRemove = (indexToRemove) => {
        const newQueryVars = queryVars.filter((_, index) => index !== indexToRemove);
        setQueryVars(newQueryVars);
    };

    return (
        <div id="mainContainer">
            <div id="titleContainer">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div id="canvasTitleContainer">
                {/* <h2 id='canvasTitle'>{dataTitle}</h2> */}
                <ModalDisplay conceptGroups={conceptGroups} renderSubconcepts={renderSubconcepts} dataTitle={dataTitle} setDataTitle={setDataTitle} />
            </div>
            <div id='bodyContainer'>
                <div id="canvas-panel">
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURLs={populationURLs} sliderVal={sliderVal} state={state} dispatch={dispatch} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderMax={setSliderMax} setSliderStep={setSliderStep} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} setDataTitle={setDataTitle} />
                    <div id="legend-scale">
                        <ul id='legend-labels'>
                            {state.viewingMode === 'quartile' && <div className="content" style={{ height: '100%' }}>{renderQuartileData()}</div>}
                            {state.viewingMode === 'slider' && <div className="content" style={{ height: '100%' }}>{renderSliderData()}</div>}
                            {state.viewingMode === 'comparison' && <div className="content" style={{ height: '100%' }}>{renderComparisonData()}</div>}
                        </ul>
                    </div>
                </div>
                <div id='info-panel'>
                    <div id="tooltips">
                        <div class='tooltip' id='tooltip-county' ref={tooltipCountyRef}>Hover over a county to see details!</div>
                        <div class='tooltip' id='tooltip-stat' ref={tooltipStatRef}></div>
                    </div>
                    <button id="toggleSideMenuButton" class='toggleButton' onClick={toggleViewMenu}>Change View</button>
                    {isViewMenuOpen && (
                        <div id="viewChanger">
                            <button id="quartileButton" className={state.viewingMode === 'quartile' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewQuartile' })}>Quartile View</button>
                            <button id="sliderButton" className={state.viewingMode === 'slider' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewSlider' })}>Slider View</button>
                            <button id="comparisonButton" className={state.viewingMode === 'comparison' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewComparison' })}>Comparison View</button>
                        </div>
                    )}
                    <div id='description'>{dataDescription}</div>
                    {(state.viewingMode === 'comparison' || state.viewingMode === 'slider') && (
                        <>
                            <button onClick={() => dispatch({ type: 'viewOverUnder' })}>Over/Under</button>
                            <button onClick={() => dispatch({ type: 'viewCompRange' })}>Range</button>
                            {state.comparisonMode}
                        </>
                    )}
                    {/* <button id="toggleSideMenuButton" class='toggleButton' onClick={toggleSideMenu}>Change Dataset</button> */}
                    {isSideMenuOpen && (
                        <div className="sideMenu">
                            <div className="sideMenuContent">
                                {/* <DynamicForm onSubmit={addVarToQuery} labels={labels} concepts={concepts} selectedConcept={selectedConcept} setSelectedConcept={setSelectedConcept} /> */}
                                <TreeView items={concepts} addVarToQuery={addVarToQuery} />
                                <div>
                                    {queryVars.map((variable, index) => (
                                        <div key={index} style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                                            <p>{variable.fullpath} {variable.label} {variable.access}</p>
                                            <button onClick={() => handleRemove(index)} style={{ marginLeft: '10px', color: 'white', backgroundColor: 'red' }}>
                                                x
                                            </button>
                                        </div>
                                    ))}
                                    <button onClick={() => queryAPI()}>Submit</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;