import { AnimatePresence, motion, } from "motion/react"
import "./AnimatedInputSwitch.scss"

const AnimatedInputSwitch = ({ color, setSlide, direction, selectedItem, children }) => {
    return (
        <div className="slider-flex">
            <motion.button
                type="button"
                initial={false}
                animate={{ backgroundColor: color }}
                aria-label="Previous"
                className="swap-button"
                onClick={() => setSlide(-1)}
                whileFocus={{ outline: `2px solid ${color}` }}
                whileTap={{ scale: 0.9 }}
            >
            </motion.button>
            <AnimatePresence custom={direction} initial={false} mode="popLayout">
                {children}
            </AnimatePresence>
        </div>
    )
}

export default AnimatedInputSwitch