import * as React from 'react';
import { useContext } from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import './VerticalToggleButtons.scss'
import Tooltip from '@mui/material/Tooltip';
import { UIContext } from '../contexts/UIContext';
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
    color: 'white',
    backgroundColor: '#1976d2', // MUI primary blue
    // border: '1px solid white',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',

    '&.Mui-selected': {
        backgroundColor: '#004ba0 !important', // darker blue for selected
        color: '#fff',
        // border: '2px solid #fff',   // thicker border
        fontWeight: 'bold',
    },

    '&:hover': {
        backgroundColor: '#42a5f5 !important', // lighter blue on hover
    },

    '&.Mui-selected:hover': {
        backgroundColor: '#1565c0 !important',
    },
}));


const VerticalToggleButtons = ({ queryVars }) => {

    const [view, setView] = React.useState('list');
    const [arrowClicked, setArrowClicked] = React.useState(false);
    const { uiDispatch } = useContext(UIContext);

    const handleChange = (event, nextView) => {
        console.log(queryVars);
        // only support a change if variable(s) are selected

        if (nextView === 'SelectButton') {
            setArrowClicked(!arrowClicked);
            return;
        }

        if (queryVars.current.length !== 0) {
            if (nextView !== null) {
                setView(nextView);
                uiDispatch({
                    type: 'SET_GEOGRAPHY_MODE',
                    geographyMode: nextView,
                })
            }
            setArrowClicked(false);
        }
    };

    const baseButton = <Tooltip title="Select Geography Type" placement="right">
        <CustomToggleButton value="SelectButton" aria-label="SelectButton">
            <img src={`US.png`} className='toggle-img' />
        </CustomToggleButton>
    </Tooltip>

    const primaryGeographyTypes = ['US',
        // 'State', 'County'
    ].map((geoType) =>
        <Tooltip title={geoType} placement="right">
            <CustomToggleButton value={geoType} aria-label={geoType}>
                <img src={`${geoType}.png`} className='toggle-img' />
            </CustomToggleButton>
        </Tooltip>
    );
    const secondaryGeographyTypes = ['US', 'State', 'County', 'Region', 'Division', 'CountySubdivision', 'Place', 'AIANNH'].map((geoType) =>
        <Tooltip title={geoType} placement="right">
            <CustomToggleButton value={geoType} aria-label={geoType}>
                <img src={`${geoType}.png`} className='toggle-img' />
            </CustomToggleButton>
        </Tooltip>
    );

    return (
        <ToggleButtonGroup
            orientation="vertical"
            value={view}
            exclusive
            onChange={handleChange}
            className="toggle-buttons"
        >
            {baseButton}
            {
                !arrowClicked ?
                    <></>
                    :
                    <>
                        {secondaryGeographyTypes}
                        <Tooltip title="View Less" placement="right">
                            <CustomToggleButton value="ViewLess" aria-label="Region">
                                <FaArrowUp className='toggle-img' />
                            </CustomToggleButton>
                        </Tooltip>
                    </>
            }
        </ToggleButtonGroup>


    );
}

export default VerticalToggleButtons;