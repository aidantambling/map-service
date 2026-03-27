import "./Legend.scss";
import { useRef } from "react";
import OverUnderUI from "./RangeSlider/OverUnderUI";
import RangeUI from "./RangeSlider/RangeUI";

const Legend = ({ dataTitle, queryVars, viewingMode, comparisonMode, legendData, sliderSettings, setSliderSettings }) => {
    const overUnderRef = useRef();
    const lowRangeRef = useRef();
    const highRangeRef = useRef();
    const inspectRef = useRef();

    // load only the legend for quartile view
    function renderQuartileData() {
        return (
            <ul>
                {legendData.map((item, index) => (
                    <li key={index} className="legend-element">
                        <span className="legend-color-icon" style={{ backgroundColor: item.color, flexShrink: 0, }}></span>
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
                {comparisonMode === 'overUnder' ? (
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
                {comparisonMode === 'Range' ?
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

    return (
        <>
            <h3>{dataTitle + ' '}
                (
                {queryVars.committed
                    .sort((a, b) => a.group.localeCompare(b.group))
                    .map(v => v.fullpath)
                    .join(', ')}
                )
            </h3>
            {viewingMode === 'Quartile' && <div className="content" style={{ height: '100%' }}>{renderQuartileData()}</div>}
            {viewingMode === 'Slider' && <div className="content" style={{ height: '100%' }}>{renderSliderData()}</div>}
            {viewingMode === 'Inspect' && <div className="content" style={{ height: '100%' }}>{renderInspectData()}</div>}
        </>
    )
}

export default Legend