import { React, useRef, useEffect } from 'react'
import { ListViewComponent } from '@syncfusion/ej2-react-lists';
import './RecursiveSelect.css';

const RecursiveSelect = ({ selectData, selectHeader, setSelectedElement }) => {
    const listRef = useRef(null);

    const getSelectedItems = () => {
        if (listRef.current) {
            console.log(listRef.current.getSelectedItems())
            setSelectedElement({
                concept: listRef.current.getSelectedItems().text,
                group: listRef.current.getSelectedItems().data.group
            });
        }
    };

    useEffect(() => {
        console.log(selectData)
    }, [selectData])

    const handleSelect = () => {
        getSelectedItems();
    };

    function conceptRetard() {
        return selectData?.map(item => ({
            text: item.concept,
            group: item.group
        }));
    }

    return (
        <div>
            {
                selectHeader === 'Concepts' ?
                    <ListViewComponent
                        id="list"
                        dataSource={conceptRetard()}
                        fields={{ tooltip: "text" }}
                        showHeader={true}
                        headerTitle={selectHeader}
                        ref={listRef}
                        selectionSettings={{ mode: 'Single' }}
                        select={handleSelect}
                    />
                    :
                    <ListViewComponent
                        id="list"
                        dataSource={selectData}
                        fields={{ tooltip: "text" }}
                        showHeader={true}
                        headerTitle={selectHeader}
                        ref={listRef}
                        selectionSettings={{ mode: 'Single' }}
                        select={handleSelect}
                    />
            }
        </div>
    );
};

export default RecursiveSelect;