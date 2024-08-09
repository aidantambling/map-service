import React, { useState } from "react";
import "./SettingsModal.scss";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { findConcepts } from "../useCensusData";
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { Tooltip } from "@mui/material";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";

const SettingsModal = ({ palettes, setSelectedPalette }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const [activeTab, setActiveTab] = useState('preset');
    const [color, setColor] = useColor("#561ecb");
    const [customColors, setCustomColors] = useState(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
    const [selectedBox, setSelectedBox] = useState(null);

    const addColor = (color) => {
        const newColors = [...customColors];
        newColors[selectedBox] = color.hex;
        setCustomColors(newColors);
    }

    const changePalette = (palette) => {
        console.log(palette);
        setSelectedPalette(palette.colors);
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
        <div className='settings-modal'>
            <button onClick={handleOpen} className="btn-modal">
                Settings
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div className='modal-container'>
                    <div className="modal-content">
                        <div>
                            <button onClick={() => { setActiveTab('preset') }}>Preset color palettes</button>
                            <button onClick={() => { setActiveTab('custom') }}>Create your own palette</button>
                        </div>
                        {activeTab === 'preset' ?
                            <>
                                {
                                    palettes && palettes.length > 0 ?
                                        <>
                                            {palettes.map((palette, index) => (
                                                <div key={index} className='palette-div'>
                                                    <button onClick={() => { changePalette(palette) }}>
                                                        <h3>{palette.name}</h3>
                                                    </button>
                                                    <div className='palette-colors'>
                                                        {palette.colors.map((color, idx) => (
                                                            <div key={idx} className='color-box' style={{ backgroundColor: color }}>
                                                                {color}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                        :
                                        <>JK they don't</>
                                }
                            </>
                            :
                            <>
                                <ColorPicker color={color} onChange={handleColorChange} />
                                {
                                    customColors && customColors.length > 0 ?
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
                                        :
                                        <>No colors selected</>
                                }
                            </>
                        }
                        <button onClick={() => { setSelectedPalette(customColors) }}>Click Me</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default SettingsModal;