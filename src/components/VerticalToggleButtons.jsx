import * as React from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import './VerticalToggleButtons.scss'
import Tooltip from '@mui/material/Tooltip';

const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
    color: 'white',
    backgroundColor: '#1976d2', // MUI primary blue
    border: '1px solid white',
    borderRadius: '4px',
    transition: 'all 0.2s ease-in-out',

    '&.Mui-selected': {
        backgroundColor: '#004ba0 !important', // darker blue for selected
        color: '#fff',
        border: '2px solid #fff',   // thicker border
        fontWeight: 'bold',
    },

    '&:hover': {
        backgroundColor: '#42a5f5 !important', // lighter blue on hover
    },

    '&.Mui-selected:hover': {
        backgroundColor: '#1565c0 !important',
    },
}));


const VerticalToggleButtons = ({ setGeographyMode, queryVars }) => {
    const [view, setView] = React.useState('list');

    const handleChange = (event, nextView) => {
        // only support a change if variable(s) are selected
        if (queryVars.current.length !== 0) {
            if (nextView !== null) {
                console.log('changing geography mode in VTB')
                setView(nextView);
                setGeographyMode(nextView);
            }
        }
    };

    return (
        <ToggleButtonGroup
            orientation="vertical"
            value={view}
            exclusive
            onChange={handleChange}
            className="toggle-buttons"
        >
            <Tooltip title="Country" placement="right">
                <CustomToggleButton value="Country" aria-label="Country">
                    <img src="us_outline.png" className='toggle-img' />
                </CustomToggleButton>
            </Tooltip>

            <Tooltip title="State" placement="right">
                <CustomToggleButton value="State" aria-label="State">
                    <img src="texas_outline.png" className='toggle-img' />
                </CustomToggleButton>
            </Tooltip>

            <Tooltip title="County" placement="right">
                <CustomToggleButton value="County" aria-label="County">
                    <img src="cook_outline.png" className='toggle-img' />
                </CustomToggleButton>
            </Tooltip>
        </ToggleButtonGroup>
    );
}

export default VerticalToggleButtons;