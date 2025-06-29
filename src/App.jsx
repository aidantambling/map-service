import { useState, useReducer, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import { getVariablesFromConcept, findConceptsFromBase, fetchConceptGroups, paramToURL } from './components/useCensusData';
import DatasetModal from './components/Modals/DatasetModal/DatasetModal';
import ColorModal from './components/Modals/ColorModal/ColorModal';
import DisplayModal from './components/Modals/DisplayModal/DisplayModal';
import TreeView from './components/TreeView/TreeView';
import { Tooltip } from '@mui/material';
import SpinnerLoader from './components/SpinnerLoader/SpinnerLoader';
import './App.scss';
import OverUnderUI from './components/RangeSlider/OverUnderUI';
import RangeUI from './components/RangeSlider/RangeUI';

// reducer to allow swapping between view mode
const reducer = (state, action) => {
    switch (action.type) {
        case 'viewQuartile':
            return { viewingMode: 'Quartile' };
        case 'viewComparison':
            return { viewingMode: 'Comparison' };
        case 'viewSliderOverUnder':
            return { viewingMode: 'Slider', comparisonMode: 'overUnder' };
        case 'viewSliderRange':
            return { viewingMode: 'Slider', comparisonMode: 'viewCompRange' };
        case 'viewInspectOverUnder':
            return { viewingMode: 'Inspect', comparisonMode: 'overUnder' };
        case 'viewInspectRange':
            return { viewingMode: 'Inspect', comparisonMode: 'viewCompRange' };
        default:
            throw new Error();
    }
}

const App = () => {
    const [state, dispatch] = useReducer(reducer, { viewingMode: 'Quartile', comparisonMode: 'over/under' });
    const [geographyMode, setGeographyMode] = useState("County");

    // manage API access via url(s)
    const api_key = import.meta.env.VITE_CENSUS_KEY
    const [populationURLs, setPopulationURLs] = useState([
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,B01003_001E&for=county:*&key=${api_key}`
    ]);

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);

    // slider state values
    const [sliderSettings, setSliderSettings] = useState({
        max: 100000,
        step: 5000,
        val: 0, // for OverUnderSlider
        range: [0, 0], // for RangeSlider
        // inspectVal: 0, // for InspectSlider
    })
    const overUnderRef = useRef();
    const lowRangeRef = useRef();
    const highRangeRef = useRef();
    const inspectRef = useRef();

    const [dataTitle, setDataTitle] = useState("Total Population");
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
    const [selectedPalette, setSelectedPalette] = useState({
        "id": "palette1",
        "name": "Cool Blue",
        "colors": [
            "#77E4C8",
            "#36C2CE",
            "#478CCF",
            "#4535C1"
        ]
    });

    // API access
    const [nameGroups, setNameGroups] = useState([]);
    const [concepts, setConcepts] = useState();

    const [queryVars, setQueryVars] = useState({
        current: [
            {
                category: "Tier 1",
                children: [
                    {
                        category: "Total",
                        fullpath: "Total",
                        group: "B01003_001E",
                        id: "B01003_001E-Total-0",
                        label: "Total",
                    },
                ],
                fullpath: "Total",
                group: "B01003_001E",
                id: "B01003_001E-dummy",
                label: "Total",
            }
        ],
        committed: []
    })

    useEffect(() => {
        console.log(queryVars);
    }, [queryVars])

    // load only the legend for quartile view
    function renderQuartileData() {
        return (
            <ul>
                {legendData.map((item, index) => (
                    <li key={index} id="legend-element">
                        <span style={{ backgroundColor: item.color, width: '2rem', height: '2rem', marginRight: '10%', display: 'flex' }}></span>
                        {item.label}
                    </li>
                ))}
            </ul>
        )
    }

    // load the legend (same as quartile view - the legend has alr been updated via useEffect in Canvas.jsx), and load the slider itself as well
    function renderSliderData() {
        return (
            <>
                {renderQuartileData()}
                {state.comparisonMode === 'overUnder' ? (
                    <OverUnderUI
                        overUnderRef={overUnderRef}
                        sliderSettings={sliderSettings}
                        setSliderSettings={setSliderSettings}
                        val={sliderSettings.val}
                    />
                ) : (
                    <RangeUI
                        lowRangeRef={lowRangeRef}
                        highRangeRef={highRangeRef}
                        sliderSettings={sliderSettings}
                        setSliderSettings={setSliderSettings}
                    />
                )}
            </>
        )
    }

    function renderInspectData() {
        return (
            <>
                <h5>{selectedCounty.countyName}</h5>
                <h5>{selectedCounty.stat}</h5>
                <h5>
                    {
                        (selectedCounty && selectedCounty?.wikiLink) ?
                            <a href={selectedCounty.wikiLink}>Learn more about this county!</a>
                            :
                            <p>Select a county to color in the map!</p>
                    }
                </h5>
                {renderQuartileData()}
                {state.comparisonMode === 'viewCompRange' ?
                    <OverUnderUI
                        overUnderRef={inspectRef}
                        sliderSettings={{
                            ...sliderSettings,
                            max: sliderSettings.max / 2,
                            step: sliderSettings.step / 2
                        }}
                        setSliderSettings={setSliderSettings}
                    />
                    :
                    <></>
                }
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
            console.log('concepts being set')
            setConcepts(result);
        }
        await pullData();
    }

    // submit a query to the API using user-selected queryVars
    const queryAPI = () => {
        // translate the selected concepts into codes for the API
        console.log('changing population urls, geomode is: ', geographyMode)
        console.log(queryVars);
        const popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, geographyMode));
        console.log(popURLs);
        setPopulationURLs(popURLs);

        // update the legend to reflect the selected concepts
        setQueryVars(prev => ({
            ...prev,
            committed: prev.current
        }))

        // use loading screen while fetching the new data
        setCanvasLoading(false);
        setTimeout(() => {
            setTimeout(() => {
                setCanvasLoading(true);
            }, 1500)
        }, 2000)
    }

    useEffect(() => {
        queryAPI();
    }, [geographyMode])

    return (
        <div id="mainContainer">
            <div className="title-container">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div className="settings-container">
                <div className="modal-container">
                    <Tooltip title={title} PopperProps={{ style: { zIndex: 1 } }}>
                        <DatasetModal nameGroups={nameGroups} renderConcepts={renderConcepts} dataTitle={dataTitle} setDataTitle={setDataTitle} setTitle={setTitle} />
                    </Tooltip>
                    <ColorModal palettes={palettes} setSelectedPalette={setSelectedPalette} selectedPalette={selectedPalette} />
                    <DisplayModal state={state} dispatch={dispatch} />
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
                        <Canvas
                            tooltipCountyRef={tooltipCountyRef}
                            tooltipStatRef={tooltipStatRef}
                            setLegendData={setLegendData}
                            populationURLs={populationURLs}
                            sliderSettings={sliderSettings}
                            state={state}
                            countOrPercentage={countOrPercentage}
                            setCountOrPercentage={setCountOrPercentage}
                            setSliderSettings={setSliderSettings}
                            selectedCounty={selectedCounty}
                            setSelectedCounty={setSelectedCounty}
                            setDataTitle={setDataTitle}
                            selectedPalette={selectedPalette.colors}
                            geographyMode={geographyMode}
                            setGeographyMode={setGeographyMode}
                            queryVars={queryVars}
                        />
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
                            {state.viewingMode === 'Quartile' && <div className="content" style={{ height: '100%' }}>{renderQuartileData()}</div>}
                            {state.viewingMode === 'Slider' && <div className="content" style={{ height: '100%' }}>{renderSliderData()}</div>}
                            {state.viewingMode === 'Inspect' && <div className="content" style={{ height: '100%' }}>{renderInspectData()}</div>}
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