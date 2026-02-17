import { useContext, useRef, useState, useEffect } from "react";
import { Box, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { UIContext } from "../contexts/UIContext";
import { FaArrowUp } from "react-icons/fa";
import "./VerticalToggleButtons.scss";

// opener IconButton
const sx = {
    width: { xs: 33, md: 44 },
    height: { xs: 33, md: 44 },
    borderRadius: 2,
    bgcolor: "#1976d2",
    color: "#fff",
    p: 0,
    "&:hover": { bgcolor: "#42a5f5" },
    "& svg, & img": { width: "60%", height: "60%", display: "block", objectFit: "contain" },
};

// for CustomToggleButton (styled):
const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
    width: 33, height: 33, minWidth: 33, minHeight: 33, padding: 0,
    border: 0, borderRadius: 8, color: "#fff", backgroundColor: "#1976d2",
    "&:hover": { backgroundColor: "#42a5f5 !important" },
    "&.Mui-selected": { backgroundColor: "#004ba0 !important", fontWeight: "bold" },
    "& svg, & img": { width: "60%", height: "60%", display: "block", objectFit: "contain" },
    [theme.breakpoints.up("md")]: {
        width: 44, height: 44, minWidth: 44, minHeight: 44,
    },
}));
export default function VerticalToggleButtons({ queryVars }) {
    const { geographyMode, uiDispatch } = useContext(UIContext);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    const modes = [
        { id: "US", label: "US", img: "toggle_imgs/US.png" },
        { id: "State", label: "State", img: "toggle_imgs/State.png" },
        { id: "County", label: "County", img: "toggle_imgs/County.png" },
        { id: "Region", label: "Region", img: "toggle_imgs/Region.png" },
        { id: "Division", label: "Division", img: "toggle_imgs/Division.png" },
        { id: "CountySubdivision", label: "County Subdivision", img: "toggle_imgs/CountySubdivision.png" },
        { id: "Place", label: "Place", img: "toggle_imgs/Place.png" },
        { id: "AIANNH", label: "American Indian, Alaskan Native, Native Hawaiaan", img: "toggle_imgs/AIANNH.png" },
    ];

    const handleModeChange = (_e, next) => {
        if (next == null) return;
        // if (queryVars.current.length === 0) return;
        uiDispatch({ type: "SET_GEOGRAPHY_MODE", geographyMode: next });
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (e.key === "Escape") setOpen(false);
    };

    const onBlur = (e) => {
        const next = e.relatedTarget;
        if (!wrapRef.current || !next || !wrapRef.current.contains(next)) setOpen(false);
    };

    return (
        <Tooltip title={`${geographyMode} view (click to change)`} placement="right" enterDelay={400}>
            <div ref={wrapRef} className="mode-wrap" onKeyDown={onKeyDown} onBlur={onBlur}>
                <IconButton
                    onClick={() => setOpen(o => !o)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-controls="geo-mode-panel"
                    aria-label="Select Geography Type"
                    sx={sx}
                >
                    <Box
                        component="img"
                        src={modes.find(m => m.id === geographyMode)?.img}
                        alt=""
                    />
                </IconButton>

                {open && (
                    <ToggleButtonGroup
                        id="geo-mode-panel"
                        value={geographyMode}
                        exclusive
                        onChange={handleModeChange}
                        orientation="vertical"
                        aria-label="Geography type"
                        className="mode-panel"
                    >
                        {modes.map(m => (
                            <Tooltip title={m.label} placement="left" key={m.id}>
                                <CustomToggleButton value={m.id} aria-label={m.label}>
                                    <img src={m.img} alt="" />
                                </CustomToggleButton>
                            </Tooltip>
                        ))}
                    </ToggleButtonGroup>
                )}
            </div>
        </Tooltip>
    );
}
