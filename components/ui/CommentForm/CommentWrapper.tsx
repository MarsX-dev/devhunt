import mergeTW from "@/libs/mergeTW";
import { ReactNode } from "react";

export const CommentWrapper = ({ children, className }: { children: ReactNode, className?: string }) => (
    <div className={mergeTW(`flex gap-x-4 items-start ${className}`)}>
        { children }
    </div>
)