
function SparkleIcon({ size = 24 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Main sparkle */}
            <path
                d="M9.5 3L11.1 7.9L16 9.5L11.1 11.1L9.5 16L7.9 11.1L3 9.5L7.9 7.9L9.5 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />

            {/* Small upper-right sparkle */}
            <path
                d="M18 2.5L18.8 5.2L21.5 6L18.8 6.8L18 9.5L17.2 6.8L14.5 6L17.2 5.2L18 2.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default SparkleIcon;
