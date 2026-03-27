import { useState } from "react";
import { motion, wrap } from "motion/react"
import Slider from '@mui/material/Slider';
import AnimatedInputSwitch from "./AnimatedInputSwitch";

const OverUnderUI = ({ overUnderRef, sliderSettings, setSliderSettings }) => {
    const items = [1, 2];
    const [selectedItem, setSelectedItem] = useState(items[0]);
    const [direction, setDirection] = useState(1);

    function setSlide(newDirection) {
        const nextItem = wrap(1, items.length + 1, selectedItem + newDirection);
        setSelectedItem(nextItem);
        setDirection(newDirection);
    }

    const handleSliderChange = (event, newValue) => {
        setSliderSettings(prev => ({
            ...prev,
            val: newValue
        }))
        overUnderRef.current.value = newValue;
    }

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const handleInputChange = (event) => {
        const newValue = clamp(Number(event.target.value), 0, sliderSettings.max);
        setSliderSettings(prev => ({
            ...prev,
            val: newValue
        }))
        overUnderRef.current.value = newValue;
    }

    const color = selectedItem === 1 ? "#0cdcf7" : "#005790";

    return (
        <AnimatedInputSwitch color={color} setSlide={setSlide} direction={direction} selectedItem={selectedItem}>
            <motion.div
                key={selectedItem}
                className="slider-inputs"
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{
                    opacity: 1,
                    x: 0,
                    transition: {
                        type: "spring",
                        bounce: 0.35,
                        duration: 0.3
                    }
                }}
                exit={{ opacity: 0, x: direction * -50 }}
            >
                <>
                    {selectedItem === 1 ? (
                        <>
                            <input
                                ref={overUnderRef}
                                type="number"
                                value={sliderSettings.val}
                                onChange={handleInputChange}
                            />
                        </>
                    ) : (
                        <>
                            <Slider
                                aria-label="Default"
                                valueLabelDisplay="on"
                                value={sliderSettings.val}
                                max={sliderSettings.max}
                                step={sliderSettings.step}
                                onChange={handleSliderChange}
                            />
                        </>
                    )}

                </>
            </motion.div>
        </AnimatedInputSwitch>
    );
};

export default OverUnderUI;