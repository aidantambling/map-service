import * as React from 'react';
import { useEffect } from 'react';
import Box from '@mui/material/Box';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';
import './TreeView.scss';

const TreeView = ({ concepts, setQueryVars }) => {
    const apiRef = useTreeViewApiRef();

    const [selectionPropagation, setSelectionPropagation] = React.useState({
        parents: true,
        descendants: true,
    });

    // clear the selected concepts when user selects a new superConcept
    useEffect(() => {
        setQueryVars(prev => ({
            ...prev,
            current: []
        }));
    }, [concepts])

    // handle selection/deselection of concepts by user
    const handleItemSelectionToggle = (event, ids) => {
        let allItems = [];

        // add the selected concepts to array
        for (const id of ids) {
            const selectedItem = findItemById(concepts, id);
            allItems = [...allItems, selectedItem]
        }

        // simplify array by removing redundant concepts (e.g., parent is already selected)
        const filteredItems = [];
        allItems.sort((a, b) => a?.fullpath?.length - b?.fullpath?.length);
        for (let item of allItems) {
            if (!item) continue;
            if (!filteredItems.some(parent => item.fullpath.startsWith(parent.fullpath))) {
                filteredItems.push(item);
            }
        }
        setQueryVars(prev => ({
            ...prev,
            current: filteredItems
        }));
    };

    // helper function to retrieve concept based on id
    const findItemById = (concepts, itemId) => {
        for (const item of concepts) {
            if (item.id === itemId) {
                return item;
            }
            if (item.children) {
                const found = findItemById(item.children, itemId);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    return (
        <div className='tree-container'>
            {
                // display items
                concepts?.length > 0 ? (
                    <Box sx={{ minHeight: 352, minWidth: 250 }}>
                        <RichTreeView
                            items={concepts}
                            apiRef={apiRef}
                            onSelectedItemsChange={handleItemSelectionToggle}
                            checkboxSelection
                            multiSelect
                            selectionPropagation={selectionPropagation}
                        />
                    </Box>
                ) : (
                    // no concepts - superConcept hasn't been selected yet
                    <div className='err-msg'>Select a dataset to open the query constructor!</div>
                )}
        </div>
    );
};

export default TreeView;