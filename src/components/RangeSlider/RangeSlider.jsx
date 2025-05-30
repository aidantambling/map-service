import * as React from 'react';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

const RangeSlider = ({ max, step, range, setSliderSettings, lowRangeRef, highRangeRef }) => {
    // const [value, setValue] = React.useState([20, 37]);

    const handleChange = (event, newValue) => {
        setSliderSettings(prev => ({
            ...prev,
            range: newValue
        }))
        // setValue(newValue);
        lowRangeRef.current.value = newValue[0];
        highRangeRef.current.value = newValue[1];
    };

    return (
        <Slider
            getAriaLabel={() => 'Temperature range'}
            value={range}
            onChange={handleChange}
            max={max}
            step={step}
            valueLabelDisplay="auto"
        />
    );
}

export default RangeSlider;