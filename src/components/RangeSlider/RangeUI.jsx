import { motion } from "motion/react"
import { useState } from "react";
import RangeSlider from './RangeSlider';
import TextField from '@mui/material/TextField';

const RangeUI = ({ lowRangeRef, highRangeRef, sliderSettings, setSliderSettings }) => {
    const [basePosition, setBasePosition] = useState({
        x: 0, y: 0,
    })
    const [secondPosition, setSecondPosition] = useState({
        x: 500, y: 0,
    })

    const transitionToText = () => {
        setBasePosition({ x: 500, y: 0 });
        setSecondPosition({ x: 0, y: 0 });
    }

    const rangeTransitionToSlider = (shouldUpdate) => {
        if (shouldUpdate) {
            // user clicked check => set the slider val
            const newLow = Number(lowRangeRef.current?.value);
            const newHigh = Number(highRangeRef.current?.value);
            console.log(newHigh, newLow);
            if (!isNaN(newHigh) && !isNaN(newLow)) {
                const newRange = newLow <= newHigh ? [newLow, newHigh] : [newHigh, newLow];
                setSliderSettings(prev => ({
                    ...prev,
                    range: newRange
                }));
            }
        }
        else {
            // user clicked x => reset the text val
            setTimeout(() => {
                if (highRangeRef.current) {
                    highRangeRef.current.value = sliderSettings.range[0];
                }
                if (lowRangeRef.current) {
                    lowRangeRef.current.value = sliderSettings.range[1];
                }
            }, 2000)
        }

        requestAnimationFrame(() => {
            setSecondPosition({ x: 0, y: 500 });
            setBasePosition({ x: 0, y: 0 });
        });
    }

    return (
        <>
            <div className="slider-reserve">
                <div className="slider-wrapper">
                    <motion.div
                        className="slider-flex"
                        animate={{ x: basePosition.x, y: basePosition.y }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <button onClick={transitionToText} style={{ marginRight: '5%' }}>
                            <img src='white_text.png' />
                        </button>
                        <RangeSlider max={sliderSettings.max} step={sliderSettings.step} range={sliderSettings.range} setSliderSettings={setSliderSettings} lowRangeRef={lowRangeRef} highRangeRef={highRangeRef} />
                    </motion.div>
                    <motion.div
                        className="slider-flex"
                        animate={{ x: secondPosition.x, y: secondPosition.y }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <button onClick={() => rangeTransitionToSlider(false)} style={{ marginRight: '5%' }}>
                            <img src='white_x.png' />
                        </button>
                        <div className="range-fields">
                            <TextField id="standard-basic"
                                label="Enter lower boundary"
                                size="small"
                                variant="outlined"
                                inputRef={lowRangeRef}
                                sx={{
                                    input: { color: 'white' }, // text color
                                    label: { color: 'white' }, // label color
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#005790', // default border
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#005790', // hover border
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#005790', // focused border
                                        },
                                    },
                                }} />
                            <TextField id="standard-basic"
                                label="Enter upper boundary"
                                size="small"
                                variant="outlined"
                                inputRef={highRangeRef}
                                sx={{
                                    input: { color: 'white' }, // text color
                                    label: { color: 'white' }, // label color
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#005790', // default border
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#005790', // hover border
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#005790', // focused border
                                        },
                                    },
                                }} />
                        </div>
                        <button onClick={() => rangeTransitionToSlider(true)} style={{ marginLeft: '5%' }}>
                            <img src='white_checkmark.png' />
                        </button>
                    </motion.div>
                </div>
            </div>
        </>
    )
}

export default RangeUI;