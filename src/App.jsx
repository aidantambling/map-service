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
import { Tooltip } from '@mui/material';
import SettingsModal from './components/SettingsModal/SettingsModal';
import RangeSlider from './components/RangeSlider/RangeSlider';
import ViewModal from './components/ViewModal/ViewModal';

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

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    // slider state values
    const [sliderMax, setSliderMax] = useState(100000);
    const [sliderStep, setSliderStep] = useState(5000);
    const [sliderVal, setSliderVal] = useState(0);

    const [dataTitle, setDataTitle] = useState("Loading...");
    const [legendData, setLegendData] = useState([]);

    // change the data from a "count" context to a "percentage" context, and vice-versa
    const [countOrPercentage, setCountOrPercentage] = useState("Count");

    // changing the view mode
    const [selectedCounty, setSelectedCounty] = useState([]);
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

    const [palettes, setPalettes] = useState(null);
    const [selectedPalette, setSelectedPalette] = useState('');
    const [conceptGroups, setConceptGroups] = useState([]);
    const [concepts, setConcepts] = useState();
    const [queryVars, setQueryVars] = useState([])

    const [currentlyViewing, setCurrentlyViewing] = useState(true)
    const [title, setTitle] = useState('Sex by Age => Sex by Age')

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

        return (
            <>
                {renderQuartileData()}
                <RangeSlider max={sliderMax} step={sliderStep} sliderVal={sliderVal} setSliderVal={setSliderVal} />
                <div className='type-selector'>
                    <button onClick={() => dispatch({ type: 'viewOverUnder' })}>Over/Under</button>
                    <button onClick={() => dispatch({ type: 'viewCompRange' })}>Range</button>
                </div>
            </>
        );
    }

    function renderComparisonData() {
        return (
            <>
                <h5>
                    {selectedCounty.countyName}
                </h5>
                <h5>
                    {selectedCounty.stat}
                </h5>
                <h5>
                    <a href={selectedCounty.wikiLink}>Wikipedia Link</a>
                </h5>
                <div className='type-selector'>
                    <button onClick={() => dispatch({ type: 'viewOverUnder' })}>Over/Under</button>
                    <button onClick={() => dispatch({ type: 'viewCompRange' })}>Range</button>
                </div>
                {renderQuartileData()}
            </>
        );
    }

    const responsive = {
        superLargeDesktop: {
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

    const toggleViewMenu = () => {
        setIsViewMenuOpen(!isViewMenuOpen);
    };

    const fetchColorPalettes = async () => {
        const response = await fetch('/palettes.json');
        const data = await response.json();
        setPalettes(data)
        setSelectedPalette(data[0].colors)
        console.log(data)
    }

    useEffect(() => {
        fetchColorPalettes();
    }, [])


    // 1. upon loading the dataset, fetch the top-level concept groups to display
    useEffect(() => {
        fetchConceptGroups().then(conceptGroups => setConceptGroups(conceptGroups));
    }, [])

    // 2. when a user selects a concept group, display the concepts it refers to
    // migrated to Modal.jsx

    // 3. when a user selects a concept, display its subconcepts.
    const renderSubconcepts = async (form) => {
        console.log(form)
        const pullData = async () => {
            let c = await findConceptsFromBase(form.slice(0, 6));

            const promises = c.map(async (entry) => {
                const children = await renderLabels(entry.group, entry.concept);
                return {
                    id: entry.group,
                    group: entry.group,
                    label: entry.concept,
                    children: children,
                };
            });

            const result = await Promise.all(promises);
            setConcepts(result);
        }
        await pullData();
    }

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
        const popURLs = queryVars.map(queryVar => paramToURL(queryVar.group));
        console.log(popURLs);
        setPopulationURLs(popURLs);
        setCurrentlyViewing(false)
    }

    const addVarToQuery = (obj) => {
        // add some logic here - if male total, female total selected, maybe just query total? or if total selected, and male total selected, rm total?
        const variable = {
            fullpath: obj.fullpath,
            access: obj.group,
        }
        setQueryVars([...queryVars, variable])
    }

    useEffect(() => {
        console.log(selectedPalette)
    }, [selectedPalette])

    return (
        <div id="mainContainer">
            <div id="titleContainer">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div id="canvasTitleContainer">
                <Tooltip title={title}>
                    <ModalDisplay conceptGroups={conceptGroups} renderSubconcepts={renderSubconcepts} dataTitle={dataTitle} setDataTitle={setDataTitle} setTitle={setTitle} />
                </Tooltip>
                <SettingsModal palettes={palettes} setSelectedPalette={setSelectedPalette}></SettingsModal>
            </div>
            <div id='bodyContainer'>
                <div id="canvas-panel">
                    <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURLs={populationURLs} sliderVal={sliderVal} state={state} dispatch={dispatch} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderMax={setSliderMax} setSliderStep={setSliderStep} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} setDataTitle={setDataTitle} selectedPalette={selectedPalette} />
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
                        <div class='tooltip' id='tooltip-county' ref={tooltipCountyRef}>Hover over a county</div>
                        <div class='tooltip' id='tooltip-stat' ref={tooltipStatRef}>to see details!</div>
                    </div>
                    {/* <button id="toggleSideMenuButton" class='toggleButton' onClick={toggleViewMenu}>Change View</button> */}
                    <ViewModal state={state} dispatch={dispatch} />
                    {/* {isViewMenuOpen && (
                        // <div id="viewChanger">
                        //     <button id="quartileButton" className={state.viewingMode === 'quartile' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewQuartile' })}>Quartile View</button>
                        //     <button id="sliderButton" className={state.viewingMode === 'slider' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewSlider' })}>Slider View</button>
                        //     <button id="comparisonButton" className={state.viewingMode === 'comparison' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewComparison' })}>Comparison View</button>
                        // </div>
                    )} */}
                    {/* We need to implement the description... */}
                    {/* <div id='description'>{dataDescription}</div> */}
                    <div className="sideMenu">
                        <div className="sideMenuContent">
                            {
                                currentlyViewing ?
                                    (
                                        <>
                                            <TreeView items={concepts} addVarToQuery={addVarToQuery} setQueryVars={setQueryVars} queryVars={queryVars} />
                                            {
                                                concepts ?
                                                    <button onClick={() => queryAPI()}>Submit</button>
                                                    :
                                                    <></>
                                            }
                                        </>
                                    ) :
                                    (
                                        <>
                                            <div className='currently-viewing-box'>
                                                <h2>Currently selected:</h2>
                                                <div className='query-vars-box'>
                                                    {queryVars
                                                        .sort((a, b) => {
                                                            if (a.group < b.group) return -1;
                                                            if (a.group > b.group) return 1;
                                                            return 0;
                                                        })
                                                        .map((variable, index) => (
                                                            <div key={index} style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                                                                <p>{variable.fullpath}</p>
                                                            </div>
                                                        ))}

                                                </div>
                                                <button onClick={() => setCurrentlyViewing(true)}>Change Selection</button>
                                            </div>
                                        </>
                                    )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;