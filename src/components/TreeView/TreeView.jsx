import * as React from 'react';
import { useEffect } from 'react';
import Box from '@mui/material/Box';

import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import "./TreeView.scss"


const TreeView = ({ items, addVarToQuery, selectedConcept, setSelectedConcept }) => {

    useEffect(() => {
        console.log(items)
    }, [items])

    const toggleProcess = (event, selectedItem, isSelected, isLeaf) => {
        if (isSelected) {
            console.log(selectedItem)
            if (isLeaf) {
                addVarToQuery(selectedItem)
            }
            // restruct si tgat we onyl are adding leaf nodes to the query....
        }
        // add the variable to query...

    }

    const handleItemSelectionToggle = (event, itemId, isSelected) => {
        const selectedItem = findItemById(items, itemId);
        if (selectedItem) {
            const isLeaf = !selectedItem?.children || selectedItem?.children?.length === 0;
            toggleProcess(event, selectedItem, isSelected, isLeaf);
        }
    };

    const findItemById = (items, itemId) => {
        for (const item of items) {
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
        <div class='tree-container'>
            {items?.length > 0 ? (
                <Box sx={{ minHeight: 352, minWidth: 250 }}>
                    <RichTreeView items={items} onItemSelectionToggle={handleItemSelectionToggle} />

                </Box>
            ) : (
                <div>NOthinski</div>
            )}
        </div>
    );
}

export default TreeView;