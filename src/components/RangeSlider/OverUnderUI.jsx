import { useState } from "react";
import { motion } from "motion/react"
import OverUnderSlider from './OverUnderSlider';
import TextField from '@mui/material/TextField';

const OverUnderUI = ({ overUnderRef, sliderSettings, setSliderSettings }) => {
    const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
    const [secondPosition, setSecondPosition] = useState({ x: 0, y: 500 });

    const transitionToText = () => {
        setBasePosition({ x: 500, y: 0 });
        setSecondPosition({ x: 0, y: 0 });
    }

    const transitionToSlider = (shouldUpdate) => {
        if (shouldUpdate) {
            // user clicked check => set the slider val
            const newVal = Number(overUnderRef.current?.value);
            if (!isNaN(newVal)) {
                setSliderSettings(prev => ({
                    ...prev,
                    val: newVal
                }));
            }
        }
        else {
            // user clicked x => reset the text val
            setTimeout(() => {
                if (overUnderRef.current) {
                    overUnderRef.current.value = sliderSettings.val
                }
            }, 2000)
        }

        requestAnimationFrame(() => {
            setSecondPosition({ x: 0, y: 500 });
            setBasePosition({ x: 0, y: 0 });
        });
    }

    const handleChange = (event, newValue) => {
        setSliderSettings(prev => ({
            ...prev,
            val: newValue
        }))
        overUnderRef.current.value = newValue;
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
                        <OverUnderSlider max={sliderSettings.max} step={sliderSettings.step} val={sliderSettings.val} handleChange={handleChange} />
                    </motion.div>
                    <motion.div
                        className="slider-flex"
                        animate={{ x: secondPosition.x, y: secondPosition.y }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <button onClick={() => transitionToSlider(false)} style={{ marginRight: '5%' }}>
                            <img src='white_x.png' />
                        </button>
                        <TextField id="standard-basic"
                            label="Enter cutoff"
                            size="small"
                            variant="outlined"
                            defaultValue={sliderSettings.val}
                            inputRef={overUnderRef}
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
                        <button onClick={() => transitionToSlider(true)} style={{ marginLeft: '5%' }}>
                            <img src='white_checkmark.png' />
                        </button>
                    </motion.div>
                </div>
            </div>
        </>
    )
}

export default OverUnderUI;