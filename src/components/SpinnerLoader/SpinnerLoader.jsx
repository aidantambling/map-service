import React from 'react'

const SpinnerLoader = ({ showSpinner, source }) => {

    return (
        <div style={{ zIndex: '50', position: 'relative' }}>
            {
                showSpinner ? (
                    <img src={source} />
                ) : (
                    <h3></h3>
                )
            }
        </div>
    )
}

export default SpinnerLoader