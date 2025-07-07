import { createContext, useReducer, useState } from 'react';

export const UIContext = createContext();

const reducer = (state, action) => {
    switch (action.type) {
        case "SET_VIEWING_MODE": {
            const { viewingMode, comparisonMode = null } = action;
            return { ...state, viewingMode, comparisonMode }
        }
        case "SET_GEOGRAPHY_MODE": {
            if (action.geographyMode !== 'CountySubdivision') {
                return { ...state, activeState: null, geographyMode: action.geographyMode }
            }
            return { ...state, geographyMode: action.geographyMode };
        }
        case "SET_ACTIVE_STATE": {
            return { ...state, activeState: action.activeState };
        }
        default:
            throw new Error('Invalid view mode');
    }
};

export const UIProvider = ({ children }) => {
    const [uiState, uiDispatch] = useReducer(reducer, {
        viewingMode: 'Quartile',
        comparisonMode: 'overUnder',
        geographyMode: 'County'
    });

    const [selectedPalette, setSelectedPalette] = useState({
        id: 'palette1',
        name: 'Cool Blue',
        colors: ['#77E4C8', '#36C2CE', '#478CCF', '#4535C1'],
    });

    return (
        <UIContext.Provider value={{
            viewingMode: uiState.viewingMode,
            comparisonMode: uiState.comparisonMode,
            geographyMode: uiState.geographyMode,
            activeState: uiState.activeState,
            uiDispatch,
            selectedPalette,
            setSelectedPalette
        }}>
            {children}
        </UIContext.Provider>
    );
};
