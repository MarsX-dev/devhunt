import mergeTW from "@/libs/mergeTW";
import { ReactNode } from "react";

export default ({
    src,
    className,
    imgClassName,
    alt,
}:Record<string, string>) => (
    <div className={mergeTW(`flex-none  ${className}`)}>
        <img src={src} alt={alt} className={mergeTW(`w-16 h-16 rounded-full  ${imgClassName}`)} />
    </div>
)