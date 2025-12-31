import React, { useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

interface FrameEditorProps {
    frameUrl: string;
    avatarUrl: string | null;
    scale: number;
    rotation: number;
    faceCenter?: { x: number, y: number } | null;
    avatarPosition?: { x: number, y: number };
    onPositionChange?: (pos: { x: number, y: number }) => void;
}

interface URLImageProps extends Omit<React.ComponentProps<typeof KonvaImage>, 'image'> {
    src: string;
    faceCenter?: { x: number, y: number } | null;
    useCenterPivot?: boolean;
}

const URLImage = ({ src, faceCenter, useCenterPivot = false, ...props }: URLImageProps) => {
    const [image] = useImage(src, 'anonymous');
    
    // Calculate Pivot Point (Offset)
    // Only calculate if useCenterPivot is true (for Avatar) or faceCenter provided
    let offsetX = props.offsetX || 0;
    let offsetY = props.offsetY || 0;

    if (useCenterPivot || faceCenter) {
        offsetX = faceCenter ? faceCenter.x : (image ? image.width / 2 : 0);
        offsetY = faceCenter ? faceCenter.y : (image ? image.height / 2 : 0);
    }

    return (
        <KonvaImage 
            image={image} 
            offsetX={offsetX}
            offsetY={offsetY}
            {...props} 
        />
    );
};

export const FrameEditor = React.forwardRef<Konva.Stage, FrameEditorProps>(({ frameUrl, avatarUrl, scale, rotation, faceCenter, avatarPosition, onPositionChange }, ref) => {
    const stageRef = useRef<Konva.Stage>(null);


    // Initial canvas size - responsive handling would be better, but fixed for MVP
    const width = 500;
    const height = 500;

    // Expose stage ref
    React.useImperativeHandle(ref, () => stageRef.current as Konva.Stage);

    return (
        <div className="flex justify-center items-center bg-gray-900/10 dark:bg-black/40 p-8 rounded-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
             <div 
                className="overflow-hidden shadow-2xl rounded-sm ring-1 ring-black/10"
                style={{
                    // Photoshop-style checkerboard pattern for transparency
                    backgroundImage: `
                        linear-gradient(45deg, #ccc 25%, transparent 25%),
                        linear-gradient(-45deg, #ccc 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #ccc 75%),
                        linear-gradient(-45deg, transparent 75%, #ccc 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    backgroundColor: '#fff',
                    width: width,
                    height: height
                }}
            >
            <Stage width={width} height={height} ref={stageRef}>
                <Layer>
                    {/* Avatar Layer (Bottom) */}
                    {avatarUrl && (
                        <URLImage 
                            src={avatarUrl}
                            x={avatarPosition ? avatarPosition.x : width / 2}
                            y={avatarPosition ? avatarPosition.y : height / 2}
                            // offsetX/Y are now handled inside URLImage to support dynamic face center
                            scaleX={scale}
                            scaleY={scale}
                            rotation={rotation}
                            draggable
                            onDragEnd={(e: any) => {
                                if (onPositionChange) {
                                    onPositionChange({ x: e.target.x(), y: e.target.y() });
                                }
                            }}
                            faceCenter={faceCenter}
                            useCenterPivot={true}
                        />
                    )}
                </Layer>
                <Layer listening={false}>
                    {/* Frame Layer (Top) - Pointer events disabled to let clicks pass through to avatar if needed, 
                        BUT usually frame covers edges. If frame has transparent center, clicks pass through transparent pixels in Konva? 
                        No, usually we need to be careful. For now, let's keep interactions on avatar.
                        Actually, if the frame covers the whole area, we might need to handle 'listening' prop carefully.
                    */}
                    <URLImage 
                        src={frameUrl} 
                        width={width} 
                        height={height}
                        listening={false} // Click through to avatar
                    />
                </Layer>
            </Stage>
            </div>
        </div>
    );
});
