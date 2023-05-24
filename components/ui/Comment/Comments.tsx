import { HTMLAttributes, ReactNode, useEffect } from "react";

interface Props extends HTMLAttributes<HTMLUListElement> {
    children: ReactNode,
}

export const Comments = ({ children, ...props }: Props) => {
    useEffect(() => {
        const commentDividedBar = document.querySelectorAll(".comment-divided-bar")
        const commentDividedLength = commentDividedBar.length
        commentDividedLength > 0 ? (commentDividedBar[commentDividedLength -1] as HTMLElement).remove() : null

    }, [])
    return (
        <ul {...props}>
            { children }
        </ul>
    )
}