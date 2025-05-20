import React, { useState, useEffect } from "react";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import 'react-multi-carousel/lib/styles.css';
import "react-color-palette/css";
import BaseModal from "../BaseModal/BaseModal";
import "./DisplayModal.scss";

export function SplitButton({ options, clicker }) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef(null);
    const [selectedIndex, setSelectedIndex] = React.useState(1);

    const handleMenuItemClick = (event, index) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }

        setOpen(false);
    };

    return (
        <React.Fragment>
            <ButtonGroup
                variant="contained"
                ref={anchorRef}
                aria-label="Button group with a nested menu"
            >
                <Button onClick={() => { clicker(options[selectedIndex]) }}>{options[selectedIndex]}</Button>
                <Button
                    size="small"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon />
                </Button>
            </ButtonGroup>
            <Popper
                sx={{ zIndex: 1 }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({ TransitionProps, placement }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            disabled={index === 2}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </React.Fragment>
    );
}

const DisplayModal = ({ state, dispatch }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const anchorRef = React.useRef(null);

    const sliderOptions = ['Over/Under Slider', 'Range Slider'];
    const handleSliderClick = (value) => {
        if (value === 'Over/Under Slider') {
            dispatch({ type: 'viewSliderOverUnder' })
        }
        else if (value === 'Range Slider') {
            dispatch({ type: 'viewSliderRange' })
        }
    }
    const selectionOptions = ['Over/Under Selection', 'Range Selection'];
    const handleCompClick = (value) => {
        if (value === 'Over/Under Selection') {
            dispatch({ type: 'viewComparisonOverUnder' })
        }
        else if (value === 'Range Selection') {
            dispatch({ type: 'viewComparisonRange' })
        }
    }

    const renderDescription = () => {
        if (state.viewingMode === 'Quartile') return (
            <>
                <h2>Quartile</h2>
                <p>Each county is colored according to the quartile it falls into for the chosen statistic.</p>
                <img src='quartile.gif' />
            </>)
        if (state.viewingMode === 'Slider' && state.comparisonMode === 'overUnder') return (
            <>
                <h2>Slider - Over/Under</h2>
                <p>Each county is colored according to whether it falls over or under the chosen slider value.</p>
                <img src='quartile.gif' />
            </>)
        if (state.viewingMode === 'Slider' && state.comparisonMode === 'viewCompRange') return (
            <>
                <h2>Slider - Range</h2>
                <p>Each county is colored according to whether it falls in the chosen range of values.</p>
                <img src='quartile.gif' />
            </>)
        if (state.viewingMode === 'Comparison' && state.comparisonMode === 'overUnder') return (
            <>
                <h2>Comparison - Over/Under</h2>
                <p>Each county is colored according to whether it falls over or under the chosen county.</p>
                <img src='quartile.gif' />
            </>)
        if (state.viewingMode === 'Comparison' && state.comparisonMode === 'viewCompRange') return (
            <>
                <h2>Comparison - Range</h2>
                <p>Each county is colored according to whether it falls in the range of the chosen county.</p>
                <img src='quartile.gif' />
            </>)
        else return 'Unknown';
    }

    return (
        <BaseModal dataTitle={"Display"} dataSubtitle={state.viewingMode} open={open} handleOpen={handleOpen} handleClose={handleClose}>
            <div className='modal-wrapper'>
                <div className="modal-container">
                    <div className="modal-header">
                        <h2 className="modal-title">Select Display Type</h2>
                    </div>
                    <button className="exit-button" onClick={handleClose}>
                        <img src="x-button.png" alt="Close" />
                    </button>
                    <div className="view-box">
                        <ButtonGroup
                            variant="contained"
                            ref={anchorRef}
                            aria-label="Button group with a nested menu"
                        >
                            <Button onClick={() => dispatch({ type: 'viewQuartile' })}>Quartile</Button>
                            <SplitButton options={sliderOptions} clicker={handleSliderClick} />
                            <SplitButton options={selectionOptions} clicker={handleCompClick} />
                        </ButtonGroup>
                    </div>
                    <div className="context-box">
                        {renderDescription()}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default DisplayModal;