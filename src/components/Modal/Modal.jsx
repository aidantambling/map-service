import React, { useState } from "react";
import "./Modal.css";
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { findConcepts } from "../useCensusData";
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { Tooltip } from "@mui/material";


const ChildModal = ({ baseConcepts, activeDatasetClassButton, setValWrapper, tab, renderConcepts, confirmSelection, handleParentClose }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => {
        setOpen(true);
        renderConcepts(tab)
    };

    const handleClose = () => {
        setOpen(false);
    };

    const responsive = {
        superLargeDesktop: {
            // the naming can be any, depends on you.
            breakpoint: { max: 4000, min: 3000 },
            items: 5
        },
        desktop: {
            breakpoint: { max: 3000, min: 1024 },
            items: 3
        },
        tablet: {
            breakpoint: { max: 1024, min: 464 },
            items: 2
        },
        mobile: {
            breakpoint: { max: 464, min: 0 },
            items: 1
        }
    };

    return (
        <React.Fragment>
            <button className={activeDatasetClassButton === tab.conceptGroup ? 'selected-dataset-class-button' : 'dataset-class-button'}
                onClick={handleOpen}> {tab.conceptGroup}
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="child-modal-title"
                aria-describedby="child-modal-description"
            >
                <div className='modal-container'>
                    {baseConcepts.length > 0 ? <Carousel
                        centerMode={false}
                        customTransition="all 0.3s linear"
                        draggable={true}
                        focusOnSelect={true}
                        keyBoardControl={true}
                        renderArrowsWhenDisabled={false}
                        responsive={responsive}
                        slidesToSlide={2}
                        swipeable>
                        {baseConcepts?.map((tab, index) => (
                            <button className={activeDatasetClassButton === tab.groupPrefix ? 'selected-dataset-class-button' : 'dataset-class-button'} id={tab.concept} onClick={() => {
                                setValWrapper({
                                    group: tab.group,
                                    text: tab.concept
                                })
                            }}>{tab.concept}</button>
                        ))}
                    </Carousel> : <div>No</div>
                    }
                    <button className="confirm-selection" onClick={() => { confirmSelection(); handleClose(); handleParentClose() }}>Confirm Selection</button>
                    <button onClick={handleClose}>Close Child Modal</button>
                </div>
            </Modal>
        </React.Fragment>
    );
}


const ModalDisplay = React.forwardRef(function ModalDisplay(props, ref) {
    const { conceptGroups, renderSubconcepts, dataTitle, setDataTitle, setTitle } = props;

    const [activeDatasetClassButton, setActiveDatasetClassButton] = useState("All");
    const [baseConcepts, setBaseConcepts] = useState([]);

    const [valWrapper, setValWrapper] = useState([]);

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const confirmSelection = () => {
        console.log('Confirming selection of ', valWrapper);
        setTitle(activeDatasetClassButton + ' => ' + valWrapper.text)
        setDataTitle(valWrapper.text)
        renderSubconcepts(valWrapper.group);
        // need to also reset the boolean state,. but for this we prob should use reducer
    }

    const renderConcepts = (form) => {
        console.log(form.conceptGroup)
        setActiveDatasetClassButton(form.conceptGroup)
        const pullData = async () => {
            const c = await findConcepts(form.groupPrefix);
            console.log(c)
            setBaseConcepts(c);
        }
        pullData();
    }

    return (
        <div {...props} ref={ref}>
            <button onClick={handleOpen} className="btn-modal">
                {dataTitle}
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <div className='modal-container'>
                    <div className="modal-content">
                        <Grid container spacing={2}>
                            {conceptGroups.map((tab, index) => (
                                <Grid xs={4} >
                                    <div class='tempContainer'>
                                        <ChildModal baseConcepts={baseConcepts} activeDatasetClassButton={activeDatasetClassButton} setValWrapper={setValWrapper} tab={tab} renderConcepts={renderConcepts} confirmSelection={confirmSelection} handleParentClose={handleClose} />
                                    </div>
                                </Grid>
                            ))}
                        </Grid>
                    </div>
                </div>
            </Modal>
        </div>
    );
});

export default ModalDisplay;