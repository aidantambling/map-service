import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';
import './TreeView.scss';

const TreeView = ({ items, addVarToQuery, setQueryVars, queryVars }) => {
    // const [selectedItems, setSelectedItems] = useState([]);
    const apiRef = useTreeViewApiRef();

    // useEffect(() => {
    //     // if (selectedItems) {
    //     //     selectedItems.forEach((itemId) => {
    //     //         setGreen(itemId, '#A9D6DC');
    //     //     });
    //     // }
    // }, [selectedItems]);

    // const setGreen = (itemID, colorCode) => {
    //     const itemElement = apiRef.current.getItemDOMElement(itemID);
    //     if (itemElement) {
    //         console.log('element ', itemID, ' found - changing color')
    //         itemElement.style.backgroundColor = colorCode;
    //     }
    // };

    const toggleProcess = (event, ids) => {
        const variable = {
            fullpath: selectedItem.fullpath,
            access: selectedItem.group,
            id: selectedItem.id,
        }
        console.log(selectedItem.id);
        console.log(variable)
        // setQueryVars([...queryVars, variable])
        // if (selectedItems.includes(selectedItem.id)) { // if its included, we should remove it
        //     console.log('Removing selection of ', selectedItem.id)
        //     // const newSelectedItems = selectedItems.filter((id) => id !== selectedItem.id);
        //     // setGreen(selectedItem.id, '#ecf0f1');
        //     // setSelectedItems(newSelectedItems);
        // } else {
        //     console.log('Adding selection of ', selectedItem.id)
        //     // const newSelectedItems = [...selectedItems, selectedItem.id];
        //     // setSelectedItems(newSelectedItems);
        // }
    }

    useEffect(() => {
        console.log(queryVars)
    }, [queryVars])

    const handleItemSelectionToggle = (event, ids) => {
        let selectedItems = [];
        for (const id of ids) {
            const selectedItem = findItemById(items, id);
            if (selectedItem && !selectedItems.includes(selectedItem)) {
                selectedItems = [...selectedItems, selectedItem]
            }
        }
        // console.log(selectedItems)
        setQueryVars(selectedItems)
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
        <div className='tree-container'>
            {items?.length > 0 ? (
                <Box sx={{ minHeight: 352, minWidth: 250 }}>
                    <RichTreeView
                        items={items}
                        apiRef={apiRef}
                        // onItemSelectionToggle={handleItemSelectionToggle}
                        onSelectedItemsChange={handleItemSelectionToggle}
                        checkboxSelection={true}
                        multiSelect={true}
                    // selectedItems={queryVars}
                    />
                </Box>
            ) : (
                <div className='err-msg'>Select a dataset to open the query constructor!</div>
            )}
            {/* {selectedItems?.length ? 0 > (
                <ul>
                    {selectedItems.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : (
                <div>No items are selected - yet.</div>
            )} */}
        </div>
    );
};

export default TreeView;