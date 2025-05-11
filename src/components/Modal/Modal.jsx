import React, { useState, useEffect } from "react";
import "./Modal.scss";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { findConcepts } from "../useCensusData";
import PropTypes from 'prop-types';
import { useSpring, animated } from '@react-spring/web';
import Modal from '@mui/material/Modal';
import { Tooltip } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import SpinnerLoader from "../SpinnerLoader/SpinnerLoader";
import { motion } from "motion/react"

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

const ModalDisplay = React.forwardRef(function ModalDisplay(props, ref) {
    const { nameGroups, renderConcepts, dataTitle, setDataTitle, setTitle } = props;

    // store selected nameGroup, superConcept (and superConcept digit code)
    const [valWrapper, setValWrapper] = useState([]);

    // dynamically fetch superConcepts based on nameGroup selection
    const [superConcepts, setSuperConcepts] = useState([]);

    // loading and position states for Framer + carousel modal
    const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });
    const [secondPosition, setSecondPosition] = useState({ x: 400, y: -1000 });
    const [loading, setLoading] = React.useState(true);

    // handle opening/closing of modal(s)
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setBasePosition({ x: 0, y: 0 })
        setSecondPosition({ x: 400, y: -1000 })
        setOpen(false)
    };

    // when 'confirm selection' is clicked, save data + re-render map
    const confirmSelection = () => {
        // namegroup => superconcept
        setTitle(valWrapper.nameGroup + ' => ' + valWrapper.superconcept)
        setDataTitle(valWrapper.superconcept)
        renderConcepts(valWrapper.group);
    }

    // based on selection of 41 nameGroups, find their superConcepts for carousel
    const renderSuperConcepts = (form) => {
        const pullData = async () => {
            const c = await findConcepts(form.groupPrefix);
            setSuperConcepts(c);
        }
        pullData();
    }

    // user selects one of the 41 nameGroups (grid tiles) => display corresponding carousel modal for superconcept selection
    const selectGridItem = (nameGroup) => {
        console.log(valWrapper);
        // nameGroup.conceptGroup is the nameGroup's name (e.g. Sex by Age)
        setValWrapper(prev => ({
            ...prev,
            nameGroup: nameGroup.conceptGroup
        }))

        // load the carousel
        setLoading(true);
        setBasePosition({ x: -400, y: 0 })
        setSecondPosition({ x: 400, y: 0 });

        setOpen(true);
        renderSuperConcepts(nameGroup)
        setTimeout(() => {
            setLoading(false);
        }, 1500)
    }

    const handleDeslect = () => {
        setBasePosition({ x: 0, y: 0 })
        setSecondPosition({ x: 400, y: -1000 })
    }

    return (
        <div {...props} ref={ref} className='dataset-modal'>
            <button onClick={handleOpen} className="dataset-modal-btn">
                <p className='dm-button-title'>Dataset</p>
                <p className='dm-button-sub'>
                    {
                        // truncate the title length if > 27 chars
                        dataTitle.length > 27 ?
                            dataTitle.slice(0, 24) + '...'
                            :
                            dataTitle
                    }
                </p>
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Fade in={open}>
                    <>
                        <motion.div
                            layout="position"
                            className="modal-wrapper"
                            animate={{ x: basePosition.x, y: basePosition.y }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <div
                                className="modal-container"
                            >
                                <div className="modal-header">
                                    <h2 className="modal-title">Change Dataset</h2>
                                </div>
                                <button className="exit-button" onClick={handleClose}>
                                    <img src="x-button.png" alt="Close" />
                                </button>
                                <div className="grid-container">
                                    <Grid container spacing={2}>
                                        {
                                            // map the nameGroups to a grid of 41 items.
                                            // conceptGroup field = name (e.g. Sex by Age). groupPrefix field = namegroup prefix (e.g. B01)
                                            nameGroups.map((nameGroup, index) => (
                                                <Grid item xs={4} key={index}>
                                                    <div className={'grid-item'}>
                                                        <Tooltip title={nameGroup.conceptGroup} PopperProps={{ style: { zIndex: 9999 } }}>
                                                            <button onClick={() => selectGridItem(nameGroup)} className={nameGroup.conceptGroup === valWrapper.nameGroup ? 'dataset-class-button-selected' : 'dataset-class-button'}>
                                                                {
                                                                    // truncate the group name length if necessary
                                                                    nameGroup.conceptGroup.length > 90 ?
                                                                        nameGroup.conceptGroup.slice(0, 87) + '...'
                                                                        :
                                                                        nameGroup.conceptGroup
                                                                }
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </Grid>
                                            ))}
                                    </Grid>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={false}
                            className="modal-wrapper"
                            animate={{ x: secondPosition.x, y: secondPosition.y }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <div className='modal-container'>
                                <div className="modal-header">
                                    <h2 className='modal-title'>Change Dataset - {valWrapper.nameGroup}</h2>
                                </div>
                                <button className='exit-button' onClick={() => handleDeslect()}>
                                    <img src="x-button.png" />
                                </button>
                                {!loading && superConcepts ?
                                    // render the carousel for the given concepts
                                    <div className="carousel-container">
                                        <Carousel
                                            responsive={{
                                                desktop: {
                                                    breakpoint: {
                                                        max: 3000,
                                                        min: 1024
                                                    },
                                                    items: 3,
                                                    partialVisibilityGutter: 40
                                                },
                                                mobile: {
                                                    breakpoint: {
                                                        max: 464,
                                                        min: 0
                                                    },
                                                    items: 1,
                                                    partialVisibilityGutter: 30
                                                },
                                                tablet: {
                                                    breakpoint: {
                                                        max: 1024,
                                                        min: 464
                                                    },
                                                    items: 2,
                                                    partialVisibilityGutter: 30
                                                }
                                            }}
                                        >
                                            {superConcepts?.map((tab, index) => (
                                                <button id={tab.concept} key={index} className={valWrapper.superconcept === tab.concept ? 'dataset-class-button-selected' : 'dataset-class-button'} onClick={() => {
                                                    setValWrapper(prev => ({
                                                        ...prev,
                                                        group: tab.group,
                                                        superconcept: tab.concept
                                                    }))
                                                }}>{tab.concept}</button>
                                            ))}
                                        </Carousel>
                                    </div>
                                    :
                                    // display loading spinner
                                    <div className="spinner-container">
                                        <SpinnerLoader showSpinner={loading} source={'spinner.svg'} />
                                    </div>
                                }
                                <div className="modal-buttons-container">
                                    <button className="confirm-selection" onClick={() => { confirmSelection(); handleClose(); handleParentClose() }}>Confirm Selection</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                </Fade>
            </Modal>
        </div>
    );
});

export default ModalDisplay;