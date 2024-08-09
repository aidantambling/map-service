import React, { useState } from "react";
import "./ViewModal.scss";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { findConcepts } from "../useCensusData";
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { Tooltip } from "@mui/material";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";

const ViewModal = ({ state, dispatch }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    const [activeTab, setActiveTab] = useState('preset');
    const [color, setColor] = useColor("#561ecb");
    const [customColors, setCustomColors] = useState(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
    const [selectedBox, setSelectedBox] = useState(null);

    console.log(state)


    return (
        <div className='settings-modal'>
            <button onClick={handleOpen} className="view-modal">
                Change View
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div className='modal-container'>
                    <div className="modal-content">
                        <button id="quartileButton" className={state.viewingMode === 'quartile' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewQuartile' })}>Quartile View</button>
                        <button id="sliderButton" className={state.viewingMode === 'slider' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewSlider' })}>Slider View</button>
                        <button id="comparisonButton" className={state.viewingMode === 'comparison' ? 'active-mode-btn' : ''} onClick={() => dispatch({ type: 'viewComparison' })}>Comparison View</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ViewModal;