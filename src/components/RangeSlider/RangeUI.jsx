import { useState } from "react";
import { motion, wrap } from "motion/react"
import Slider from '@mui/material/Slider';
import AnimatedInputSwitch from "./AnimatedInputSwitch";

const RangeUI = ({ lowRangeRef, highRangeRef, sliderSettings, setSliderSettings }) => {
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
            range: newValue
        }));

        if (lowRangeRef.current) lowRangeRef.current.value = newValue[0];
        if (highRangeRef.current) highRangeRef.current.value = newValue[1];
    };

    const handleInputChange = (index) => (event) => {
        const value = Number(event.target.value);

        setSliderSettings(prev => {
            const nextRange = [...prev.range];
            nextRange[index] = value;

            if (lowRangeRef.current) lowRangeRef.current.value = nextRange[0];
            if (highRangeRef.current) highRangeRef.current.value = nextRange[1];

            return {
                ...prev,
                range: nextRange
            };
        });
    };

    const color = selectedItem === 1 ? "#0cdcf7" : "#005790";

    return (
        <>
            <AnimatedInputSwitch color={color} setSlide={setSlide} direction={direction} selectedItem={selectedItem}>
                <motion.div
                    className="slider-inputs"
                    key={selectedItem}
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
                    {selectedItem === 1 ? (
                        <>
                            <input
                                ref={lowRangeRef}
                                type="number"
                                value={sliderSettings.range[0]}
                                onChange={handleInputChange(0)}
                            />
                            <input
                                ref={highRangeRef}
                                type="number"
                                value={sliderSettings.range[1]}
                                onChange={handleInputChange(1)}
                            />

                        </>
                    ) : (
                        <>
                            <Slider
                                aria-label="Default"
                                valueLabelDisplay="on"
                                value={sliderSettings.range}
                                max={sliderSettings.max}
                                step={sliderSettings.step}
                                onChange={handleSliderChange}
                            />
                        </>
                    )}
                </motion.div>
            </AnimatedInputSwitch>
        </>
    )
}

export default RangeUI;