import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

const RangeSlider = ({ max, step, sliderVal, setSliderVal }) => {

    const handleChange = (event, newValue) => {
        setSliderVal(newValue);
    }

    return (
        <Slider
            defaultValue={50}
            aria-label="Default"
            valueLabelDisplay="on"
            max={max}
            step={step}
            onChange={handleChange}
            value={sliderVal}
        />
    );
}

export default RangeSlider;