import React, { useState, useReducer, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import { paramToURL } from './components/UrlGenerators';
import { getVariablesFromConcept, findConceptsFromBase, fetchConceptGroups } from './components/useCensusData';
import ModalDisplay from './components/Modal/Modal';
import TreeView from './components/TreeView/TreeView';
import { Tooltip } from '@mui/material';
import SettingsModal from './components/SettingsModal/SettingsModal';
import RangeSlider from './components/RangeSlider/RangeSlider';
import ViewModal from './components/ViewModal/ViewModal';
import SpinnerLoader from './components/SpinnerLoader/SpinnerLoader';
import './App.scss';

// reducer to allow swapping between view mode
const reducer = (state, action) => {
    switch (action.type) {
        case 'viewQuartile':
            return { viewingMode: 'Quartile' };
        case 'viewSlider':
            return { viewingMode: 'Slider', comparisonMode: 'overUnder' };
        case 'viewComparison':
            return { viewingMode: 'Comparison', comparisonMode: 'overUnder' };
        case 'viewOverUnder':
            return { viewingMode: state.viewingMode, comparisonMode: 'overUnder' };
        case 'viewCompRange':
            return { viewingMode: state.viewingMode, comparisonMode: 'viewCompRange' };
        default:
            throw new Error();
    }
}

const App = () => {
    const [state, dispatch] = useReducer(reducer, { viewingMode: 'Quartile', comparisonMode: 'over/under' });

    // manage API access via url(s)
    const [populationURLs, setPopulationURLs] = useState([
        'https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,B01003_001E&for=county:*'
    ]);

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    // slider state values
    const [sliderSettings, setSliderSettings] = useState({
        max: 100000,
        step: 5000,
        val: 0
    })

    const [dataTitle, setDataTitle] = useState("Loading...");
    const [title, setTitle] = useState('Sex by Age => Total Population')
    const [legendData, setLegendData] = useState([]);

    // change the data from a "count" context to a "percentage" context, and vice-versa
    const [countOrPercentage, setCountOrPercentage] = useState("Count");

    // changing the view mode
    const [selectedCounty, setSelectedCounty] = useState([]);

    // toggle spinner while canvas loads data
    const [canvasLoading, setCanvasLoading] = useState(true);

    // color-related state devices
    const [palettes, setPalettes] = useState(null);
    const [selectedPalette, setSelectedPalette] = useState('');

    // API access
    const [nameGroups, setNameGroups] = useState([]);
    const [concepts, setConcepts] = useState();

    const [queryVars, setQueryVars] = useState({
        current: [],
        committed: []
    })
    // const [queryVars, setQueryVars] = useState([]);
    // const [displayedQueryVars, setDisplayedQueryVars] = useState([]); // better way to do this?

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
                <RangeSlider max={sliderSettings.max} step={sliderSettings.step} sliderVal={sliderSettings.val} setSliderSettings={setSliderSettings} />
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

    // fetch the stored color palettes and set default
    const fetchColorPalettes = async () => {
        const response = await fetch('/palettes.json');
        const data = await response.json();
        setPalettes(data);
        setSelectedPalette(data[0]);
    }

    useEffect(() => {
        fetchColorPalettes();
    }, [])

    // step 1: upon loading the ACS dataset, fetch the 41 top-level nameGroups to display
    useEffect(() => {
        fetchConceptGroups().then(nameGroups => setNameGroups(nameGroups));
    }, [])
    // these are rendered in Modal.jsx's grid, where user can specify nameGroup and then superConcept

    // step 2: when a user selects a superConcept, display its concepts.
    const renderConcepts = async (form) => {

        // function to get the individual labels for the concept(s) under the superconcept
        const renderLabels = async (formVal, category) => {
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

        // use the labels to create a tree structure for the search assistant
        const pullData = async () => {
            let c = await findConceptsFromBase(form.slice(0, 6));

            const promises = c.map(async (entry) => {
                const children = await renderLabels(entry.group, entry.concept);
                return children;
            });

            const result = await Promise.all(promises);
            setConcepts(result);
        }
        await pullData();
    }

    // submit a query to the API using user-selected queryVars
    const queryAPI = () => {
        // translate the selected concepts into codes for the API
        const popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group));
        setPopulationURLs(popURLs);

        // update the legend to reflect the selected concepts
        setQueryVars(prev => ({
            ...prev,
            committed: prev.current
        }))
        // setDisplayedQueryVars(queryVars);

        // use loading screen while fetching the new data
        setCanvasLoading(false);
        setTimeout(() => {
            setTimeout(() => {
                setCanvasLoading(true);
            }, 1500)
        }, 2000)
    }

    return (
        <div id="mainContainer">
            <div className="title-container">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div className="settings-container">
                <div className="modal-container">
                    <Tooltip title={title} PopperProps={{ style: { zIndex: 1 } }}>
                        <ModalDisplay nameGroups={nameGroups} renderConcepts={renderConcepts} dataTitle={dataTitle} setDataTitle={setDataTitle} setTitle={setTitle} />
                    </Tooltip>
                    <SettingsModal palettes={palettes} setSelectedPalette={setSelectedPalette} selectedPalette={selectedPalette}></SettingsModal>
                    <ViewModal state={state} dispatch={dispatch} />
                </div>
            </div>
            <div className="canvas-container">
                <div id="canvas-panel">
                    <>
                        <div className={canvasLoading ? 'tempDiv-low' : 'tempDiv-high'}>
                            {canvasLoading ?
                                <></>
                                :
                                <SpinnerLoader showSpinner={true} source={'spinner2.svg'} />}
                        </div>
                        <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURLs={populationURLs} sliderVal={sliderSettings.val} state={state} dispatch={dispatch} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderSettings={setSliderSettings} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} setDataTitle={setDataTitle} selectedPalette={selectedPalette.colors} />
                        <div id="legend-scale">
                            <h3>{dataTitle}</h3>
                            <div className='currently-viewing-box'>
                                <div className='query-vars-box'>
                                    {queryVars.committed
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
                            </div>
                            <ul id='legend-labels'>
                                {state.viewingMode === 'Quartile' && <div className="content" style={{ height: '100%' }}>{renderQuartileData()}</div>}
                                {state.viewingMode === 'Slider' && <div className="content" style={{ height: '100%' }}>{renderSliderData()}</div>}
                                {state.viewingMode === 'Comparison' && <div className="content" style={{ height: '100%' }}>{renderComparisonData()}</div>}
                            </ul>
                        </div>
                    </>
                </div>
            </div>
            <div className="panel-container">
                <div id="tooltips">
                    <div class='tooltip' id='tooltip-county' ref={tooltipCountyRef}>Hover over a county</div>
                    <div class='tooltip' id='tooltip-stat' ref={tooltipStatRef}>to see details!</div>
                </div>
                {/* We need to implement the description... */}
                {/* <div id='description'>{dataDescription}</div> */}
                <div className="sideMenu">
                    <div className="sideMenuContent">
                        <h2>Search Assistant</h2>
                        {
                            (
                                <>
                                    <TreeView concepts={concepts} setQueryVars={setQueryVars} />
                                    {
                                        concepts ?
                                            <button onClick={() => {
                                                queryAPI();
                                            }}>Submit</button>
                                            :
                                            <></>
                                    }
                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;