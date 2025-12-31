import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';

interface EditWidgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, componentId: string) => void;
    initialName: string;
    initialComponentId: string;
}

export const EditWidgetModal = ({ isOpen, onClose, onSave, initialName, initialComponentId }: EditWidgetModalProps) => {
    const [name, setName] = useState(initialName);
    const [componentId, setComponentId] = useState(initialComponentId);

    const componentSuggestions = [
        'Header', 'Footer', 'Search Bar', 'Microphone', 'Carousel',
        'Service Matrix', 'Button', 'Map', 'Video Player', 'Camera View',
        'Weather Widget', 'Clock', 'SOS Button', 'Language Toggle'
    ];

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setComponentId(initialComponentId);
        }
    }, [isOpen, initialName, initialComponentId]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(name, componentId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[400px] bg-[#1a1a24] border border-[#2a2a3d] rounded-xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[#8888a0] hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-lg font-semibold text-white mb-6">Edit Widget</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#8888a0]">Widget Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            list="component-suggestions"
                            className="w-full h-10 px-3 bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg text-[#f0f0f5] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none transition-all placeholder:text-[#555566]"
                            placeholder="e.g. Header, Main Content"
                            autoFocus
                        />
                        <datalist id="component-suggestions">
                            {componentSuggestions.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#8888a0]">Component ID (for JSON)</label>
                        <input
                            type="text"
                            value={componentId}
                            onChange={(e) => setComponentId(e.target.value)}
                            className="w-full h-10 px-3 bg-[#0a0a0f] border border-[#2a2a3d] rounded-lg text-[#f0f0f5] focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none transition-all placeholder:text-[#555566]"
                            placeholder="e.g. com.myapp.header"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-[#8888a0] hover:text-white hover:bg-[#2a2a3d] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#6366f1] text-white hover:bg-[#818cf8] transition-colors shadow-lg shadow-[#6366f1]/20"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
