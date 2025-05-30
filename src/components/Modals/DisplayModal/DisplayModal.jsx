import React, { useState } from "react";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import 'react-multi-carousel/lib/styles.css';
import "react-color-palette/css";
import BaseModal from "../BaseModal/BaseModal";
import "./DisplayModal.scss";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function verticalA11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

function a11yProps(index) {
    return {
        id: `full-width-tab-${index}`,
        'aria-controls': `full-width-tabpanel-${index}`,
    };
}

const VerticalTabs = ({ dispatch }) => {
    const [value, setValue] = React.useState(0);
    const [sliderTab, setSliderTab] = useState(0);
    const [inspectTab, setInspectTab] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const handleSliderChange = (event, newValue) => {
        setSliderTab(newValue);
    };

    const handleInspectChange = (event, newValue) => {
        setInspectTab(newValue);
    }

    const changeDisplayMode = (newMode) => {
        console.log(newMode);
        dispatch({ type: newMode })
    }

    return (
        <>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                indicatorColor="secondary"
                textColor="inherit"
                value={value}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                className="tabs"
                sx={{
                    borderRight: 1, borderColor: 'divider',
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#00BFFF', // custom indicator color
                    },
                    '& .Mui-selected': {
                        color: 'red', // selected tab text color
                    },
                    '& .MuiTab-root': {
                        color: 'white', // default tab text color
                    }
                }}
            >
                <Tab className="tab" label="Group by Quartiles" title="Group counties into four equally sized data ranges." {...verticalA11yProps(0)} />
                <Tab className="tab" label="Set Value Threshold" title="Group counties based on whether their values are above, below, or within a specific range." {...verticalA11yProps(1)} />
                <Tab className="tab" label="Compare to County" title="Group counties by comparing them to a selected county's value or value range." {...verticalA11yProps(2)} />
            </Tabs>
            <TabPanel className="tab-panel" value={value} index={0}>
                <>
                    <h2>Group By Quartiles</h2>
                    <p>Group counties into 4 equal parts based on distribution.</p>
                    <img src='quartile.gif' />
                    <button onClick={() => changeDisplayMode('viewQuartile')}>Select</button>
                </>
            </TabPanel>
            <TabPanel className="tab-panel" value={value} index={1}>
                <Tabs
                    value={sliderTab}
                    onChange={handleSliderChange}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                    aria-label="full width tabs example"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#00BFFF', // custom indicator color
                        },
                        '& .Mui-selected': {
                            color: '#00BFFF', // selected tab text color
                        },
                        '& .MuiTab-root': {
                            color: 'white', // default tab text color
                        }
                    }}
                >
                    <Tab label="Above/Below Value" title="Show counties that are above or below a specific cutoff value." {...a11yProps(0)} />
                    <Tab label="Within Value Range" title="Show counties whose values fall inside a custom numeric range." {...a11yProps(1)} />
                </Tabs>
                <TabPanel value={sliderTab} index={0}>
                    <>
                        <h2>Set Value Threshold - Above/Below Value</h2>
                        <p>Show which counties are above or below a chosen number.</p>
                        <img src='quartile.gif' />
                        <button onClick={() => changeDisplayMode('viewSliderOverUnder')}>Select</button>
                    </>
                </TabPanel>
                <TabPanel value={sliderTab} index={1}>
                    <>
                        <h2>Set Value Threshold - Within Value Range</h2>
                        <p>Highlight counties within a specified numeric range.</p>
                        <img src='quartile.gif' />
                        <button onClick={() => changeDisplayMode('viewSliderRange')}>Select</button>
                    </>
                </TabPanel>
            </TabPanel>
            <TabPanel className="tab-panel" value={value} index={2}>
                <Tabs
                    value={inspectTab}
                    onChange={handleInspectChange}
                    indicatorColor="secondary"
                    textColor="inherit"
                    variant="fullWidth"
                    aria-label="full width tabs example"
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#00BFFF', // custom indicator color
                        },
                        '& .Mui-selected': {
                            color: '#00BFFF', // selected tab text color
                        },
                        '& .MuiTab-root': {
                            color: 'white', // default tab text color
                        }
                    }}
                >
                    <Tab label="Higher/Lower than County" title="Compare each county's value to a selected county and show whether it's higher or lower." {...a11yProps(0)} />
                    <Tab label="Within County's Range" title="Display counties whose values fall within the value range of a selected county." {...a11yProps(1)} />
                </Tabs>
                <TabPanel value={inspectTab} index={0}>
                    <>
                        <h2>Compare to County - Higher/Lower than County</h2>
                        <p>Compare counties to a selected one's value.</p>
                        <img src='quartile.gif' />
                        <button onClick={() => changeDisplayMode('viewInspectOverUnder')}>Select</button>
                    </>
                </TabPanel>
                <TabPanel value={inspectTab} index={1}>
                    <>
                        <h2>Compare to County - Within County's Range</h2>
                        <p>Highlight counties within a specified numeric range of a selected county.</p>
                        <img src='quartile.gif' />
                        <button onClick={() => changeDisplayMode('viewInspectRange')}>Select</button>
                    </>
                </TabPanel>
            </TabPanel>
        </>
    );
}

const DisplayModal = ({ state, dispatch }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

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
                    <div className="modal-body">
                        <VerticalTabs dispatch={dispatch} />
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default DisplayModal;