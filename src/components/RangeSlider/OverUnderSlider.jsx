import * as React from 'react';
import Slider from '@mui/material/Slider';

const OverUnderSlider = ({ max, step, setSliderSettings }) => {

    const handleChange = (event, newValue) => {
        setSliderSettings(prev => ({
            ...prev,
            val: newValue
        }))
    }

    return (
        <Slider
            defaultValue={0}
            aria-label="Default"
            valueLabelDisplay="on"
            max={max}
            step={step}
            onChange={handleChange}
        />
    );
}

export default OverUnderSlider;