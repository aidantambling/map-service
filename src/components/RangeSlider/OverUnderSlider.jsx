import * as React from 'react';
import Slider from '@mui/material/Slider';

const OverUnderSlider = ({ max, step, val, handleChange }) => {

    return (
        <Slider
            defaultValue={0}
            aria-label="Default"
            valueLabelDisplay="on"
            value={val}
            max={max}
            step={step}
            onChange={handleChange}
        />
    );
}

export default OverUnderSlider;