import { IconVote } from "@/components/Icons";
import Button from "@/components/ui/Button";
import React from "react";

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    count: number, 
    className?: string
}

export default ({ 
    count, 
    className = "",
     ...props 
    }: Props) => (
    <Button {...props} className={`flex items-center gap-x-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 ${className}`}>
        <div className="flex items-center gap-x-2">                            
            <IconVote className="w-5 h-5" />
            { count }
        </div>
        <span className="w-px h-4 bg-orange-50"></span>
        Upvote
    </Button>
)