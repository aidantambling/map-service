import * as React from 'react';
import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
// import { TreeViewSelectionPropagation } from '@mui/x-tree-view/models';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';
import './TreeView.scss';

const TreeView = ({ items, setQueryVars, queryVars }) => {
    const apiRef = useTreeViewApiRef();

    const [selectionPropagation, setSelectionPropagation] = React.useState({
        parents: true,
        descendants: true,
    });

    useEffect(() => {
        console.log(queryVars)
    }, [queryVars])

    useEffect(() => {
        setQueryVars([]);
    }, [items])

    const handleItemSelectionToggle = (event, ids) => {
        let selectedItems = [];
        let newItems = [];
        console.log(ids.length);
        for (const id of ids) {
            const selectedItem = findItemById(items, id);
            if (!queryVars?.includes(selectedItem)) {
                newItems = [...newItems, selectedItem];
            }
            else {
                selectedItems = [...selectedItems, selectedItem];
            }
        }
        let allItems = selectedItems.concat(newItems);
        const filteredItems = [];

        allItems.sort((a, b) => a?.fullpath?.length - b?.fullpath?.length);
        for (let item of allItems) {
            if (!item) continue;
            if (!filteredItems.some(parent => item.fullpath.startsWith(parent.fullpath))) {
                filteredItems.push(item);
            }
        }
        // selectedItems.forEach((selectedItem) => {
        //     if (!newItems) return;
        //     newItems.
        //     // are any of the selectedItems children of the newItem? - is newItem.fullpath contained in any of the selectedItems.fullpath?
        //     // console.log(newItem.fullpath, ' --- ', selectedItem.fullpath.substring(0, newItem.fullpath.length));
        //     if (newItem.fullpath === selectedItem.fullpath.substring(0, newItem.fullpath.length)) {
        //         console.log('redundant parent selected')
        //     }
        //     if (newItem.fullpath.substring(0, selectedItem.fullpath.length) === selectedItem.fullpath) {
        //         console.log('redundant child selected')
        //     }
        // })
        // const newSelections = (newItem) ? [...selectedItems, newItem] : selectedItems;
        setQueryVars(filteredItems);
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
                        onSelectedItemsChange={handleItemSelectionToggle}
                        checkboxSelection
                        multiSelect
                        selectionPropagation={selectionPropagation}
                    />
                </Box>
            ) : (
                <div className='err-msg'>Select a dataset to open the query constructor!</div>
            )}
            {queryVars?.length ? 0 > (
                <ul>
                    {queryVars.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : (
                <div>No items are selected - yet.</div>
            )}
        </div>
    );
};

export default TreeView;