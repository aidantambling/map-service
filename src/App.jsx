import { useState, useEffect, useContext, useRef } from 'react';
import Canvas from './components/Canvas';
import { getVariablesFromConcept, findConceptsFromBase, fetchConceptGroups, paramToURL } from './components/useCensusData';
import DatasetModal from './components/Modals/DatasetModal/DatasetModal';
import ColorModal from './components/Modals/ColorModal/ColorModal';
import DisplayModal from './components/Modals/DisplayModal/DisplayModal';
import TreeView from './components/TreeView/TreeView';
import { Tooltip } from '@mui/material';
import SpinnerLoader from './components/SpinnerLoader/SpinnerLoader';
import './App.scss';
import { UIContext } from './contexts/UIContext';
import 'react-h5-audio-player/lib/styles.css';
import Legend from './components/Legend';
import Modal from './components/Modals/Modal';
import ModalWrapper from './components/Modals/Modal';

const App = () => {
    const { viewingMode, comparisonMode, geographyMode, selectedPalette, setSelectedPalette, activeState } = useContext(UIContext);

    // manage API access via url(s)
    const api_key = import.meta.env.VITE_CENSUS_KEY
    const [populationURLs, setPopulationURLs] = useState([
        `https://api.census.gov/data/2022/acs/acs5?get=NAME,GEO_ID,B01003_001E&for=state:*&key=${api_key}`
    ]);

    // tooltip refs - passed to Canvas.jsx for value assignment based on mouse-over
    const tooltipCountyRef = useRef(null);
    const tooltipStatRef = useRef(null);
    const isTouch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));

    // slider state values
    const [sliderSettings, setSliderSettings] = useState({
        max: 100000,
        step: 5000,
        val: 0, // for OverUnderSlider
        range: [0, 0], // for RangeSlider
        // inspectVal: 0, // for InspectSlider
    })

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


    // fetch the stored color palettes and set default
    const fetchColorPalettes = async () => {
        const response = await fetch('./palettes.json');
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
        console.log(queryVars);
        console.log(activeState);
        let popURLs;
        if ((geographyMode === 'CountySubdivision' || geographyMode === 'Place') && !activeState) {
            popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, 'state'));
        }
        else if (geographyMode === 'CountySubdivision') {
            popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, `county%20subdivision:*&in=state`, `${activeState}`));
        }
        else if (geographyMode === 'Place') {
            popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, `place:*&in=state`, `${activeState}`));
        }
        else if (geographyMode === 'AIANNH') {
            popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, `american%20indian%20area/alaska%20native%20area/hawaiian%20home%20land`));
        }
        else {
            popURLs = queryVars.current.map(queryVar => paramToURL(queryVar.group, geographyMode));
        }
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
    }, [geographyMode, activeState])

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
                    <DisplayModal />
                </div>
            </div>
            {/* On mobile, we have a unique section above the canvas for title display */}
            <div className="mobile-title-container">
                <h3>{dataTitle + ' '}
                    (
                    {queryVars.committed
                        .sort((a, b) => a.group.localeCompare(b.group))
                        .map(v => v.fullpath)
                        .join(', ')}
                    )
                </h3>
            </div>
            <div className="canvas-container">
                {/* if canvas is loading, spinner should render above it until rendering is complete */}
                <div className="spinner-box" style={{ zIndex: canvasLoading ? -5 : 5 }}>
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
                    countOrPercentage={countOrPercentage}
                    setCountOrPercentage={setCountOrPercentage}
                    setSliderSettings={setSliderSettings}
                    selectedCounty={selectedCounty}
                    setSelectedCounty={setSelectedCounty}
                    setDataTitle={setDataTitle}
                    queryVars={queryVars}
                    isTouch={isTouch}
                />
                <div className="legend-corner">
                    <Legend dataTitle={dataTitle} queryVars={queryVars} viewingMode={viewingMode} comparisonMode={comparisonMode} legendData={legendData} sliderSettings={sliderSettings} setSliderSettings={setSliderSettings} />
                </div>
            </div>
            <div className="panel-container">
                <div className="tooltip-legend">
                    <div className="legend-section">
                        <Legend dataTitle={dataTitle} queryVars={queryVars} viewingMode={viewingMode} comparisonMode={comparisonMode} legendData={legendData} sliderSettings={sliderSettings} setSliderSettings={setSliderSettings} />
                    </div>
                </div>
                {/* We need to implement the description... */}
                {/* <div id='description'>{dataDescription}</div> */}
                <div className="sideMenu">
                    <div className="sideMenuContent">
                        <h2>Search Assistant</h2>
                        {(
                            <>
                                <TreeView concepts={concepts} setQueryVars={setQueryVars} />
                                {
                                    concepts ?
                                        <button onClick={() => {
                                            queryAPI();
                                        }}>
                                            Submit
                                        </button>
                                        :
                                        <></>
                                }
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default App;