import { React, useEffect, useState } from 'react'
import RecursiveSelect from "./RecursiveSelect";

const DynamicForm = ({ onSubmit, labels, concepts, selectedConcept, setSelectedConcept }) => {
    const [selectedLabel, setSelectedLabel] = useState();

    useEffect(() => {
        // console.log(labels)
    }, [labels])

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(selectedLabel, selectedConcept); }}>
            {
                concepts?.length == 1 ?
                    <></> :
                    <RecursiveSelect selectData={concepts} selectHeader={'Concepts'} setSelectedElement={setSelectedConcept} />
            }
            <RecursiveSelect selectData={labels} selectHeader={'Labels (Subconcepts)'} setSelectedElement={setSelectedLabel} />
            <button type="submit">Add Query to Submission</button>
        </form>
    );
};

export default DynamicForm;