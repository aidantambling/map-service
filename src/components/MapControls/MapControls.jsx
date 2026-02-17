import { useRef } from "react";
import { ButtonGroup, IconButton } from '@mui/material';
import VerticalToggleButtons from '../VerticalToggleButtons';
import { FaPlus, FaMinus, FaMapMarkerAlt } from "react-icons/fa";

export default function MapControls({ queryVars, svgRef, zoomRef }) {
    const btnSx = {
        width: { xs: 33, md: 44 },
        height: { xs: 33, md: 44 },
        borderRadius: 2,
        bgcolor: "#1976d2",
        color: "#fff",
        p: 0,
        "&:hover": { bgcolor: "#42a5f5" },
        "& svg, & img": { width: "60%", height: "60%", display: "block", objectFit: "contain" },
    };

    // zoom functions
    const initialTransform = useRef(d3.zoomIdentity);
    const zoomIn = () =>
        d3.select(svgRef.current)
            .transition().duration(200)
            .call(zoomRef.current.scaleBy, 1.2);

    const zoomOut = () =>
        d3.select(svgRef.current)
            .transition().duration(200)
            .call(zoomRef.current.scaleBy, 0.8);

    const resetZoom = () =>
        d3.select(svgRef.current)
            .transition().duration(250)
            .call(zoomRef.current.transform, initialTransform.current);

    return (
        <ButtonGroup
            aria-label="Map controls"
            sx={{
                display: "inline-grid",
                gridAutoFlow: "column",
                gridAutoColumns: { xs: "33px", md: "44px" },
                gap: { xs: 0.5, md: 1 },
            }}
        >
            <IconButton onClick={zoomIn} sx={btnSx} aria-label="Zoom in"><FaPlus /></IconButton>
            <IconButton onClick={zoomOut} sx={btnSx} aria-label="Zoom out"><FaMinus /></IconButton>
            <IconButton onClick={resetZoom} sx={btnSx} aria-label="Center map"><FaMapMarkerAlt /></IconButton>

            <VerticalToggleButtons queryVars={queryVars} />
        </ButtonGroup>
    );
}