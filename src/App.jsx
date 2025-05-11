import React, { useState, useReducer, useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import { paramToURL } from './components/UrlGenerators';
import { getVariablesFromConcept, findConceptsFromBase, fetchConceptGroups, findConcepts } from './components/useCensusData';
import './App.scss';
import ModalDisplay from './components/Modal/Modal';
import TreeView from './components/TreeView/TreeView';
import { Tooltip } from '@mui/material';
import SettingsModal from './components/SettingsModal/SettingsModal';
import RangeSlider from './components/RangeSlider/RangeSlider';
import ViewModal from './components/ViewModal/ViewModal';
import { styled, alpha } from '@mui/material/styles';
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem';
import SpinnerLoader from './components/SpinnerLoader/SpinnerLoader';



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
    const [title, setTitle] = useState('Sex by Age => Total Population')
    const [legendData, setLegendData] = useState([]);

    // change the data from a "count" context to a "percentage" context, and vice-versa
    const [countOrPercentage, setCountOrPercentage] = useState("Count");

    // changing the view mode
    const [selectedCounty, setSelectedCounty] = useState([]);

    const [palettes, setPalettes] = useState(null);
    const [selectedPalette, setSelectedPalette] = useState('');
    const [conceptGroups, setConceptGroups] = useState([]);
    const [concepts, setConcepts] = useState();
    const [queryVars, setQueryVars] = useState([]);
    const [displayedQueryVars, setDisplayedQueryVars] = useState([]); // better way to do this?

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

    // 1. upon loading the dataset, fetch the top-level concept groups to display
    useEffect(() => {
        fetchConceptGroups().then(conceptGroups => setConceptGroups(conceptGroups));
    }, [])

    // 2. when a user selects a concept group, display the concepts it refers to
    // migrated to Modal.jsx

    // 3. when a user selects a concept, display its subconcepts.
    const renderSubconcepts = async (form) => {
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

    // 4. labels are tied to a subconcept. so when the user selects a concept (implicitly selecting subconcept) or explicitly selects subconcept, display the labels
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

    const [isToggled, setIsToggled] = useState(true);

    const queryAPI = () => {
        const popURLs = queryVars.map(queryVar => paramToURL(queryVar.group));
        setPopulationURLs(popURLs);
        setDisplayedQueryVars(queryVars);
        setIsToggled(false);
        setTimeout(() => {
            setTimeout(() => {
                setIsToggled(true);
            }, 1500)
        }, 2000)

    }

    const fetchColorPalettes = async () => {
        const response = await fetch('/palettes.json');
        const data = await response.json();
        setPalettes(data);
        setSelectedPalette(data[0]);
    }

    useEffect(() => {
        fetchColorPalettes();
    }, [])

    return (
        <div id="mainContainer">
            <div className="title-container">
                <h2 id='title'>Census API Visualization Tool</h2>
            </div>
            <div className="settings-container">
                <div className="modal-container">
                    <Tooltip title={title} PopperProps={{ style: { zIndex: 1 } }}>
                        <ModalDisplay conceptGroups={conceptGroups} renderSubconcepts={renderSubconcepts} dataTitle={dataTitle} setDataTitle={setDataTitle} setTitle={setTitle} />
                    </Tooltip>
                    <SettingsModal palettes={palettes} setSelectedPalette={setSelectedPalette} selectedPalette={selectedPalette}></SettingsModal>
                    <ViewModal state={state} dispatch={dispatch} />
                </div>
            </div>
            <div className="canvas-container">
                <div id="canvas-panel">
                    <>
                        <div className={isToggled ? 'tempDiv-low' : 'tempDiv-high'}>
                            {isToggled ?
                                <></>
                                :
                                <SpinnerLoader showSpinner={true} source={'spinner2.svg'} />}
                        </div>
                        <Canvas tooltipCountyRef={tooltipCountyRef} tooltipStatRef={tooltipStatRef} setLegendData={setLegendData} populationURLs={populationURLs} sliderVal={sliderVal} state={state} dispatch={dispatch} countOrPercentage={countOrPercentage} setCountOrPercentage={setCountOrPercentage} setSliderMax={setSliderMax} setSliderStep={setSliderStep} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} setDataTitle={setDataTitle} selectedPalette={selectedPalette.colors} />
                        <div id="legend-scale">
                            <h3>{dataTitle}</h3>
                            <div className='currently-viewing-box'>
                                <div className='query-vars-box'>
                                    {displayedQueryVars
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
                                    <TreeView items={concepts} style={{ color: 'red' }} setQueryVars={setQueryVars} queryVars={queryVars} />
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