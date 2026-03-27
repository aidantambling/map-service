import { AnimatePresence, motion } from "motion/react"
import { useState } from "react";
import "./Modal.scss"

const Modal = ({ onClose, render }) => {
    return (
        <motion.div
            className="overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div
                className="modal-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                {render}
            </motion.div>
        </motion.div>
    )
}

function ModalWrapper({ title, children }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="modal-wrapper">
            <button className="open-button" onClick={() => setIsOpen(true)}>
                {title}
            </button>

            <AnimatePresence>
                {isOpen && <Modal onClose={() => setIsOpen(false)} render={children} />}
            </AnimatePresence>
        </div>
    )
}

export default ModalWrapper