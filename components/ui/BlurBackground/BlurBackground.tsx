import mergeTW from "@/libs/mergeTW";

export default ({
    className = "",
    isActive, 
    setActive = () => null,
    ...props
}: {isActive: boolean, setActive?: (bool: boolean) => void, className?: string}) => (
    <div
    {...props}
    className={`${
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
    } transform duration-200 z-10 fixed top-0 w-screen h-screen bg-black/20 backdrop-blur-sm ${mergeTW(className)}`}
    onClick={() => setActive(false)}></div>
)