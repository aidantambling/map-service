import { useState } from "react";
import { ColorPicker, useColor } from "react-color-palette";
import "react-color-palette/css";
import "./ColorModal.scss";
import ModalWrapper from "../Modal";

const SettingsModal = ({ palettes, setSelectedPalette, selectedPalette }) => {
    const [activeTab, setActiveTab] = useState('preset');
    const [color, setColor] = useColor("#561ecb");
    const [customColors, setCustomColors] = useState(['#ffffff', '#ffffff', '#ffffff', '#ffffff']);
    const [selectedBox, setSelectedBox] = useState(null);

    const changePalette = (palette) => {
        setSelectedPalette(palette);
    }

    const handleColorChange = (color) => {
        if (selectedBox !== null) {
            const newColors = [...customColors];
            newColors[selectedBox] = color.hex;
            setCustomColors(newColors);
            setColor(color)
        }
    }

    const handleBoxClick = (index) => {
        setSelectedBox(index);
    };

    return (
        <ModalWrapper title={"Select Color"}>
            <div className="color-layout">
                <div className="palette-selection-bar">
                    <button className={activeTab === 'preset' ? 'activeTab' : 'inactiveTab'} onClick={() => { setActiveTab('preset') }}>Preset color palettes</button>
                    <button className={activeTab === 'custom' ? 'activeTab' : 'inactiveTab'} onClick={() => { setActiveTab('custom') }}>Create your own palette</button>
                </div>
                <div className="color-selection-section">
                    {activeTab === 'preset' ?
                        <div className='color-templates-grid'>
                            {
                                palettes && palettes.length > 0 ?
                                    <>
                                        {palettes.map((palette, index) => (
                                            <button className={palette.id == selectedPalette.id ? 'selected-button' : ''} onClick={() => { changePalette(palette) }}>
                                                <div className='palette-colors'>
                                                    {palette.colors.map((color, idx) => (
                                                        <div key={idx} className='palette-color-box' style={{ backgroundColor: color }}></div>
                                                    ))}
                                                </div>
                                                <h3>{palette.name}</h3>
                                            </button>
                                        ))}
                                    </>
                                    :
                                    <></>
                            }
                        </div>
                        :
                        <div className="custom-color-div">
                            <ColorPicker color={color} onChange={handleColorChange} />
                            {
                                customColors && customColors.length > 0 ?
                                    <>
                                        <div className='custom-colors-container'>
                                            {
                                                customColors.map((color, index) => (
                                                    <div
                                                        key={index}
                                                        className={`selectable-color-box ${selectedBox === index ? 'selected' : ''}`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => handleBoxClick(index)}
                                                    >
                                                        <h3>
                                                            {color}
                                                        </h3>
                                                    </div>

                                                ))
                                            }

                                        </div>
                                        <button onClick={() => { setSelectedPalette(customColors) }}>Set As Active Palette</button>
                                    </>
                                    :
                                    <>No colors selected</>
                            }
                        </div>
                    }

                </div>
            </div>
        </ModalWrapper>
    );
}

export default SettingsModal;