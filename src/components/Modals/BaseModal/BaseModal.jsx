import React, { useState } from "react";
import 'react-multi-carousel/lib/styles.css';
import PropTypes from 'prop-types';
import { useSpring, animated } from '@react-spring/web';
import Modal from '@mui/material/Modal';
import "./BaseModal.scss";

const Fade = React.forwardRef(function Fade(props, ref) {
    const {
        children,
        in: open,
        onClick,
        onEnter,
        onExited,
        ownerState,
        ...other
    } = props;
    const style = useSpring({
        from: { opacity: 0 },
        to: { opacity: open ? 1 : 0 },
        onStart: () => {
            if (open && onEnter) {
                onEnter(null, true);
            }
        },
        onRest: () => {
            if (!open && onExited) {
                onExited(null, true);
            }
        },
    });

    return (
        <animated.div ref={ref} style={style} {...other}>
            {React.cloneElement(children, { onClick })}
        </animated.div>
    );
});

Fade.propTypes = {
    children: PropTypes.element.isRequired,
    in: PropTypes.bool,
    onClick: PropTypes.any,
    onEnter: PropTypes.func,
    onExited: PropTypes.func,
    ownerState: PropTypes.any,
};

const BaseModal = React.forwardRef(function BaseModal({ dataTitle, dataSubtitle, open, handleOpen, handleClose, children, ...props }, ref) {
    // handle opening/closing of modal(s)
    return (
        <div {...props} ref={ref} className='dataset-modal'>
            <button onClick={handleOpen} className="dataset-modal-btn">
                <p className='dm-button-title'>{dataTitle}</p>
                <p className='dm-button-sub'>
                    {
                        // truncate the title length if > 27 chars
                        dataSubtitle.length > 27 ?
                            dataSubtitle.slice(0, 24) + '...'
                            :
                            dataSubtitle
                    }
                </p>
            </button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Fade in={open}>
                    {children}
                </Fade>
            </Modal>
        </div>
    );
});

export default BaseModal;