import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import { Tooltip, Accordion, AccordionSummary, AccordionDetails, Button, CircularProgress, Modal } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BaseModal from "../BaseModal/BaseModal";
import ModalWrapper from "../Modal";
import { findConcepts } from "../../useCensusData";
import "./DatasetModal.scss";

const DatasetModal = ({ nameGroups, renderConcepts, dataTitle, setDataTitle, setTitle }) => {
    // Open/close handled here, same as ColorModal
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    // Tier selection state
    const [selectedT1, setSelectedT1] = useState(null);          // a nameGroup object
    const [tier2List, setTier2List] = useState([]);              // [{ group, concept }, ...]
    const [loading, setLoading] = useState(false);
    const [selectedT2, setSelectedT2] = useState(null);          // one of tier2List

    // Load tier-2 when tier-1 changes
    useEffect(() => {
        if (!selectedT1) return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await findConcepts(selectedT1.groupPrefix);
                if (!cancelled) setTier2List(res || []);
            } catch (e) {
                if (!cancelled) setTier2List([]);
                // optionally log
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [selectedT1]);

    const confirmSelection = () => {
        if (!selectedT1 || !selectedT2) return;
        // Update parent-facing labels and trigger render
        setTitle(`${selectedT1.conceptGroup} => ${selectedT2.concept}`);
        setDataTitle(selectedT2.concept);
        renderConcepts(selectedT2.group);
        handleClose();
    };

    return (
        <ModalWrapper title={"Select Dataset"}>
            <div className="dataset-layout">
                <div className="tier1-column">
                    <h1 className="tier-heading">Browse categories</h1>
                    <div className="tier1-grid">
                        {nameGroups?.map((ng, idx) => (
                            <Tooltip title={ng.conceptGroup}>
                                <button
                                    className={`dataset-tile ${selectedT1?.conceptGroup === ng.conceptGroup ? "is-selected" : ""}`}
                                    onClick={() => { setSelectedT1(ng); setSelectedT2(null); }}
                                >
                                    {ng.conceptGroup.length > 60 ? `${ng.conceptGroup.slice(0, 57)}…` : ng.conceptGroup}
                                </button>
                            </Tooltip>
                        ))}
                    </div>
                </div>

                <div className="tier2-column">
                    <h1 className="tier-heading">
                        {selectedT1 ? selectedT1.conceptGroup : "Pick a category"}
                    </h1>

                    {loading && (
                        <div className="tier2-loading">
                            <CircularProgress size={24} />
                        </div>
                    )}

                    {!loading && selectedT1 && (
                        <div className="tier2-list">
                            {tier2List.map((t2) => (
                                <Accordion
                                    key={t2.group}
                                    disableGutters
                                    expanded={selectedT2?.group === t2.group}
                                    onChange={(_, isExp) => setSelectedT2(isExp ? t2 : null)}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <div className="t2-row">
                                            <span className="t2-title">{t2.concept}</span>
                                            {selectedT2?.group === t2.group && <span className="t2-chip">Selected</span>}
                                        </div>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <p className="t2-desc">Group code: {t2.group}</p>
                                        <Button variant="contained" size="small" onClick={confirmSelection}>
                                            Use this set
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                            {tier2List.length === 0 && (
                                <div className="tier2-empty">No sets found for this category.</div>
                            )}
                        </div>
                    )}

                    {!loading && !selectedT1 && (
                        <div className="tier2-empty">Select a category to see available sets.</div>
                    )}
                </div>
            </div>
        </ModalWrapper>
    );
};

export default DatasetModal;
