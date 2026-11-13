import QRCode from "qrcode";

// A QR code as plain SVG squares: drawn on the server or in the browser, no image to fetch,
// sharp at any size. `quiet` is the white margin scanners need around it, in squares.
export function QrCode({ value, size = 160, color = "#000000", background = "#ffffff", quiet = 2, className }: { value: string; size?: number; color?: string; background?: string; quiet?: number; className?: string }) {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    const count = modules.size;
    const span = count + quiet * 2;

    // one path of 1×1 squares is far lighter than a <rect> per square
    let path = "";
    for (let y = 0; y < count; y++) {
        for (let x = 0; x < count; x++) {
            if (modules.get(y, x)) path += `M${x + quiet} ${y + quiet}h1v1h-1z`;
        }
    }

    return (
        <svg viewBox={`0 0 ${span} ${span}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR code" className={className}>
            <rect width={span} height={span} fill={background} />
            <path d={path} fill={color} />
        </svg>
    );
}
