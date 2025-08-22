import React, { useState } from "react";
import PropTypes from 'prop-types';
import { useSpring, animated } from '@react-spring/web';
import Modal from '@mui/material/Modal';
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import "./ColorModal.scss";
import BaseModal from "../BaseModal/BaseModal";

const Fade = React.forwardRef(function Fade(props, ref) {
    const {
        children,
        in: open,
        onClick,
        onEnter,
        onExited,
        ownerState,
        ...other
    } = props;
    const style = useSpring({
        from: { opacity: 0 },
        to: { opacity: open ? 1 : 0 },
        onStart: () => {
            if (open && onEnter) {
                onEnter(null, true);
            }
        },
        onRest: () => {
            if (!open && onExited) {
                onExited(null, true);
            }
        },
    });

    return (
        <animated.div ref={ref} style={style} {...other}>
            {React.cloneElement(children, { onClick })}
        </animated.div>
    );
});

Fade.propTypes = {
    children: PropTypes.element.isRequired,
    in: PropTypes.bool,
    onClick: PropTypes.any,
    onEnter: PropTypes.func,
    onExited: PropTypes.func,
    ownerState: PropTypes.any,
};

const SettingsModal = ({ palettes, setSelectedPalette, selectedPalette }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const [activeTab, setActiveTab] = useState('preset');
    const [color, setColor] = useColor("#561ecb");
    const [customColors, setCustomColors] = useState(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
    const [selectedBox, setSelectedBox] = useState(null);

    const changePalette = (palette) => {
        setSelectedPalette(palette);
        console.log(selectedPalette);
    }

    const handleColorChange = (color) => {
        if (selectedBox !== null) {
            const newColors = [...customColors];
            newColors[selectedBox] = color.hex;
            setCustomColors(newColors);
            setColor(color)
        }
    }

    const handleBoxClick = (index) => {
        setSelectedBox(index);
    };

    return (
        <BaseModal dataTitle={"Color"} dataSubtitle={selectedPalette.name} open={open} handleOpen={handleOpen} handleClose={handleClose}>
            <div className="modal-positioner">
                <div className='modal-wrapper'>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h2 className="modal-title">Select Your Map's Color Palette!</h2>
                        </div>
                        <button className="exit-button" onClick={handleClose}>
                            <img src="x-button.png" alt="Close" />
                        </button>
                        <div className="palette-selection-bar">
                            <button className={activeTab === 'preset' ? 'activeTab' : 'inactiveTab'} onClick={() => { setActiveTab('preset') }}>Preset color palettes</button>
                            <button className={activeTab === 'custom' ? 'activeTab' : 'inactiveTab'} onClick={() => { setActiveTab('custom') }}>Create your own palette</button>
                        </div>
                        {activeTab === 'preset' ?
                            <>
                                {
                                    palettes && palettes.length > 0 ?
                                        <>
                                            {palettes.map((palette, index) => (
                                                <button className={palette.id == selectedPalette.id ? 'selected-button' : ''} onClick={() => { changePalette(palette) }}>
                                                    <h3>{palette.name}</h3>
                                                    <div className='palette-colors'>
                                                        {palette.colors.map((color, idx) => (
                                                            <div key={idx} className='palette-color-box' style={{ backgroundColor: color }}></div>
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                        :
                                        <></>
                                }
                            </>
                            :
                            <div className="custom-color-div">
                                <ColorPicker color={color} onChange={handleColorChange} />
                                {
                                    customColors && customColors.length > 0 ?
                                        <div className='custom-color-right-side'>
                                            <div className='custom-colors-container'>
                                                {
                                                    customColors.map((color, index) => (
                                                        <div
                                                            key={index}
                                                            className={`selectable-color-box ${selectedBox === index ? 'selected' : ''}`}
                                                            style={{ backgroundColor: color, width: '50px', height: '50px', margin: '5px', border: '1px solid #000' }}
                                                            onClick={() => handleBoxClick(index)}
                                                        >
                                                            {color}
                                                        </div>

                                                    ))
                                                }

                                            </div>
                                            <button onClick={() => { setSelectedPalette(customColors) }}>Set As Active Palette</button>
                                        </div>
                                        :
                                        <>No colors selected</>
                                }
                            </div>
                        }
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default SettingsModal;